import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { theme } from '../../theme/theme';
import { END_POINT } from '../../constants/urls';
import { fetchCompanyAPI } from '../../utils/employe_api_utils';

const CompanyProfileScreenEmp = () => {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getAuthToken = async () => {
    // Replace with your actual token storage.
    return null;
  };

  const loadCompanyData = (isRefresh = false) => {
    fetchCompanyAPI(
      setCompany,
      setForm,
      setError,
      setLoading,
      setRefreshing,
      isRefresh,
    );
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const saveCompany = async () => {
    try {
      setSaving(true);
      setError('');

      const token = await getAuthToken();

      const response = await fetch(
        `${END_POINT}/usr-mngmnt/company-profile/`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            name: form.name,
            subdomain: form.subdomain,
            phone: form.phone,
            short_code: form.short_code,
            country: form.country,
            print_code: form.print_code,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Failed to update company profile.',
        );
      }

      setCompany(data);
      setForm(data);

      Alert.alert(
        'Success',
        'Company profile updated successfully.',
      );
    } catch (err) {
      setError(
        err.message || 'Failed to update company profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label, field, options = {}) => {
    const {
      placeholder = '',
      multiline = false,
      keyboardType = 'default',
      disabled = true
    } = options;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>

        <TextInput
          value={
            form[field] !== null &&
            form[field] !== undefined
              ? String(form[field])
              : ''
          }
          onChangeText={value =>
            updateField(field, value)
          }
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
          aria-disabled={disabled}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          keyboardType={keyboardType}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading company profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!company && error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.errorTitle}>
            Unable to load profile
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadCompanyData()}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCompanyData(true)}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                Company Profile
              </Text>

              <Text style={styles.subtitle}>
                Manage your company information
              </Text>
            </View>

            <View style={styles.companyIcon}>
              <Text style={styles.companyIconText}>
                {form.name?.charAt(0)?.toUpperCase() || 'C'}
              </Text>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Company Logo */}
          {form.logo ? (
            <View style={styles.logoCard}>
              <Image
                source={{ uri: form.logo }}
                style={styles.logo}
                resizeMode="contain"
              />

              <View>
                <Text style={styles.logoTitle}>
                  Company Logo
                </Text>

                <Text style={styles.logoSubtitle}>
                  Current company logo
                </Text>
              </View>
            </View>
          ) : null}

          {/* Basic Information ONLY */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Basic Information
            </Text>

            <View style={styles.card}>
              {renderInput(
                'Company Name',
                'name',
                {
                  placeholder: 'Enter company name',
                },
              )}

              {renderInput(
                'Subdomain',
                'subdomain',
                {
                  placeholder: 'company',
                },
              )}

              {renderInput(
                'Short Code',
                'short_code',
                {
                  placeholder: 'Company short code',
                },
              )}

              {renderInput(
                'Phone',
                'phone',
                {
                  placeholder: 'Phone number',
                  keyboardType: 'phone-pad',
                },
              )}

              {renderInput(
                'Country',
                'country',
                {
                  placeholder: 'Country',
                },
              )}

              {renderInput(
                'Print Code',
                'print_code',
                {
                  placeholder: 'Print code',
                  multiline: true,
                },
              )}
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CompanyProfileScreenEmp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxxl,
  },

  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },

  companyIcon: {
    width: 55,
    height: 55,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  companyIconText: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },

  section: {
    marginBottom: theme.spacing.xxxl,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxl,
    ...theme.shadows.card,
  },

  inputContainer: {
    marginBottom: theme.spacing.xl,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 15,
  },

  multilineInput: {
    minHeight: 95,
    textAlignVertical: 'top',
  },

  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
  },

  logo: {
    width: 65,
    height: 65,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    marginRight: theme.spacing.xl,
  },

  logoTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  logoSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  saveButton: {
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '800',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    fontSize: 14,
  },

  errorContainer: {
    flex: 1,
    padding: theme.spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  errorIconText: {
    color: theme.colors.danger,
    fontSize: 28,
    fontWeight: '800',
  },

  errorTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },

  errorText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: theme.spacing.xxl,
  },

  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxxl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.md,
  },

  retryButtonText: {
    color: theme.colors.background,
    fontWeight: '800',
  },

  errorBanner: {
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },

  errorBannerText: {
    color: '#FF8A80',
    fontSize: 13,
  },

  bottomSpace: {
    height: 20,
  },
});
