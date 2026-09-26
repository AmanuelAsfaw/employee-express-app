// src/components/Z-PrimeFooter.js

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';

import ZExpressLogo from '../assets/images/zexpress-logo-removebg-preview.png';
import ZealLogo from '../assets/images/zeallogo.png';

import { theme } from '../theme/theme.js';

const ZPrimeFooter = () => {
  const openZealWebsite = async () => {
    const url = 'https://zealtech.com';

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Unable to open Zeal website:', error);
    }
  };

  return (
    <View style={styles.footer}>
      {/* Left Side - Z-Prime */}
      <View style={styles.leftSection}>
        <View style={styles.brandContainer}>
          <Image
            source={ZExpressLogo}
            style={styles.zPrimeLogo}
            resizeMode="contain"
          />

          <View style={styles.brandTextContainer}>
            <Text style={styles.companyTitle}>
              Z-Prime
            </Text>

            <Text style={styles.companySub}>
              The Soul of Modern Logistics
            </Text>
          </View>
        </View>

        {/* <Text style={styles.copyright}>
          © 2026 Zeal.
        </Text> */}
      </View>

      {/* Right Side - Powered by Zeal */}
      <View style={styles.rightSection}>
        {/* <Text style={styles.poweredBy}>
          Powered by
        </Text> */}

        <Image
          source={ZealLogo}
          style={styles.zealLogo}
          resizeMode="contain"
        />

        <TouchableOpacity
          onPress={openZealWebsite}
          activeOpacity={0.7}
        >
          <Text style={styles.zealText}>
            Zeal Technologies
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(ZPrimeFooter);

const styles = StyleSheet.create({
  footer: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,

    backgroundColor: theme.colors.surface,

    borderTopWidth: 1,
    borderTopColor: theme.colors.border,

    minHeight: 25,
  },

  // -----------------------------------------
  // Left
  // -----------------------------------------

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  zPrimeLogo: {
    width: 22,
    height: 22,
    marginRight: theme.spacing.sm,
  },

  brandTextContainer: {
    justifyContent: 'center',
  },

  companyTitle: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 16,
  },

  companySub: {
    color: theme.colors.textSecondary,
    fontSize: 6,
    lineHeight: 11,
    marginTop: 1,
  },

  copyright: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginLeft: theme.spacing.md,
  },

  // -----------------------------------------
  // Right
  // -----------------------------------------

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  poweredBy: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    marginRight: theme.spacing.sm,
  },

  zealLogo: {
    width: 28.5,
    height: 21,
    marginRight: theme.spacing.xs,
  },

  zealText: {
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '700',
  },
});
