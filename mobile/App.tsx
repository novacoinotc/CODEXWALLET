import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StatusBar } from 'react-native';
import { SecureStorageProvider } from './src/providers/SecureStorageProvider';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  return (
    <SecureStorageProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0c1430' }}>
          <DashboardScreen />
        </SafeAreaView>
      </NavigationContainer>
    </SecureStorageProvider>
  );
}
