import { useCallback, useEffect, useMemo, useState } from 'react';
import SignClient from '@walletconnect/sign-client';
import { Linking } from 'react-native';
import { useSecureStorage } from '../providers/SecureStorageProvider';

export type TronSession = {
  topic: string;
  accounts: string[];
  uri?: string;
};

type Options = {
  projectId: string;
  relayUrl?: string;
};

export function useTronWalletConnect(options: Options) {
  const { activeAccount } = useSecureStorage();
  const [client, setClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<TronSession | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const instance = await SignClient.init({
        projectId: options.projectId,
        relayUrl: options.relayUrl,
        metadata: {
          name: 'CodexWallet Tron',
          description: 'WalletConnect para CodexWallet',
          url: 'https://codexwallet.app',
          icons: ['https://codexwallet.app/icon.png'],
        },
      });
      if (!mounted) return;
      setClient(instance);
    })();
    return () => {
      mounted = false;
    };
  }, [options.projectId, options.relayUrl]);

  useEffect(() => {
    if (!client) return;
    const handleDelete = (event: { topic: string }) => {
      if (session && event.topic === session.topic) {
        setSession(null);
        setUri(null);
      }
    };
    client.on('session_delete', handleDelete);
    return () => {
      client.off('session_delete', handleDelete);
    };
  }, [client, session]);

  useEffect(() => {
    if (!client) return;
    const handler = async (sessionProposal: any) => {
      if (!activeAccount) {
        throw new Error('Selecciona una cuenta activa antes de conectar');
      }
      const { id, params } = sessionProposal;
      const namespaces: Record<string, any> = {
        tron: {
          accounts: [`tron:${params.requiredNamespaces.tron.chains?.[0] ?? 'tron:mainnet'}:${activeAccount.address}`],
          methods: ['tron_requestAccounts', 'tron_signTransaction', 'tron_signMessage'],
          events: ['chainChanged', 'accountsChanged'],
        },
      };
      await client.approve({
        id,
        namespaces,
      });
    };

    client.on('session_proposal', handler);
    return () => {
      client.off('session_proposal', handler);
    };
  }, [client, activeAccount]);

  const connect = useCallback(async () => {
    if (!client) {
      throw new Error('WalletConnect no inicializado');
    }
    setLoading(true);
    try {
      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          tron: {
            methods: ['tron_requestAccounts', 'tron_signTransaction', 'tron_signMessage'],
            chains: ['tron:mainnet'],
            events: ['accountsChanged'],
          },
        },
      });
      if (uri) {
        setUri(uri);
        await Linking.openURL(`tronlink://wc?uri=${encodeURIComponent(uri)}`);
      }
      const session = await approval();
      setSession({ topic: session.topic, accounts: session.namespaces.tron.accounts, uri: uri || undefined });
      setUri(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const disconnect = useCallback(async () => {
    if (!client || !session) return;
    await client.disconnect({ topic: session.topic, reason: { code: 6000, message: 'User disconnected' } });
    setSession(null);
    setUri(null);
  }, [client, session]);

  const value = useMemo(
    () => ({
      client,
      session,
      uri,
      loading,
      connect,
      disconnect,
    }),
    [client, session, uri, loading, connect, disconnect]
  );

  return value;
}
