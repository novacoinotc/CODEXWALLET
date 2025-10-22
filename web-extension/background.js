import { TronWalletConnectSession } from './walletconnect/tronWalletConnect.js';

const DEFAULT_STATE = {
  accounts: [],
  activeAccountId: null,
  walletConnect: {},
};

const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function hexToBytes(hex) {
  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(buffer) {
  let arrayBuffer;
  if (buffer instanceof ArrayBuffer) {
    arrayBuffer = buffer;
  } else if (ArrayBuffer.isView(buffer)) {
    arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } else {
    arrayBuffer = new Uint8Array(buffer).buffer;
  }
  const hash = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return new Uint8Array(hash);
}

function base58Encode(bytes) {
  if (!bytes.length) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      const value = digits[j] * 256 + carry;
      digits[j] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let result = '';
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros += 1;
  }
  result += '1'.repeat(leadingZeros);
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    result += base58Alphabet[digits[i]];
  }
  return result;
}

function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveAddressFromPrivateKey(privateKey) {
  const keyBytes = hexToBytes(privateKey);
  const hash = await sha256(keyBytes);
  const secondHash = await sha256(hash);
  const tronAddress = new Uint8Array(21);
  tronAddress[0] = 0x41;
  tronAddress.set(secondHash.slice(0, 20), 1);
  const checksumFull = await sha256(await sha256(tronAddress));
  const payload = new Uint8Array(tronAddress.length + 4);
  payload.set(tronAddress, 0);
  payload.set(checksumFull.slice(0, 4), tronAddress.length);
  return base58Encode(payload);
}

async function getState() {
  const stored = await chrome.storage.local.get('codexwallet');
  return { ...DEFAULT_STATE, ...(stored.codexwallet || {}) };
}

async function setState(updater) {
  const current = await getState();
  const next = typeof updater === 'function' ? updater(current) : updater;
  await chrome.storage.local.set({ codexwallet: next });
  return next;
}

async function generateAccount({ label }) {
  const privateKey = randomHex(32);
  const address = await deriveAddressFromPrivateKey(privateKey);
  return {
    id: crypto.randomUUID(),
    label: label || 'Cuenta Tron',
    address,
    privateKey,
    createdAt: new Date().toISOString(),
  };
}

async function signWithPrivateKey(privateKey, payload) {
  const encoder = new TextEncoder();
  const messageBytes = typeof payload === 'string' ? encoder.encode(payload) : payload;
  const keyBytes = hexToBytes(privateKey);
  const combined = new Uint8Array(keyBytes.length + messageBytes.length);
  combined.set(keyBytes, 0);
  combined.set(messageBytes, keyBytes.length);
  const digest = await sha256(combined);
  return `0x${bytesToHex(digest)}`;
}

async function handleProviderRequest({ method, params }) {
  const state = await getState();
  const active = state.accounts.find((account) => account.id === state.activeAccountId);

  switch (method) {
    case 'tron_getProviderState':
      return {
        result: {
          address: active ? active.address : null,
          connected: Boolean(active),
        },
      };
    case 'tron_requestAccounts': {
      if (!active) {
        throw new Error('CodexWallet: no hay cuenta activa. Selecciona una en el popup.');
      }
      return {
        result: {
          accounts: [active.address],
        },
      };
    }
    case 'tron_signMessage': {
      if (!active) {
        throw new Error('CodexWallet: no hay cuenta activa para firmar.');
      }
      const [message] = params || [];
      const signature = await signWithPrivateKey(active.privateKey, message);
      return { result: { value: signature } };
    }
    case 'tron_signTransaction': {
      if (!active) {
        throw new Error('CodexWallet: no hay cuenta activa para firmar.');
      }
      const [transaction] = params || [];
      const signature = await signWithPrivateKey(active.privateKey, JSON.stringify(transaction));
      return {
        result: {
          value: {
            txID: randomHex(16),
            signature,
          },
        },
      };
    }
    case 'tron_sendRawTransaction': {
      const [raw] = params || [];
      return {
        result: {
          value: {
            txid: randomHex(16),
            raw,
            status: 'PENDING',
          },
        },
      };
    }
    case 'tron_openWalletConnect': {
      const session = await createWalletConnectSession(state);
      return {
        result: {
          value: session,
        },
      };
    }
    default:
      throw new Error(`CodexWallet: método no soportado ${method}`);
  }
}

async function createWalletConnectSession(state) {
  const session = new TronWalletConnectSession({
    metadata: {
      name: 'CodexWallet Tron',
      description: 'Sesión WalletConnect para dApps Tron',
    },
  });
  const uri = await session.init();
  const sessionId = crypto.randomUUID();
  state.walletConnect[sessionId] = {
    sessionId,
    uri,
    topic: session.topic,
    createdAt: Date.now(),
  };
  await chrome.storage.local.set({ codexwallet: state });
  return { sessionId, uri, topic: session.topic };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.channel === 'codexwallet:provider') {
    handleProviderRequest(message.payload)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message?.channel === 'codexwallet:popup') {
    handlePopupAction(message.action, message.payload)
      .then((result) => sendResponse({ result }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  return undefined;
});

async function handlePopupAction(action, payload) {
  switch (action) {
    case 'listAccounts': {
      const state = await getState();
      return {
        accounts: state.accounts.map(({ privateKey, ...rest }) => rest),
        activeAccountId: state.activeAccountId,
        walletConnect: state.walletConnect,
      };
    }
    case 'generateAccount': {
      const account = await generateAccount({ label: payload?.label });
      const state = await setState((current) => {
        const accounts = [...current.accounts, account];
        return {
          ...current,
          accounts,
          activeAccountId: account.id,
        };
      });
      const { privateKey: _ignored, ...safeAccount } = account;
      return {
        account: safeAccount,
        activeAccountId: state.activeAccountId,
      };
    }
    case 'saveAccount': {
      const { label, privateKey, address } = payload;
      if (!privateKey) {
        throw new Error('La clave privada es requerida.');
      }
      const normalizedPk = privateKey.replace(/^0x/, '');
      const derivedAddress = address || (await deriveAddressFromPrivateKey(normalizedPk));
      const account = {
        id: crypto.randomUUID(),
        label: label || `Cuenta ${derivedAddress.slice(0, 6)}`,
        privateKey: normalizedPk,
        address: derivedAddress,
        createdAt: new Date().toISOString(),
      };
      await setState((current) => ({
        ...current,
        accounts: [...current.accounts, account],
        activeAccountId: current.activeAccountId || account.id,
      }));
      return { ok: true };
    }
    case 'setActiveAccount': {
      const { accountId } = payload;
      await setState((current) => ({ ...current, activeAccountId: accountId }));
      return { ok: true };
    }
    case 'deleteAccount': {
      const { accountId } = payload;
      await setState((current) => {
        const accounts = current.accounts.filter((account) => account.id !== accountId);
        const nextActive = current.activeAccountId === accountId
          ? accounts.length
            ? accounts[0].id
            : null
          : current.activeAccountId;
        return {
          ...current,
          accounts,
          activeAccountId: nextActive,
        };
      });
      return { ok: true };
    }
    case 'startWalletConnect': {
      const state = await getState();
      const session = await createWalletConnectSession(state);
      return session;
    }
    case 'disconnectWalletConnect': {
      const { sessionId } = payload;
      await setState((current) => {
        const next = { ...current.walletConnect };
        delete next[sessionId];
        return {
          ...current,
          walletConnect: next,
        };
      });
      return { ok: true };
    }
    default:
      throw new Error(`Acción no soportada: ${action}`);
  }
}
