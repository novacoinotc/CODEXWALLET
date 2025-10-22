import { generateMnemonic, validateMnemonic, mnemonicToSeed } from '../bip39/index.js';
import { encryptMnemonic, decryptMnemonic } from './encryption.js';
import { storePayload, loadPayload, clearPayload } from './storage.js';

export async function createWallet(password, strength = 128) {
  const mnemonic = await generateMnemonic(strength);
  const payload = await encryptMnemonic(mnemonic, password);
  await storePayload(payload);
  const seed = await mnemonicToSeed(mnemonic);
  return { mnemonic, seed, payload };
}

export async function importWallet(mnemonic, password) {
  const normalized = mnemonic.trim().replace(/\s+/g, ' ');
  const isValid = await validateMnemonic(normalized);
  if (!isValid) {
    throw new Error('La frase mnemónica BIP39 no es válida');
  }
  const payload = await encryptMnemonic(normalized, password);
  await storePayload(payload);
  const seed = await mnemonicToSeed(normalized);
  return { mnemonic: normalized, seed, payload };
}

export async function unlockWallet(password) {
  const payload = await loadPayload();
  if (!payload) {
    throw new Error('No hay ninguna semilla almacenada');
  }
  const mnemonic = await decryptMnemonic(payload, password);
  const seed = await mnemonicToSeed(mnemonic);
  return { mnemonic, seed };
}

export async function removeWallet() {
  await clearPayload();
}
