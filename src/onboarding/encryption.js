import { getWebCrypto } from '../utils/platformCrypto.js';

const ITERATIONS = 250000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof window !== 'undefined' && window.btoa) {
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return window.btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value) {
  if (typeof window !== 'undefined' && window.atob) {
    const binary = window.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(value, 'base64'));
}

export async function encryptMnemonic(mnemonic, password) {
  if (!password) {
    throw new Error('Password is required to encrypt the mnemonic');
  }
  const crypto = await getWebCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encoder.encode(mnemonic),
  );

  return {
    cipher: toBase64(new Uint8Array(cipherBuffer)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    iterations: ITERATIONS,
  };
}

export async function decryptMnemonic(payload, password) {
  if (!payload) {
    throw new Error('No encrypted payload available');
  }
  const { cipher, iv, salt, iterations = ITERATIONS } = payload;
  const crypto = await getWebCrypto();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: fromBase64(iv),
    },
    aesKey,
    fromBase64(cipher),
  );

  return decoder.decode(decrypted);
}
