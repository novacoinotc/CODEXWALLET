import test from 'node:test';
import assert from 'node:assert/strict';
import { signMessage, verifySignature, deriveAddressFromPrivateKey, deriveAddressFromPublicKey } from '../src/signing/offlineSigner.js';

test('firma y verificación coherentes', () => {
  const privateKey = 'f86e91f7b2bd5b2c1f8dcdccb9d2635ee11ad1ed7e9a60f7ce24954915a43b21';
  const message = 'CodexWallet: Tron offline signing';
  const { signature, publicKey, address, hexAddress } = signMessage(message, privateKey);

  assert.equal(signature.length, 128, 'la firma debe tener 64 bytes en hex');
  assert.equal(publicKey.length, 130, 'la clave pública debe ser no comprimida');
  assert.ok(address.startsWith('T'), 'la dirección base58 debe iniciar con T');
  assert.equal(hexAddress.length, 42, 'la dirección en hex debe incluir prefijo 41');

  const verification = verifySignature(message, signature, publicKey, address);
  assert.equal(verification.valid, true, 'la firma debe validar con el mensaje original');
  assert.equal(verification.address, address, 'la dirección recuperada debe coincidir');
  assert.equal(verification.hexAddress, hexAddress);
});

test('verificación falla con mensaje distinto', () => {
  const privateKey = 'a5cfa1b83fd58480e473cf7ebd6a5681d7bde07b0dd0428ecdd6dc0de27c6b41';
  const { signature, publicKey, address } = signMessage('mensaje original', privateKey);
  const verification = verifySignature('mensaje alterado', signature, publicKey, address);
  assert.equal(verification.valid, false, 'la verificación debe fallar si el mensaje cambia');
});

test('derivar dirección desde claves', () => {
  const privateKey = '4a7f03541a7bb89d69d266e374def400989f1a50e8f2048d5a8fb5d7bca3c4a2';
  const { signature, publicKey } = signMessage('mensaje de prueba', privateKey);
  const fromPrivate = deriveAddressFromPrivateKey(privateKey);
  const fromPublic = deriveAddressFromPublicKey(publicKey);

  assert.equal(fromPrivate.base58, fromPublic.base58);
  assert.equal(fromPrivate.hex, fromPublic.hex);
  const verification = verifySignature('mensaje de prueba', signature, publicKey, fromPrivate.base58);
  assert.ok(verification.valid);
});
