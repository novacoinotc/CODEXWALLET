import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSecureStorage } from '../providers/SecureStorageProvider';
import { useTronWalletConnect } from '../hooks/useTronWalletConnect';
import { generateTronDeepLink } from '../utils/tron';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1430',
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  account: {
    paddingVertical: 8,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  accountAddress: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Courier',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#f7b500',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0c1430',
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineText: {
    color: '#fff',
    fontWeight: '600',
  },
  uri: {
    fontSize: 12,
    color: '#f7b500',
    fontFamily: 'Courier',
  },
});

const DashboardScreen: React.FC = () => {
  const { accounts, activeAccount, setActiveAccount, removeAccount } = useSecureStorage();
  const walletConnect = useTronWalletConnect({ projectId: 'demo-project-id' });

  const handleOpenDeepLink = async () => {
    if (!activeAccount) return;
    const url = generateTronDeepLink({
      address: activeAccount.address,
      callback: 'codexwallet://callback',
    });
    await Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Cuenta activa</Text>
        {activeAccount ? (
          <View>
            <Text style={styles.accountLabel}>{activeAccount.label}</Text>
            <Text style={styles.accountAddress}>{activeAccount.address}</Text>
            <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={handleOpenDeepLink}>
              <Text style={styles.buttonText}>Abrir deep link Tron</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.subtitle}>Selecciona una cuenta para interactuar con dApps.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Cuentas disponibles</Text>
        {accounts.map((account) => (
          <View key={account.id} style={styles.account}>
            <Text style={styles.accountLabel}>{account.label}</Text>
            <Text style={styles.accountAddress}>{account.address}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setActiveAccount(account.id)}>
                <Text style={styles.outlineText}>Activar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => removeAccount(account.id)}>
                <Text style={styles.outlineText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!accounts.length && <Text style={styles.subtitle}>Aún no hay cuentas guardadas.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>WalletConnect Tron</Text>
        {walletConnect.session ? (
          <View>
            <Text style={styles.subtitle}>Conectado al tópico {walletConnect.session.topic}</Text>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={async () => {
                try {
                  await walletConnect.disconnect();
                } catch (error) {
                  Alert.alert('WalletConnect', error instanceof Error ? error.message : String(error));
                }
              }}
            >
              <Text style={styles.outlineText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              try {
                await walletConnect.connect();
              } catch (error) {
                Alert.alert('WalletConnect', error instanceof Error ? error.message : String(error));
              }
            }}
          >
            <Text style={styles.buttonText}>{walletConnect.loading ? 'Conectando…' : 'Conectar con dApp'}</Text>
          </TouchableOpacity>
        )}
        {walletConnect.uri && (
          <Text selectable style={styles.uri}>
            {walletConnect.uri}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
