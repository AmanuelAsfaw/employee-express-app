// src/components/CompanyDrawerHeader.js

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';

import { theme } from '../theme/theme';

export default function CompanyDrawerHeader({
  companyName = 'ZPrime',
  logo,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {logo ? (
          <Image
            source={typeof logo === 'string' ? { uri: logo } : logo}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Z</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.companyName} numberOfLines={1}>
          {companyName}
        </Text>

        <Text style={styles.subtitle}>
          Billing System
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 20,
    paddingVertical: 20,

    backgroundColor: theme.colors.surface,

    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  logoContainer: {
    width: 152,
    height: 152,
    borderRadius: 76,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },

  logo: {
    width: 144,
    height: 144,
  },

  logoPlaceholder: {
    width: 152,
    height: 152,
    borderRadius: 76,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.cyan,
  },

  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },

  info: {
    alignItems: 'center',
    marginTop: 12,
  },

  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textSecondary || '#888',
    textAlign: 'center',
  },
});
