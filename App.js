// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Check if user is already logged in when app starts
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await AsyncStorage.getItem('access_token');
      } catch (e) {
        console.error("Failed to load token", e);
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    // Show a loading spinner while checking storage
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#321fdb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* 
        Pass userToken to your Navigator or use it to define 
        which Stack to show (AuthStack vs AppStack) 
      */}
      <AppNavigator userToken={userToken} setUserToken={setUserToken}/>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}