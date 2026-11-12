/**
 * React-PDF wraps at whitespace by default. Asset/property identifiers often
 * contain long tokens without whitespace, so split only those tokens before
 * rendering them in a table cell. Existing whitespace and line breaks are
 * preserved, and the displayed value itself is not truncated.
 */
export function wrapPdfText(value: unknown, maxTokenLength = 20): string {
  const text = value == null ? "" : String(value);
  if (!text || maxTokenLength < 1) return text;

  return text
    .split(/(\r?\n)/)
    .map((line) => {
      if (/^\r?\n$/.test(line)) return line;

      return line
        .split(/(\s+)/)
        .map((token) => {
          if (!token || /^\s+$/.test(token) || token.length <= maxTokenLength) {
            return token;
          }

          const chunks = token.match(new RegExp(`.{1,${maxTokenLength}}`, "g"));
          return chunks?.join("\n") ?? token;
        })
        .join("");
    })
    .join("");
}
