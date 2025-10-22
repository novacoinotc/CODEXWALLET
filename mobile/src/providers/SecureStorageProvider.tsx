import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type StoredAccount = {
  id: string;
  label: string;
  address: string;
  publicKey?: string;
  createdAt: string;
};

type StorageContextShape = {
  accounts: StoredAccount[];
  activeAccount?: StoredAccount | null;
  setActiveAccount(id: string): Promise<void>;
  saveAccount(account: Omit<StoredAccount, 'createdAt'>): Promise<void>;
  removeAccount(id: string): Promise<void>;
};

const StorageContext = createContext<StorageContextShape | undefined>(undefined);

const ACCOUNTS_KEY = 'codexwallet:accounts';
const ACTIVE_ACCOUNT_KEY = 'codexwallet:active-account';

async function readSecureJSON<T>(key: string, fallback: T): Promise<T> {
  const value = await SecureStore.getItemAsync(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('SecureStore JSON parse error', error);
    return fallback;
  }
}

async function writeSecureJSON<T>(key: string, value: T) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export const SecureStorageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedAccounts = await readSecureJSON<StoredAccount[]>(ACCOUNTS_KEY, []);
      const storedActive = await SecureStore.getItemAsync(ACTIVE_ACCOUNT_KEY);
      setAccounts(storedAccounts);
      setActiveAccountId(storedActive);
    })();
  }, []);

  const saveAccount = async (account: Omit<StoredAccount, 'createdAt'>) => {
    const entry: StoredAccount = { ...account, createdAt: new Date().toISOString() };
    const next = [...accounts.filter((item) => item.id !== entry.id), entry];
    setAccounts(next);
    await writeSecureJSON(ACCOUNTS_KEY, next);
    if (!activeAccountId) {
      await setActiveAccount(entry.id);
    }
  };

  const setActiveAccount = async (id: string) => {
    setActiveAccountId(id);
    await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, id);
  };

  const removeAccount = async (id: string) => {
    const next = accounts.filter((account) => account.id !== id);
    setAccounts(next);
    await writeSecureJSON(ACCOUNTS_KEY, next);
    if (activeAccountId === id) {
      const nextActive = next.length ? next[0].id : '';
      setActiveAccountId(nextActive || null);
      if (nextActive) {
        await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, nextActive);
      } else {
        await SecureStore.deleteItemAsync(ACTIVE_ACCOUNT_KEY);
      }
    }
  };

  const value = useMemo<StorageContextShape>(
    () => ({
      accounts,
      activeAccount: accounts.find((account) => account.id === activeAccountId) ?? null,
      saveAccount,
      setActiveAccount,
      removeAccount,
    }),
    [accounts, activeAccountId]
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

export function useSecureStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useSecureStorage debe utilizarse dentro de SecureStorageProvider');
  }
  return context;
}
