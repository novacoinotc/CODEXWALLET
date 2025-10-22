import wordlist from './wordlist.js';
import { getWebCrypto, getNodeCrypto } from '../utils/platformCrypto.js';

const WORDLIST_LENGTH = wordlist.length;
const RADIX = 2048;
const BITS_PER_WORD = 11;

if (WORDLIST_LENGTH !== RADIX) {
  throw new Error(`Unexpected BIP39 wordlist length: ${WORDLIST_LENGTH}`);
}

const encoder = new TextEncoder();

function normalize(str) {
  return str.normalize('NFKD');
}

function bytesToBinary(bytes) {
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0')).join('');
}

function binaryToBytes(binary) {
  const result = new Uint8Array(binary.length / 8);
  for (let i = 0; i < result.length; i += 1) {
    const byte = binary.slice(i * 8, (i + 1) * 8);
    result[i] = parseInt(byte, 2);
  }
  return result;
}

async function deriveChecksumBits(entropyBytes) {
  const crypto = await getWebCrypto();
  const hashBuffer = await crypto.subtle.digest('SHA-256', entropyBytes.buffer.slice(entropyBytes.byteOffset, entropyBytes.byteOffset + entropyBytes.byteLength));
  const hash = new Uint8Array(hashBuffer);
  const checksumLength = entropyBytes.length * 8 / 32;
  return bytesToBinary(hash).slice(0, checksumLength);
}

async function mnemonicFromEntropy(entropyBytes) {
  if (!(entropyBytes instanceof Uint8Array)) {
    entropyBytes = new Uint8Array(entropyBytes);
  }
  if (entropyBytes.length % 4 !== 0 || entropyBytes.length === 0) {
    throw new Error('Entropy length must be multiple of 32 bits');
  }
  const entropyBits = bytesToBinary(entropyBytes);
  const checksumBits = await deriveChecksumBits(entropyBytes);
  const bits = entropyBits + checksumBits;
  const chunks = bits.match(new RegExp(`.{1,${BITS_PER_WORD}}`, 'g'));
  return chunks.map((binary) => wordlist[parseInt(binary, 2)]).join(' ');
}

export async function generateMnemonic(strength = 128) {
  if (strength % 32 !== 0 || strength < 128 || strength > 256) {
    throw new Error('Strength must be 128, 160, 192, 224, or 256 bits');
  }
  const crypto = await getWebCrypto();
  const entropy = new Uint8Array(strength / 8);
  crypto.getRandomValues(entropy);
  return mnemonicFromEntropy(entropy);
}

export async function entropyToMnemonic(entropy) {
  return mnemonicFromEntropy(entropy);
}

export async function mnemonicToEntropy(mnemonic) {
  if (typeof mnemonic !== 'string') {
    throw new Error('Mnemonic must be a string');
  }
  const words = normalize(mnemonic.trim()).split(/\s+/);
  if (words.length % 3 !== 0) {
    throw new Error('Invalid mnemonic length');
  }
  const bits = words
    .map((word) => {
      const index = wordlist.indexOf(word);
      if (index === -1) {
        throw new Error(`Invalid mnemonic word: ${word}`);
      }
      return index.toString(2).padStart(BITS_PER_WORD, '0');
    })
    .join('');

  const dividerIndex = Math.floor(bits.length / 33) * 32;
  const entropyBits = bits.slice(0, dividerIndex);
  const checksumBits = bits.slice(dividerIndex);
  const entropyBytes = binaryToBytes(entropyBits);
  const newChecksum = await deriveChecksumBits(entropyBytes);
  if (newChecksum !== checksumBits) {
    throw new Error('Invalid mnemonic checksum');
  }
  return entropyBytes;
}

export async function validateMnemonic(mnemonic) {
  try {
    await mnemonicToEntropy(mnemonic);
    return true;
  } catch (error) {
    return false;
  }
}

export async function mnemonicToSeed(mnemonic, passphrase = '') {
  const crypto = await getWebCrypto();
  const mnemonicBuffer = encoder.encode(normalize(mnemonic.trim()));
  const saltBuffer = encoder.encode(`mnemonic${normalize(passphrase)}`);

  if (crypto.subtle && crypto.subtle.importKey) {
    const keyMaterial = await crypto.subtle.importKey('raw', mnemonicBuffer, 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 2048,
        hash: 'SHA-512',
      },
      keyMaterial,
      512,
    );
    return new Uint8Array(derivedBits);
  }

  const { pbkdf2Sync } = await getNodeCrypto();
  return new Uint8Array(pbkdf2Sync(Buffer.from(mnemonicBuffer), Buffer.from(saltBuffer), 2048, 64, 'sha512'));
}

export { wordlist };
