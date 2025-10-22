let cachedWebCrypto = null;
let nodeCryptoModule = null;

const hasWindow = typeof window !== 'undefined';

export async function getWebCrypto() {
  if (cachedWebCrypto) {
    return cachedWebCrypto;
  }

  if (hasWindow && window.crypto && window.crypto.subtle) {
    cachedWebCrypto = window.crypto;
    return cachedWebCrypto;
  }

  if (typeof globalThis !== 'undefined') {
    if (globalThis.crypto && globalThis.crypto.subtle) {
      cachedWebCrypto = globalThis.crypto;
      return cachedWebCrypto;
    }
    if (globalThis.crypto && globalThis.crypto.webcrypto && globalThis.crypto.webcrypto.subtle) {
      cachedWebCrypto = globalThis.crypto.webcrypto;
      return cachedWebCrypto;
    }
  }

  const { webcrypto } = await import('node:crypto');
  cachedWebCrypto = webcrypto;
  return cachedWebCrypto;
}

export async function getNodeCrypto() {
  if (nodeCryptoModule) {
    return nodeCryptoModule;
  }
  nodeCryptoModule = await import('node:crypto');
  return nodeCryptoModule;
}
