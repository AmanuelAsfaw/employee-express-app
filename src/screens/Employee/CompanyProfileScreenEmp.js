import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
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
import { Alert } from '../../components/Alert';

const CompanyProfileScreenEmp = () => {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

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
      Keyboard.dismiss();
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
        'Company updated',
        'Your company profile has been updated successfully.',
      );
    } catch (err) {
      setError(
        err.message ||
          'Failed to update company profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  const getCompanyInitial = () => {
    return (
      form.name?.charAt(0)?.toUpperCase() || 'C'
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />

          <Text style={styles.eyebrow}>
            COMPANY SETTINGS
          </Text>
        </View>

        <Text style={styles.title}>
          Company Profile
        </Text>

        <Text style={styles.subtitle}>
          Manage your company information
        </Text>
      </View>

      <View style={styles.headerIcon}>
        <Text style={styles.headerIconText}>
          {getCompanyInitial()}
        </Text>
      </View>
    </View>
  );

  const renderCompanyHero = () => (
    <View style={styles.companyHero}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.heroLogoContainer}>
        {form.logo ? (
          <Image
            source={{ uri: form.logo }}
            style={styles.heroLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.heroLogoFallback}>
            <Text style={styles.heroLogoText}>
              {getCompanyInitial()}
            </Text>
          </View>
        )}

        <View style={styles.companyStatus}>
          <View style={styles.statusDot} />
        </View>
      </View>

      <View style={styles.heroInfo}>
        <Text
          style={styles.companyName}
          numberOfLines={2}
        >
          {form.name || 'Your Company'}
        </Text>

        {form.subdomain ? (
          <Text
            style={styles.companySubdomain}
            numberOfLines={1}
          >
            {form.subdomain}
          </Text>
        ) : null}

        <View style={styles.companyBadge}>
          <Text style={styles.companyBadgeIcon}>
            ✓
          </Text>

          <Text style={styles.companyBadgeText}>
            Company account
          </Text>
        </View>
      </View>

      <View style={styles.heroDecoration}>
        <Text style={styles.heroDecorationText}>
          ◈
        </Text>
      </View>
    </View>
  );

  const renderInput = (
    label,
    field,
    options = {},
  ) => {
    const {
      placeholder = '',
      multiline = false,
      keyboardType = 'default',
      editable = true,
      icon = '•',
      helperText = '',
    } = options;

    const isFocused = focusedField === field;

    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>

          {!editable ? (
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyText}>
                READ ONLY
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.inputWrapper,
            multiline && styles.multilineWrapper,
            isFocused &&
              editable &&
              styles.inputWrapperFocused,
            !editable &&
              styles.inputWrapperDisabled,
          ]}
        >
          <View
            style={[
              styles.inputIcon,
              isFocused &&
                editable &&
                styles.inputIconFocused,
              !editable &&
                styles.inputIconDisabled,
            ]}
          >
            <Text style={styles.inputIconText}>
              {icon}
            </Text>
          </View>

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
            placeholderTextColor={
              theme.colors.textMuted
            }
            style={[
              styles.input,
              multiline && styles.multilineInput,
              !editable && styles.disabledInput,
            ]}
            editable={editable}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            keyboardType={keyboardType}
            autoCorrect={false}
            autoCapitalize={
              field === 'subdomain' ||
              field === 'short_code' ||
              field === 'print_code'
                ? 'none'
                : 'words'
            }
            onFocus={() =>
              setFocusedField(field)
            }
            onBlur={() =>
              setFocusedField(null)
            }
            returnKeyType={
              multiline ? 'default' : 'next'
            }
            textAlignVertical={
              multiline ? 'top' : 'center'
            }
          />
        </View>

        {helperText ? (
          <Text style={styles.helperText}>
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderSectionHeader = (
    title,
    subtitle,
    icon,
  ) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Text style={styles.sectionIconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.sectionHeaderContent}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
          <View style={styles.loadingHeader}>
            <View>
              <View style={styles.loadingSmallLine} />
              <View style={styles.loadingTitleLine} />
              <View style={styles.loadingSubtitleLine} />
            </View>

            <View style={styles.loadingIcon} />
          </View>

          <View style={styles.loadingContent}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text style={styles.loadingTitle}>
              Loading company profile
            </Text>

            <Text style={styles.loadingText}>
              Please wait a moment...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!company && error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorScreen}>
          {renderHeader()}

          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>
                !
              </Text>
            </View>

            <Text style={styles.errorTitle}>
              Unable to load company
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadCompanyData()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
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
            : 'height'
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios'
              ? 'interactive'
              : 'on-drag'
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                loadCompanyData(true)
              }
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={styles.content}
        >
          {renderHeader()}

          {error ? (
            <View style={styles.errorBanner}>
              <View style={styles.errorBannerIcon}>
                <Text
                  style={styles.errorBannerIconText}
                >
                  !
                </Text>
              </View>

              <Text style={styles.errorBannerText}>
                {error}
              </Text>
            </View>
          ) : null}

          {renderCompanyHero()}

          {/* Basic Information */}
          <View style={styles.section}>
            {renderSectionHeader(
              'Basic information',
              'Core details about your company',
              '▣',
            )}

            <View style={styles.card}>
              {renderInput(
                'Company name',
                'name',
                {
                  placeholder:
                    'Enter company name',
                  icon: 'A',
                  editable: true,
                },
              )}

              {renderInput(
                'Subdomain',
                'subdomain',
                {
                  placeholder: 'company',
                  icon: '@',
                  editable: true,
                  helperText:
                    'Used to identify your company in the system.',
                },
              )}

              {renderInput(
                'Short code',
                'short_code',
                {
                  placeholder:
                    'Company short code',
                  icon: '#',
                  editable: true,
                },
              )}

              {renderInput(
                'Phone number',
                'phone',
                {
                  placeholder:
                    'Company phone number',
                  keyboardType: 'phone-pad',
                  icon: '⌕',
                  editable: true,
                },
              )}

              {renderInput(
                'Country',
                'country',
                {
                  placeholder: 'Country',
                  icon: '◎',
                  editable: true,
                },
              )}

              {renderInput(
                'Print code',
                'print_code',
                {
                  placeholder:
                    'Enter print code',
                  multiline: true,
                  icon: '▤',
                  editable: true,
                  helperText:
                    'This code can be used for printed documents and receipts.',
                },
              )}
            </View>
          </View>

          {/* Company Logo */}
          {form.logo ? (
            <View style={styles.section}>
              {renderSectionHeader(
                'Company branding',
                'Your current company identity',
                '✦',
              )}

              <View style={styles.logoCard}>
                <View style={styles.logoPreview}>
                  <Image
                    source={{ uri: form.logo }}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.logoInfo}>
                  <Text style={styles.logoTitle}>
                    Company logo
                  </Text>

                  <Text style={styles.logoSubtitle}>
                    This logo is currently associated
                    with your company.
                  </Text>

                  <View style={styles.logoStatus}>
                    <View style={styles.logoStatusDot} />

                    <Text
                      style={styles.logoStatusText}
                    >
                      Active
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Save */}
          <View style={styles.saveArea}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              onPress={saveCompany}
              disabled={saving || true}
              activeOpacity={0.85}
            >
              {saving ? (
                <>
                  <ActivityIndicator
                    color={theme.colors.background}
                    size="small"
                  />

                  <Text
                    style={[
                      styles.saveButtonText,
                      styles.savingText,
                    ]}
                  >
                    Saving changes...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.saveButtonIcon}>
                    ✓
                  </Text>

                  <Text style={styles.saveButtonText}>
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.saveHint}>
              Your company information will be saved
              securely.
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* ================= HEADER ================= */

  header: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 16,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: 7,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  title: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      },
      android: {
        elevation: 3,
      },
    }),
  },

  headerIconText: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },

  /* ================= COMPANY HERO ================= */

  companyHero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 30,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -90,
    top: -90,
    backgroundColor: 'rgba(0,216,255,0.08)',
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -75,
    bottom: -80,
    backgroundColor: 'rgba(0,216,255,0.04)',
  },

  heroLogoContainer: {
    position: 'relative',
    marginRight: 16,
  },

  heroLogo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  heroLogoFallback: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: {
          width: 0,
          height: 6,
        },
      },
      android: {
        elevation: 6,
      },
    }),
  },

  heroLogoText: {
    color: theme.colors.background,
    fontSize: 27,
    fontWeight: '900',
  },

  companyStatus: {
    position: 'absolute',
    width: 17,
    height: 17,
    borderRadius: 9,
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#36D399',
  },

  heroInfo: {
    flex: 1,
    minWidth: 0,
  },

  companyName: {
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  companySubdomain: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  companyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(54,211,153,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(54,211,153,0.16)',
  },

  companyBadgeIcon: {
    color: '#36D399',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 5,
  },

  companyBadgeText: {
    color: '#36D399',
    fontSize: 10,
    fontWeight: '800',
  },

  heroDecoration: {
    position: 'absolute',
    right: 17,
    bottom: 14,
    opacity: 0.35,
  },

  heroDecorationText: {
    color: theme.colors.primary,
    fontSize: 18,
  },

  /* ================= SECTION ================= */

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    paddingHorizontal: 2,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(0,216,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.14)',
  },

  sectionIconText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },

  sectionHeaderContent: {
    flex: 1,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  /* ================= CARD ================= */

  card: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  /* ================= INPUT ================= */

  inputContainer: {
    marginBottom: 17,
  },

  labelRow: {
    minHeight: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
    paddingHorizontal: 2,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  readOnlyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor:
      theme.colors.surfaceElevated,
  },

  readOnlyText: {
    color: theme.colors.textMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor:
      theme.colors.surfaceSecondary,
  },

  multilineWrapper: {
    alignItems: 'flex-start',
    minHeight: 100,
  },

  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor:
      'rgba(0,216,255,0.045)',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },
      android: {
        elevation: 2,
      },
    }),
  },

  inputWrapperDisabled: {
    opacity: 0.68,
    backgroundColor:
      theme.colors.surfaceElevated,
  },

  inputIcon: {
    width: 42,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputIconFocused: {
    opacity: 1,
  },

  inputIconDisabled: {
    opacity: 0.65,
  },

  inputIconText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },

  input: {
    flex: 1,
    minHeight: 50,
    color: theme.colors.text,
    paddingHorizontal: 4,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  multilineInput: {
    minHeight: 96,
    paddingTop: 15,
  },

  disabledInput: {
    color: theme.colors.textSecondary,
  },

  helperText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 6,
    marginLeft: 2,
  },

  /* ================= LOGO ================= */

  logoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  logoPreview: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  logo: {
    width: 60,
    height: 60,
  },

  logoInfo: {
    flex: 1,
  },

  logoTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  logoSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  logoStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  logoStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#36D399',
    marginRight: 5,
  },

  logoStatusText: {
    color: '#36D399',
    fontSize: 9,
    fontWeight: '800',
  },

  /* ================= SAVE ================= */

  saveArea: {
    alignItems: 'center',
    marginTop: 1,
  },

  saveButton: {
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: {
          width: 0,
          height: 7,
        },
      },
      android: {
        elevation: 7,
      },
    }),
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonIcon: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: '900',
    marginRight: 8,
  },

  saveButtonText: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '900',
  },

  savingText: {
    marginLeft: 9,
  },

  saveHint: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 9,
  },

  /* ================= ERROR ================= */

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginBottom: 18,
    borderRadius: 15,
    backgroundColor:
      'rgba(231,76,60,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(231,76,60,0.20)',
  },

  errorBannerIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor:
      'rgba(231,76,60,0.14)',
  },

  errorBannerIconText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },

  errorBannerText: {
    flex: 1,
    color: '#FF8A80',
    fontSize: 12,
    lineHeight: 17,
  },

  /* ================= ERROR SCREEN ================= */

  errorScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  errorCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor:
      'rgba(231,76,60,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(231,76,60,0.20)',
  },

  errorIconText: {
    color: theme.colors.danger,
    fontSize: 30,
    fontWeight: '900',
  },

  errorTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },

  errorText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 24,
  },

  retryButton: {
    minHeight: 48,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },

  retryButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '900',
  },

  /* ================= LOADING ================= */

  loadingScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  loadingHeader: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  loadingSmallLine: {
    width: 105,
    height: 6,
    borderRadius: 4,
    backgroundColor:
      theme.colors.surfaceElevated,
    marginBottom: 8,
  },

  loadingTitleLine: {
    width: 165,
    height: 25,
    borderRadius: 7,
    backgroundColor:
      theme.colors.surfaceElevated,
    marginBottom: 7,
  },

  loadingSubtitleLine: {
    width: 125,
    height: 6,
    borderRadius: 4,
    backgroundColor:
      theme.colors.surfaceElevated,
  },

  loadingIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor:
      theme.colors.surfaceElevated,
  },

  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
  },

  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },

  bottomSpace: {
    height: 20,
  },
});
