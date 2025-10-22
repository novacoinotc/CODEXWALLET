const DB_NAME = 'codexwallet-secure';
const STORE_NAME = 'mnemonics';
const ENTRY_KEY = 'primary';

const inMemoryStore = new Map();

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore(mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storePayload(payload) {
  if (hasIndexedDB()) {
    await withStore('readwrite', (store) => store.put(payload, ENTRY_KEY));
  } else {
    inMemoryStore.set(ENTRY_KEY, payload);
  }
}

export async function loadPayload() {
  if (hasIndexedDB()) {
    return withStore('readonly', (store) => store.get(ENTRY_KEY));
  }
  return inMemoryStore.get(ENTRY_KEY) || null;
}

export async function clearPayload() {
  if (hasIndexedDB()) {
    await withStore('readwrite', (store) => store.delete(ENTRY_KEY));
  }
  inMemoryStore.delete(ENTRY_KEY);
}
