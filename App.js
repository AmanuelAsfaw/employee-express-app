// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';

import {
  AlertProvider,
  AlertBridge,
} from './src/components/Alert';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      let role;

      try {
        token = await AsyncStorage.getItem(
          'access_token'
        );
        role = await AsyncStorage.getItem(
          'user_role'
        );
      } catch (e) {
        console.error('Failed to load token', e);
      }

      setUserToken(token);
      setRole(role);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#321fdb"
        />
      </View>
    );
  }

  return (
    <AlertProvider>
      <AlertBridge />

      <NavigationContainer>
        <AppNavigator
          role={role}
          userToken={userToken}
          setUserToken={setUserToken}
          setRole={setRole}
        />

        <StatusBar style="light" />
      </NavigationContainer>
    </AlertProvider>
  );
}