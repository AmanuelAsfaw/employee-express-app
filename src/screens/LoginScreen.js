// src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { handleLoginAPI } from '../utils/api_utils.js';
import { theme } from '../theme/theme.js';
import { CompanyName, CompanyLogo } from '../constants/companyInfo.js';
import ZPrimeFooter from '../components/Z-PrimeFooter.js';


const LoginScreen = ({ navigation, setUserToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    const dummyEvent = {
      preventDefault: () => {},
    };

    try {
      await handleLoginAPI(
        dummyEvent,
        setError,
        setLoading,
        navigation.navigate,
        username.trim(),
        password,
        (usr) => {
          console.log(`Welcome back, ${usr.username}!`);
          navigation.replace('Dashboard');
        },
        setUserToken
      );
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoContainer}>
              {CompanyLogo ? (
                        <Image
                          source={typeof CompanyLogo === 'string' ? { uri: CompanyLogo } : CompanyLogo}
                          style={styles.logo}
                          resizeMode="contain"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="truck-fast"
                          size={34}
                          color={theme.colors.primary}
                        />
                      )}
            </View>

            <Text style={styles.brandName}>
              {CompanyName || 'Express Delivery'}
            </Text>

            <Text style={styles.brandSubtitle}>
              Delivery Management System
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.header}>Welcome back</Text>

            <Text style={styles.subHeader}>
              Sign in to continue to your account
            </Text>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color={theme.colors.danger}
                />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Username</Text>

              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={21}
                  color={theme.colors.textSecondary}
                  style={styles.icon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>

              <View style={styles.inputGroup}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={21}
                  color={theme.colors.textSecondary}
                  style={styles.icon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => {
                // Navigate to ForgotPassword when available
                // navigation.navigate('ForgotPassword');
              }}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.background}
                />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>

                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color={theme.colors.background}
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />

              <Text style={styles.dividerText}>SECURE ACCESS</Text>

              <View style={styles.divider} />
            </View>

            {/* Security Information */}
            <View style={styles.securityRow}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={20}
                color={theme.colors.success}
              />

              <Text style={styles.securityText}>
                Your connection and account are protected
              </Text>
            </View>
          </View>

          {/* SaaS Information */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons
                name="truck-fast-outline"
                size={25}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                Express Delivery & Management
              </Text>

              <Text style={styles.infoText}>
                Manage deliveries, drivers, customers and operations from one
                powerful platform.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
          </Text>
          <ZPrimeFooter/>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.huge,
  },

  // --------------------------------------------------
  // Brand
  // --------------------------------------------------

  brandContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },

  logoContainer: {
    width: 110,
    height: 110,
    marginBottom: 20,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,

    ...theme.shadows.card,
  },

  brandName: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  brandSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },

  // --------------------------------------------------
  // Login Card
  // --------------------------------------------------

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxxl,

    ...theme.shadows.elevated,
  },

  header: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },

  subHeader: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: theme.spacing.xxxl,
  },

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(231, 76, 60, 0.12)',

    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.25)',

    borderRadius: theme.radius.sm,

    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,

    marginBottom: theme.spacing.xxl,
  },

  errorText: {
    flex: 1,
    color: '#FF8A80',
    fontSize: 13,
    lineHeight: 19,
    marginLeft: theme.spacing.md,
  },

  // --------------------------------------------------
  // Inputs
  // --------------------------------------------------

  fieldContainer: {
    marginBottom: theme.spacing.xxl,
  },

  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },

  inputGroup: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.borderLight,

    borderRadius: theme.radius.sm,

    paddingHorizontal: theme.spacing.lg,
  },

  icon: {
    marginRight: theme.spacing.md,
  },

  input: {
    flex: 1,
    height: '100%',

    color: theme.colors.text,

    fontSize: 15,
  },

  visibilityButton: {
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  // --------------------------------------------------
  // Forgot Password
  // --------------------------------------------------

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },

  forgotText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // --------------------------------------------------
  // Login Button
  // --------------------------------------------------

  loginButton: {
    height: 54,

    backgroundColor: theme.colors.primary,

    borderRadius: theme.radius.sm,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    ...theme.shadows.button,
  },

  loginButtonDisabled: {
    backgroundColor: theme.colors.primaryDark,
    opacity: 0.7,
  },

  loginButtonText: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '800',
    marginRight: theme.spacing.md,
  },

  // --------------------------------------------------
  // Divider
  // --------------------------------------------------

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xxxl,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },

  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: theme.spacing.lg,
  },

  // --------------------------------------------------
  // Security
  // --------------------------------------------------

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginLeft: theme.spacing.sm,
  },

  // --------------------------------------------------
  // Information Card
  // --------------------------------------------------

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: theme.colors.backgroundSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.lg,

    padding: theme.spacing.xl,

    marginTop: theme.spacing.xxl,
  },

  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,

    backgroundColor: theme.colors.surfaceElevated,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: theme.spacing.lg,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },

  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  // --------------------------------------------------
  // Footer
  // --------------------------------------------------

  footerText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: theme.spacing.xxxl,
  },

  logo: {
    width: 104,
    height: 104,
  },

});
