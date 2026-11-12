// Offline regression: render the real PDF generator using a representative legacy
// API fixture. No live records or authentication credentials are used.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

(async () => {
  const renderer = await import('@react-pdf/renderer');
  const cache = new Map();
  const blocked = () => { throw new Error('PDF preview must not write asset movements'); };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const source = fs.readFileSync(filename, 'utf8').replace(
      '`${window.location.origin}/images/erc-logo.png`',
      JSON.stringify('data:image/png;base64,' + fs.readFileSync(path.join(root, 'public/images/erc-logo.png')).toString('base64')));
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const module = { exports: {} };
    const localRequire = name => {
      if (name === '@react-pdf/renderer') return renderer;
      if (name === '@/api/asset/ppe') return { ppeApi: { editMovement: blocked } };
      if (name === '@/api/asset/se') return { seApi: { editMovement: blocked } };
      if (name === '@/utils/secureStorage') return { secureStorage: { getItem: blocked } };
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
      if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts')));
      return require(name);
    };
    const factory = vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename });
    factory(localRequire, module, module.exports);
    cache.set(filename, module.exports);
    return module.exports;
  }
  global.window = { location: { origin: path.join(root, 'public').replace(/\\/g, '/') } };
  const { ptrPeopleFields } = load('src/components/assets/reports/ptrReportData.ts');
  const { PTRGenerator } = load('src/components/assets/reports/PTRGenerator.tsx');
  delete global.window;
  const employee = { id: 22, firstName: 'Leopoldo', middleName: 'Tenidero', lastName: 'Enriquez',
    position: { name: 'Stenographer III' }, office: { acronym: 'LS' }, division: { acronym: 'LDCC' } };
  const people = ptrPeopleFields({ plantillaEmployeeId: 0, nonPlantillaEmployee: employee,
    previousPlantillaEmployeeId: 11, previousPlantillaEmployeeName: 'Roselle M. Guintu', previousNonPlantillaEmployee: employee });
  const asset = { id: 1, propertyNumber: '10605030-02-CPR-LT-650/2020-05-03-LT35-11',
    description: 'HP Elitebook x360 1030 G2 w/ bag SN#5CG9451N9D-650',
    dateAcquired: '2020-01-27', unitValue: 68640, condition: 'Serviceable' };
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const output = path.join(root, 'node_modules/.cache/ptr-verification');
  fs.mkdirSync(output, { recursive: true });
  async function render(assets, filename) {
    const url = await PTRGenerator.generatePTRPreviewMultiple(people.fromEmployee, people.toEmployee,
      assets, '2026-09-30', '', '2026-09-031', '', people.nonPlantillaEmployee, people.toEmployeePositionOffice);
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    URL.revokeObjectURL(url);
    fs.writeFileSync(path.join(output, filename + '.pdf'), bytes);
    const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      text += (await page.getTextContent()).items.map(item => item.str).join(' ') + '\n';
    }
    return { doc, text: text.replace(/\s+/g, ' ') };
  }
  const { doc, text } = await render([asset], 'reference-fixture');
  assert.equal(doc.numPages, 1);
  assert.match(text, /From Accountable Officer: LEOPOLDO TENIDERO ENRIQUEZ/);
  assert.match(text, /To Accountable Officer: LEOPOLDO TENIDERO ENRIQUEZ/);
  assert.match(text, /Stenographer III - LS, LDCC/);
  assert.doesNotMatch(text, /Sub-PAR\s*:\s*LEOPOLDO/);
  assert.match(text, /68,640\.00/);
  const { createCanvas } = require('@napi-rs/canvas');
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  fs.writeFileSync(path.join(output, 'reference-fixture.png'), canvas.toBuffer('image/png'));
  assert.ok(text.replace(/\s/g, '').includes(asset.propertyNumber), text);
  const many = await render(Array.from({ length: 35 }, (_, i) => ({ ...asset, id: i + 1,
    propertyNumber: `PROPERTY-${i + 1}`, description: 'Full description '.repeat(20) + `END-OF-ITEM-${i + 1}` })), 'multipage-fixture');
  assert.ok(many.doc.numPages > 1);
  for (let i = 1; i <= 35; i++) assert.ok(many.text.includes(`END-OF-ITEM-${i}`));
  assert.equal((many.text.match(/Approved by:/g) || []).length, 1);
  console.log('PDF checks passed: names, designation, blank Sub-PAR, complete property number, amount, and 35 long descriptions.');
  console.log('Preview:', path.join(output, 'reference-fixture.png'));
})().catch(error => { console.error(error); process.exitCode = 1; });
