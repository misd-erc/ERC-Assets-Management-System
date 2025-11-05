#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * CLI tool to refactor API files based on feature/module usage
 * Automatically organizes API files in src/api folder
 */

class ApiRefactor {
  constructor(options = {}) {
    this.srcPath = options.src || './src';
    this.apiPath = options.target || path.join(this.srcPath, 'api');
    this.groupBy = options.groupBy || 'feature';
    this.updateImports = options.updateImports !== false;
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    this.apiFiles = [];
    this.importMappings = new Map();
    this.fileMoves = [];
    this.importUpdates = [];
  }

  log(message, force = false) {
    if (this.verbose || force) {
      console.log(message);
    }
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  info(message) {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Scan the entire project for API imports
   */
  scanImports() {
    this.log('🔍 Scanning project for API imports...');

    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (stat.isFile() && /\.(js|ts|jsx|tsx)$/.test(file)) {
          this.analyzeFileImports(filePath);
        }
      }
    };

    scanDirectory(this.srcPath);
  }

  /**
   * Analyze imports in a single file
   */
  analyzeFileImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.srcPath, filePath);
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Match import statements from API files
        const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]*?)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];

          // Check if it's importing from our API folder
          if (importPath.startsWith('./api/') || importPath.startsWith('../api/') || importPath === '../api') {
            const apiFile = this.resolveApiFile(importPath, path.dirname(filePath));

            if (apiFile && this.apiFiles.includes(apiFile)) {
              if (!this.importMappings.has(apiFile)) {
                this.importMappings.set(apiFile, []);
              }
              this.importMappings.get(apiFile).push({
                file: relativePath,
                line: index + 1,
                importPath,
                fullPath: filePath
              });
            }
          }
        }
      });
    } catch (error) {
      this.log(`Warning: Could not analyze ${filePath}: ${error.message}`);
    }
  }

  /**
   * Resolve API file from import path
   */
  resolveApiFile(importPath, fromDir) {
    // Convert relative import to absolute path
    let apiFilePath;

    if (importPath.startsWith('./api/')) {
      apiFilePath = path.resolve(fromDir, importPath);
    } else if (importPath.startsWith('../api/')) {
      apiFilePath = path.resolve(fromDir, importPath);
    } else if (importPath === '../api') {
      apiFilePath = path.resolve(fromDir, importPath);
    } else {
      return null;
    }

    // Check if it resolves to an API file
    const apiDir = path.resolve(this.apiPath);
    if (!apiFilePath.startsWith(apiDir)) {
      return null;
    }

    // Get the API filename
    const relativeToApi = path.relative(apiDir, apiFilePath);
    const apiFile = relativeToApi.replace(/\.ts$/, '') + '.ts';

    return apiFile;
  }

  /**
   * Load API files from the API directory
   */
  loadApiFiles() {
    this.log('📁 Loading API files...');

    if (!fs.existsSync(this.apiPath)) {
      this.error(`API directory not found: ${this.apiPath}`);
      process.exit(1);
    }

    const files = fs.readdirSync(this.apiPath);
    this.apiFiles = files.filter(file =>
      file.endsWith('.ts') &&
      file !== 'index.ts' &&
      !file.startsWith('.')
    );

    this.log(`Found ${this.apiFiles.length} API files: ${this.apiFiles.join(', ')}`);
  }

  /**
   * Determine grouping strategy for each API file
   */
  determineGrouping() {
    this.log(`🎯 Determining ${this.groupBy} groupings...`);

    const groupings = new Map();

    for (const apiFile of this.apiFiles) {
      const group = this.getGroupForApi(apiFile);
      if (!groupings.has(group)) {
        groupings.set(group, []);
      }
      groupings.get(group).push(apiFile);
    }

    return groupings;
  }

  /**
   * Get the group/folder for an API file based on strategy
   */
  getGroupForApi(apiFile) {
    const fileName = apiFile.replace('.ts', '');

    // Analyze usage patterns to determine grouping
    const imports = this.importMappings.get(apiFile) || [];
    const usagePatterns = this.analyzeUsagePatterns(imports);

    switch (this.groupBy) {
      case 'feature':
        return this.groupByFeature(fileName, usagePatterns);
      case 'module':
        return this.groupByModule(fileName, usagePatterns);
      case 'page':
        return this.groupByPage(fileName, usagePatterns);
      default:
        return 'misc';
    }
  }

  /**
   * Analyze usage patterns from import locations
   */
  analyzeUsagePatterns(imports) {
    const patterns = {
      auth: 0,
      user: 0,
      dashboard: 0,
      profile: 0,
      assets: 0,
      audit: 0,
      upload: 0,
      storage: 0
    };

    imports.forEach(imp => {
      const filePath = imp.file.toLowerCase();

      if (filePath.includes('auth')) patterns.auth++;
      if (filePath.includes('user')) patterns.user++;
      if (filePath.includes('dashboard')) patterns.dashboard++;
      if (filePath.includes('profile')) patterns.profile++;
      if (filePath.includes('asset')) patterns.assets++;
      if (filePath.includes('audit')) patterns.audit++;
      if (filePath.includes('upload')) patterns.upload++;
      if (filePath.includes('storage')) patterns.storage++;
    });

    return patterns;
  }

  /**
   * Group by feature based on usage patterns
   */
  groupByFeature(fileName, patterns) {
    const featureMap = {
      authApi: 'auth',
      userApi: 'user-management',
      assetApi: 'assets',
      auditApi: 'audit',
      uploadApi: 'storage',
      departmentApi: 'user-management'
    };

    // Override based on usage patterns
    if (patterns.auth > patterns.user && patterns.auth > patterns.dashboard) {
      return 'auth';
    }
    if (patterns.user > patterns.auth && patterns.user > patterns.dashboard) {
      return 'user-management';
    }
    if (patterns.assets > 0) {
      return 'assets';
    }
    if (patterns.audit > 0) {
      return 'audit';
    }
    if (patterns.upload > 0 || patterns.storage > 0) {
      return 'storage';
    }

    return featureMap[fileName] || 'misc';
  }

  /**
   * Group by module (similar to feature but more granular)
   */
  groupByModule(fileName, patterns) {
    // For module grouping, use more specific categorization
    return this.groupByFeature(fileName, patterns);
  }

  /**
   * Group by page/component usage
   */
  groupByPage(fileName, patterns) {
    // Group based on which pages/components use them most
    if (patterns.dashboard > 0) return 'dashboard';
    if (patterns.profile > 0) return 'profile';
    return this.groupByFeature(fileName, patterns);
  }

  /**
   * Plan file moves
   */
  planMoves(groupings) {
    this.log('📋 Planning file moves...');

    for (const [group, files] of groupings) {
      const groupDir = path.join(this.apiPath, group);

      for (const file of files) {
        const fromPath = path.join(this.apiPath, file);
        const toPath = path.join(groupDir, file);

        this.fileMoves.push({
          from: fromPath,
          to: toPath,
          group,
          file
        });
      }
    }
  }

  /**
   * Plan import updates
   */
  planImportUpdates() {
    this.log('🔄 Planning import updates...');

    for (const move of this.fileMoves) {
      const imports = this.importMappings.get(move.file) || [];

      for (const imp of imports) {
        const oldImportPath = imp.importPath;
        const newImportPath = this.calculateNewImportPath(oldImportPath, move.group, move.file);

        if (oldImportPath !== newImportPath) {
          this.importUpdates.push({
            file: imp.fullPath,
            line: imp.line,
            oldPath: oldImportPath,
            newPath: newImportPath,
            apiFile: move.file
          });
        }
      }
    }
  }

  /**
   * Calculate new import path after move
   */
  calculateNewImportPath(oldPath, group, apiFile) {
    // Extract the relative part
    const relativeMatch = oldPath.match(/(\.\.\/)+api/);
    if (!relativeMatch) return oldPath;

    const prefix = relativeMatch[0];
    const newPath = `${prefix}/${group}/${apiFile.replace('.ts', '')}`;

    return newPath;
  }

  /**
   * Execute the refactoring
   */
  async execute() {
    this.info('🚀 Starting API refactoring...');

    // Load and analyze
    this.loadApiFiles();
    this.scanImports();

    // Determine groupings and plan moves
    const groupings = this.determineGrouping();
    this.planMoves(groupings);
    this.planImportUpdates();

    // Show preview
    this.showPreview(groupings);

    if (this.dryRun) {
      this.info('🔍 Dry run mode - no changes will be made');
      return;
    }

    // Execute moves
    this.executeMoves();

    // Update imports
    if (this.updateImports) {
      this.executeImportUpdates();
    }

    // Update index.ts
    this.updateApiIndex(groupings);

    this.success('🎉 API refactoring completed successfully!');
  }

  /**
   * Show preview of changes
   */
  showPreview(groupings) {
    this.info('\n📊 Refactoring Preview:');
    console.log('=' .repeat(50));

    console.log('\n📁 New API Structure:');
    for (const [group, files] of groupings) {
      console.log(`  src/api/${group}/`);
      files.forEach(file => console.log(`    ${file}`));
    }

    console.log('\n📋 File Moves:');
    this.fileMoves.forEach(move => {
      console.log(`  ${move.file} → ${move.group}/${move.file}`);
    });

    if (this.importUpdates.length > 0) {
      console.log(`\n🔄 Import Updates (${this.importUpdates.length}):`);
      this.importUpdates.slice(0, 10).forEach(update => {
        console.log(`  ${path.relative(this.srcPath, update.file)}: ${update.oldPath} → ${update.newPath}`);
      });
      if (this.importUpdates.length > 10) {
        console.log(`  ... and ${this.importUpdates.length - 10} more`);
      }
    }

    console.log('=' .repeat(50));
  }

  /**
   * Execute file moves
   */
  executeMoves() {
    this.log('\n📁 Creating directories and moving files...');

    for (const move of this.fileMoves) {
      const groupDir = path.dirname(move.to);

      // Create group directory if it doesn't exist
      if (!fs.existsSync(groupDir)) {
        fs.mkdirSync(groupDir, { recursive: true });
        this.log(`📁 Created directory: ${path.relative(this.srcPath, groupDir)}`);
      }

      // Move file
      if (fs.existsSync(move.from)) {
        fs.renameSync(move.from, move.to);
        this.log(`📄 Moved: ${move.file} → ${move.group}/${move.file}`);
      } else {
        this.log(`⚠️  Source file not found: ${move.from}`);
      }
    }
  }

  /**
   * Execute import updates
   */
  executeImportUpdates() {
    this.log('\n🔄 Updating import statements...');

    // Group updates by file
    const updatesByFile = new Map();
    this.importUpdates.forEach(update => {
      if (!updatesByFile.has(update.file)) {
        updatesByFile.set(update.file, []);
      }
      updatesByFile.get(update.file).push(update);
    });

    for (const [filePath, updates] of updatesByFile) {
      try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Sort updates by line number (reverse order to avoid offset issues)
        updates.sort((a, b) => b.line - a.line);

        for (const update of updates) {
          const lineIndex = update.line - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const oldLine = lines[lineIndex];
            const newLine = oldLine.replace(update.oldPath, update.newPath);
            lines[lineIndex] = newLine;
            this.log(`🔄 Updated import in ${path.relative(this.srcPath, filePath)}: ${update.oldPath} → ${update.newPath}`);
          }
        }

        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      } catch (error) {
        this.error(`Failed to update ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Update the main API index.ts file
   */
  updateApiIndex(groupings) {
    this.log('\n📝 Updating API index.ts...');

    const indexPath = path.join(this.apiPath, 'index.ts');

    if (!fs.existsSync(indexPath)) {
      this.log('⚠️  API index.ts not found, skipping update');
      return;
    }

    try {
      let content = fs.readFileSync(indexPath, 'utf-8');
      const lines = content.split('\n');
      const newLines = [];

      for (const line of lines) {
        const exportMatch = line.match(/export \* from '\.\/([^']+)';/);
        if (exportMatch) {
          const apiFile = exportMatch[1] + '.ts';

          // Find which group this file moved to
          let newPath = exportMatch[1]; // default to original
          for (const [group, files] of groupings) {
            if (files.includes(apiFile)) {
              newPath = `${group}/${exportMatch[1]}`;
              break;
            }
          }

          newLines.push(`export * from './${newPath}';`);
        } else {
          newLines.push(line);
        }
      }

      fs.writeFileSync(indexPath, newLines.join('\n'), 'utf-8');
      this.log('📝 Updated API index.ts with new paths');
    } catch (error) {
      this.error(`Failed to update API index.ts: ${error.message}`);
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--src':
        options.src = args[++i];
        break;
      case '--target':
        options.target = args[++i];
        break;
      case '--group-by':
        options.groupBy = args[++i];
        break;
      case '--update-imports':
        options.updateImports = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '-h':
      case '--help':
        showHelp();
        return;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  // Set defaults
  options.src = options.src || './src';
  options.target = options.target || path.join(options.src, 'api');
  options.groupBy = options.groupBy || 'feature';
  options.updateImports = options.updateImports !== false;

  // Validate options
  if (!['feature', 'module', 'page'].includes(options.groupBy)) {
    console.error(`Invalid group-by strategy: ${options.groupBy}`);
    console.error('Valid options: feature, module, page');
    process.exit(1);
  }

  // Execute refactoring
  const refactor = new ApiRefactor(options);
  refactor.execute().catch(error => {
    console.error('❌ Refactoring failed:', error);
    process.exit(1);
  });
}

function showHelp() {
  console.log(`
Usage: refactor-api [options]

Description:
  Automatically organize API files in your project based on the feature or module
  where they are used. Keeps your src/api folder clean, modular, and easy to navigate.

Options:
  --src <path>            Path to your source folder (default: ./src)
  --target <path>         Path to your API folder (default: ./src/api)
  --group-by <strategy>   Grouping strategy: "feature", "module", or "page"
  --update-imports        Automatically update import paths after refactoring
  --dry-run               Preview all file moves without applying changes
  --verbose               Show detailed logs and mapping results
  -h, --help              Display help for command

Examples:
  $ refactor-api --dry-run
      → Simulate how your APIs will be reorganized

  $ refactor-api --group-by feature
      → Group API files by feature folder usage (ex: user-management, auth)

  $ refactor-api --group-by module --update-imports
      → Refactor API files based on module names and auto-update import paths

  $ refactor-api --src ./WEB/src --target ./WEB/src/api --group-by feature --update-imports
      → Run with custom directories and automatically fix imports

Notes:
  • Scans the entire project to detect which module imports each API file.
  • Groups APIs under folders matching the feature/module using them most.
  • Supports .js, .ts, .jsx, and .tsx files.
  • Automatically updates import statements (if --update-imports is used).
`);
}

if (require.main === module) {
  main();
}

module.exports = ApiRefactor;
