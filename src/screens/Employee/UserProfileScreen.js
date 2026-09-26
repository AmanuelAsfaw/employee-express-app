import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { fetchUserAPI } from '../../utils/employe_api_utils';
import { logoutAPI } from '../../utils/api_utils';
import { capitalizeFirstLetter } from '../../utils/other_utils';
import { Alert } from '../../components/Alert';

const UserProfileScreen = ({ setUserToken, setRole }) => {
  const [user, setUser] = useState(null);
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

  const loadUser = (isRefresh = false) => {
    fetchUserAPI(
      setUser,
      setForm,
      setError,
      setLoading,
      setRefreshing,
      isRefresh,
    );
  };

  useEffect(() => {
    loadUser();
  }, []);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const saveUser = async () => {
    try {
      Keyboard.dismiss();
      setSaving(true);
      setError('');

      const token = await getAuthToken();

      const response = await fetch(
        `${END_POINT}/usr-/api/user-profile/`,
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
            username: form.username,
            email: form.email,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            job_title: form.job_title,
            branch: form.branch,
            role: form.role,
            export_file_branches: form.export_file_branches,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'Failed to update user profile.',
        );
      }

      setUser(data);
      setForm(data);

      Alert.alert(
        'Profile updated',
        'Your profile has been updated successfully.',
      );
    } catch (err) {
      setError(
        err.message || 'Failed to update user profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutAPI(null, setUser, setRole);
              setUserToken(null);
              setRole(null);
            } catch (err) {
              console.error('Logout failed:', err);
            }
          },
        },
      ],
    );
  };

  const getInitials = () => {
    const first = form.first_name?.charAt(0) || '';
    const last = form.last_name?.charAt(0) || '';

    if (first || last) {
      return `${first}${last}`.toUpperCase();
    }

    return form.username?.charAt(0)?.toUpperCase() || 'U';
  };

  const getRoleName = () => {
    if (!form.role && !form.role_name) {
      return null;
    }

    if (typeof form.role === 'object') {
      return form.role?.name || 'User';
    }

    return form.role_name
      ? capitalizeFirstLetter(form.role_name)
      : `Role #${form.role}`;
  };

  const renderInput = (
    label,
    field,
    options = {},
  ) => {
    const {
      placeholder = '',
      keyboardType = 'default',
      editable = true,
      icon = '•',
      secureTextEntry = false,
    } = options;

    const isFocused = focusedField === field;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>

        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            !editable && styles.inputWrapperDisabled,
          ]}
        >
          <View
            style={[
              styles.inputIcon,
              isFocused && styles.inputIconFocused,
            ]}
          >
            <Text style={styles.inputIconText}>{icon}</Text>
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
              !editable && styles.disabledInput,
            ]}
            keyboardType={keyboardType}
            editable={editable}
            secureTextEntry={secureTextEntry}
            autoCapitalize={
              field === 'email' ||
              field === 'username'
                ? 'none'
                : 'words'
            }
            autoCorrect={false}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            returnKeyType="next"
          />
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrow}>
            ACCOUNT SETTINGS
          </Text>
        </View>

        <Text style={styles.title}>My Profile</Text>

        <Text style={styles.subtitle}>
          Manage your personal information
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.75}
        hitSlop={{
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
        }}
      >
        <Text style={styles.logoutIcon}>↪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileHero = () => (
    <View style={styles.profileHero}>
      <View style={styles.profileGlow} />

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials()}
          </Text>
        </View>

        <View style={styles.onlineIndicator} />
      </View>

      <View style={styles.profileInfo}>
        <Text
          style={styles.profileName}
          numberOfLines={1}
        >
          {form.first_name || form.last_name
            ? `${form.first_name || ''} ${
                form.last_name || ''
              }`.trim()
            : form.username || 'User'}
        </Text>

        <Text
          style={styles.profileUsername}
          numberOfLines={1}
        >
          @{form.username || 'username'}
        </Text>

        {getRoleName() ? (
          <View style={styles.roleBadge}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>
              {getRoleName()}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.profileArrow}>
        <Text style={styles.profileArrowText}>✦</Text>
      </View>
    </View>
  );

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

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        ) : null}
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
            </View>

            <View style={styles.loadingLogout} />
          </View>

          <View style={styles.loadingContent}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text style={styles.loadingTitle}>
              Loading your profile
            </Text>

            <Text style={styles.loadingText}>
              Please wait a moment...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user && error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorScreen}>
          {renderHeader()}

          <View style={styles.errorCard}>
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
              onPress={() => loadUser()}
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
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUser(true)}
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
                <Text style={styles.errorBannerIconText}>
                  !
                </Text>
              </View>

              <Text style={styles.errorBannerText}>
                {error}
              </Text>
            </View>
          ) : null}

          {renderProfileHero()}

          {/* Personal Information */}
          <View style={styles.section}>
            {renderSectionHeader(
              'Personal information',
              'Your basic personal details',
              '♙',
            )}

            <View style={styles.card}>
              {renderInput(
                'First name',
                'first_name',
                {
                  placeholder: 'Enter your first name',
                  icon: 'A',
                },
              )}

              {renderInput(
                'Last name',
                'last_name',
                {
                  placeholder: 'Enter your last name',
                  icon: 'A',
                },
              )}

              {renderInput(
                'Phone number',
                'phone',
                {
                  placeholder: 'Enter your phone number',
                  keyboardType: 'phone-pad',
                  icon: '⌕',
                },
              )}

              {renderInput(
                'Job title',
                'job_title',
                {
                  placeholder: 'e.g. Sales Manager',
                  icon: '◆',
                },
              )}
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            {renderSectionHeader(
              'Account information',
              'Your login and contact details',
              '◉',
            )}

            <View style={styles.card}>
              {renderInput(
                'Username',
                'username',
                {
                  placeholder: 'Username',
                  icon: '@',
                },
              )}

              {renderInput(
                'Email address',
                'email',
                {
                  placeholder: 'you@example.com',
                  keyboardType: 'email-address',
                  icon: '✉',
                },
              )}

              {renderInput(
                'Company',
                'company_name',
                {
                  placeholder: 'Company',
                  editable: false,
                  icon: '▣',
                },
              )}
            </View>
          </View>

          {/* Organization */}
          <View style={styles.section}>
            {renderSectionHeader(
              'Organization',
              'Your role and workplace',
              '⌘',
            )}

            <View style={styles.card}>
              {renderInput(
                'Branch',
                'branch_name',
                {
                  placeholder: 'Branch',
                  editable: false,
                  icon: '⌂',
                },
              )}

              {renderInput(
                'Role',
                'role_name',
                {
                  placeholder: 'Role',
                  editable: false,
                  icon: '◆',
                },
              )}
            </View>
          </View>

          {/* Save */}
          <View style={styles.saveArea}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              onPress={saveUser}
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
              Your changes will be saved securely.
            </Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

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

  /* ---------------- HEADER ---------------- */

  header: {
    minHeight: 76,
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

  logoutButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.28)',
    backgroundColor: 'rgba(231, 76, 60, 0.07)',
  },

  logoutIcon: {
    color: theme.colors.danger,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 5,
  },

  logoutText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ---------------- PROFILE HERO ---------------- */

  profileHero: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 132,
    padding: 20,
    marginBottom: 30,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  profileGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -80,
    top: -80,
    backgroundColor: 'rgba(0,216,255,0.07)',
  },

  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: {
          width: 0,
          height: 5,
        },
      },
      android: {
        elevation: 6,
      },
    }),
  },

  avatarText: {
    color: theme.colors.background,
    fontSize: 25,
    fontWeight: '900',
  },

  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    right: -2,
    bottom: -2,
    backgroundColor: '#36D399',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
  },

  profileName: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  profileUsername: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,216,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.18)',
  },

  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  },

  roleText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  profileArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
  },

  profileArrowText: {
    color: theme.colors.primary,
    fontSize: 13,
  },

  /* ---------------- SECTIONS ---------------- */

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
    fontSize: 16,
    fontWeight: '800',
  },

  sectionHeaderText: {
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

  /* ---------------- CARDS ---------------- */

  card: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  /* ---------------- INPUTS ---------------- */

  inputGroup: {
    marginBottom: 16,
  },

  inputGroupLast: {
    marginBottom: 0,
  },

  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
    marginLeft: 2,
    letterSpacing: 0.1,
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0,216,255,0.045)',
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
    opacity: 0.72,
    backgroundColor: theme.colors.surfaceElevated,
  },

  inputIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  inputIconFocused: {
    opacity: 1,
  },

  inputIconText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
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

  disabledInput: {
    color: theme.colors.textSecondary,
  },

  /* ---------------- SAVE ---------------- */

  saveArea: {
    alignItems: 'center',
    marginTop: 2,
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
    letterSpacing: 0.1,
  },

  savingText: {
    marginLeft: 9,
  },

  saveHint: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 9,
  },

  /* ---------------- ERROR ---------------- */

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginBottom: 18,
    borderRadius: 15,
    backgroundColor: 'rgba(231,76,60,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.20)',
  },

  errorBannerIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor: 'rgba(231,76,60,0.14)',
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

  /* ---------------- ERROR SCREEN ---------------- */

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
    backgroundColor: 'rgba(231,76,60,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.20)',
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

  /* ---------------- LOADING ---------------- */

  loadingScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  loadingHeader: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  loadingSmallLine: {
    width: 90,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceElevated,
    marginBottom: 8,
  },

  loadingTitleLine: {
    width: 150,
    height: 25,
    borderRadius: 7,
    backgroundColor: theme.colors.surfaceElevated,
  },

  loadingLogout: {
    width: 74,
    height: 40,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceElevated,
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
