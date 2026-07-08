import zeroperlWasmUrl from '@6over3/zeroperl-ts/zeroperl.wasm?url';

/**
 * GitHub Pages 等のサブパス配信で ./zeroperl.wasm が index.html を返す問題を回避
 */
export function createExiftoolFetch() {
  return (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('zeroperl.wasm')) {
      return fetch(zeroperlWasmUrl, init);
    }
    return fetch(input, init);
  };
}
