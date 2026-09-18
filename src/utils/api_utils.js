// src/utils/api_utils.js
import api from "./axioServices.js";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { CompanyId } from "../constants/companyInfo.js";

export const handleLoginAPI = async (
  e, // Note: In mobile call, pass null or { preventDefault: () => {} }
  setError,
  setLoading,
  navigate,
  username,
  password,
  setUser = null,
  setUserToken
) => {
  if (e && e.preventDefault) e.preventDefault();
  setLoading(true);
  setError('');

  if (!username?.trim() || !password) {
    setError('Please enter both username and password');
    setLoading(false);
    return;
  }

  try {
    console.log("password:",password);
    
    const response = await api.post('/usr-mngmnt/mobile-app/login/', {
      username: username.trim(),
      password,
      company_code : CompanyId
    });
    console.log(response);

    const { access, refresh, user } = response.data;
    console.log(response);
    

    // --- REPLACING LOCALSTORAGE WITH ASYNCSTORAGE ---
    // AsyncStorage is asynchronous, so we use await
    await AsyncStorage.multiSet([
      ['access_token', access],
      ['refresh_token', refresh],
      ['user_role', user.role],
      ['user', JSON.stringify(user)]
    ]);
    setUserToken(access);

    if (setUser) setUser(user);

    // Mobile Feedback (Replaces window.showToast)
    console.log(`Welcome back, ${user.username}!`);

    // --- NAVIGATION LOGIC ---
    // In React Native, we use route names defined in your Stack Navigator
    if (user.role === 'super_admin') {
       navigate('AdminCompanies'); 
    } else if (user.is_company_admin) {
       navigate('CompanyDashboard');
    } else if (user.is_branch_manager) {
       navigate('BranchDeliveries');
    } else {
       navigate('Dashboard');
    }

  } catch (err) {
    console.error(
      'Login failed:',
      err?.response?.status,
      err?.response?.data
    );

    const data = err?.response?.data;

    const getErrorMessage = (value) => {
      if (Array.isArray(value)) {
        return value[0];
      }

      if (typeof value === 'string') {
        return value;
      }

      return null;
    };

    const message =
      getErrorMessage(data?.non_field_errors) ||
      getErrorMessage(data?.detail) ||
      getErrorMessage(data?.message) ||
      getErrorMessage(data?.username) ||
      getErrorMessage(data?.password) ||
      getErrorMessage(data?.company_code) ||
      'Invalid username or password. Please try again.';

    setError(message);
    Alert.alert('Login Error', message);
  } finally {
    setLoading(false);
  }
};

export const logoutAPI = async (setUserToken, setUser = null) => {
  try {
    // Clear stored credentials
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token',
      'user_role',
      'user'
    ]);
    
    if (setUserToken) setUserToken(null);
    if (setUser) setUser(null);
  } catch (err) {
    console.error('Logout error:', err);
    Alert.alert('Error', 'Failed to log out properly.');
  }
};
