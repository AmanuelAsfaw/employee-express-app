// src/screens/DetailBillScreen.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import api from '../../utils/axioServices'; // Adjust path based on your directory structure
import { END_POINT } from '../../constants/urls'; // Adjust path
import { fetchOfflineBill } from '../../utils/bills/bills_hybrid_utils'; // Adjust path
import DetailBillContent from '../../components/bills/DetailBillContent';
import { theme } from '../../theme/theme';

const DetailBillScreen = ({ navigation }) => {
  const route = useRoute();
  // Extract trackingNo from React Navigation parameters
  const trackingNo = route.params?.trackingNo;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  // =========================
  // NETWORK STATUS LISTENER
  // =========================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchBill = async () => {
    if (!trackingNo) {
      setError('No tracking number provided.');
      setLoading(false);
      return;
    }

    if (!isConnected) {
      try {
        console.log('Connection is offline, fetching bill offline...');
        const res = await fetchOfflineBill(trackingNo);
        if (!res) {
          setError('Bill not found offline.');
          setBill(null);
          return;
        }
        // If company data is saved in AsyncStorage
        // const company = JSON.parse(await AsyncStorage.getItem('company'));
        const company = {}; // Fallback if AsyncStorage isn't mapped directly here
        const billWithCompany = { ...res, company };
        
        setBill(billWithCompany);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Bill not found or access denied on offline mode.');
        setBill(null);
      } finally {
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('Fetching bill online...');
      const res = await api.get(`${END_POINT}/express-api/api/bills/${trackingNo}/`);
      setBill(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Bill not found or access denied.');
      setBill(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, [trackingNo, isConnected]);

  return (
    <View style={styles.container}>
      <DetailBillContent
        bill={bill}
        loading={loading}
        error={error}
        navigation={navigation}
        trackingNo={trackingNo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default DetailBillScreen;