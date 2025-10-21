export function guidToLongId(guid: string): string {
  let hash = 0n;
  for (let i = 0; i < guid.length; i++) {
    hash = (hash * 31n + BigInt(guid.charCodeAt(i))) & 0x7FFFFFFFFFFFFFFFn;
  }
  return hash.toString(); 
}
