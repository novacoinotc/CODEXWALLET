import { createECDH, createHash, createPrivateKey, createPublicKey, sign as nodeSign, verify as nodeVerify } from 'node:crypto';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const EC_PRIVATE_KEY_PREFIX = Buffer.from('302e0201010420', 'hex');
const EC_PRIVATE_KEY_SUFFIX = Buffer.from('a00706052b8104000a', 'hex');
const SECP256K1_SPKI_PREFIX = Buffer.from('3056301006072a8648ce3d020106052b8104000a034200', 'hex');
const ADDRESS_PREFIX = Buffer.from([0x41]);

function normalizeMessage(message) {
  if (message instanceof Uint8Array) {
    return Buffer.from(message);
  }
  if (typeof message === 'string') {
    return Buffer.from(message, 'utf8');
  }
  if (Buffer.isBuffer(message)) {
    return message;
  }
  throw new Error('Message must be a string or Uint8Array');
}

function privateKeyToKeyObjects(privateKeyHex) {
  if (typeof privateKeyHex !== 'string' || !/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
    throw new Error('Private key must be a 64 character hex string');
  }
  const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
  const sec1 = Buffer.concat([EC_PRIVATE_KEY_PREFIX, privateKeyBuffer, EC_PRIVATE_KEY_SUFFIX]);
  const privateKey = createPrivateKey({ key: sec1, format: 'der', type: 'sec1' });
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(privateKeyBuffer);
  const derivedPublic = ecdh.getPublicKey(null, 'uncompressed');
  const publicKey = createPublicKey(privateKey);
  const publicKeyBuffer = Buffer.from(derivedPublic);
  return { privateKey, publicKey, publicKeyBuffer, privateKeyBuffer };
}

function publicKeyToKeyObject(publicKeyHex) {
  if (typeof publicKeyHex !== 'string' || !/^[0-9a-fA-F]{130}$/.test(publicKeyHex)) {
    throw new Error('Public key must be an uncompressed 130 character hex string');
  }
  const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
  const spki = Buffer.concat([SECP256K1_SPKI_PREFIX, publicKeyBuffer]);
  const publicKey = createPublicKey({ key: spki, format: 'der', type: 'spki' });
  return { publicKey, publicKeyBuffer };
}

function encodeBase58(buffer) {
  let x = BigInt('0x' + buffer.toString('hex'));
  const base = BigInt(58);
  let output = '';
  while (x > 0n) {
    const mod = x % base;
    output = BASE58_ALPHABET[Number(mod)] + output;
    x /= base;
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i += 1) {
    output = BASE58_ALPHABET[0] + output;
  }
  return output || BASE58_ALPHABET[0];
}

function base58CheckEncode(payload) {
  const checksum = createHash('sha256').update(createHash('sha256').update(payload).digest()).digest();
  const value = Buffer.concat([payload, checksum.slice(0, 4)]);
  return encodeBase58(value);
}

export function deriveAddressFromPublicKey(publicKeyInput) {
  const { publicKeyBuffer } = typeof publicKeyInput === 'string'
    ? publicKeyToKeyObject(publicKeyInput)
    : { publicKeyBuffer: Buffer.from(publicKeyInput) };
  const hash = createHash('sha3-256').update(publicKeyBuffer.slice(1)).digest();
  const addressBytes = Buffer.concat([ADDRESS_PREFIX, hash.slice(-20)]);
  return {
    base58: base58CheckEncode(addressBytes),
    hex: addressBytes.toString('hex'),
  };
}

export function deriveAddressFromPrivateKey(privateKeyHex) {
  const { publicKeyBuffer } = privateKeyToKeyObjects(privateKeyHex);
  return deriveAddressFromPublicKey(publicKeyBuffer.toString('hex'));
}

export function signMessage(message, privateKeyHex) {
  const { privateKey, publicKey, publicKeyBuffer } = privateKeyToKeyObjects(privateKeyHex);
  const payload = normalizeMessage(message);
  const digest = createHash('sha256').update(payload).digest();
  const signature = nodeSign(null, digest, { key: privateKey, dsaEncoding: 'ieee-p1363' });
  const { base58, hex } = deriveAddressFromPublicKey(publicKeyBuffer.toString('hex'));
  return {
    signature: signature.toString('hex'),
    publicKey: publicKeyBuffer.toString('hex'),
    address: base58,
    hexAddress: hex,
  };
}

export function verifySignature(message, signatureHex, publicKeyHex, expectedAddress) {
  const { publicKey, publicKeyBuffer } = publicKeyToKeyObject(publicKeyHex);
  const payload = normalizeMessage(message);
  const digest = createHash('sha256').update(payload).digest();
  const signature = Buffer.from(signatureHex, 'hex');
  const isValid = nodeVerify(null, digest, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
  const { base58, hex } = deriveAddressFromPublicKey(publicKeyBuffer.toString('hex'));
  const matchesAddress = expectedAddress ? expectedAddress === base58 || expectedAddress.toLowerCase() === hex : true;
  return {
    valid: Boolean(isValid && matchesAddress),
    address: base58,
    hexAddress: hex,
  };
}
