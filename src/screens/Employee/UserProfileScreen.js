import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useNavigation } from '@react-navigation/native';
import { logoutAPI } from '../../utils/api_utils';

const UserProfileScreen = ({ navigation, setUserToken }) => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const getAuthToken = async () => {
    // Replace with your actual token storage.
    // Example:
    // return await AsyncStorage.getItem('access_token');

    return null;
  };

  const loadUser = (isRefresh = false) => {
    fetchUserAPI(setUser, setForm, setError, setLoading, setRefreshing, isRefresh);
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
      console.log(response);
      

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || data?.message || 'Failed to update user profile.',
        );
      }

      setUser(data);
      setForm(data);

      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
      );
    } catch (err) {
      setError(err.message || 'Failed to update user profile.');
    } finally {
      setSaving(false);
    }
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
    } = options;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          {label}
        </Text>

        <TextInput
          value={
            form[field] !== null && form[field] !== undefined
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
            !editable && styles.disabledInput,
          ]}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize="none"
        />
      </View>
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
              await logoutAPI(null, setUser);
              // This triggers root re-render in AppNavigator
              setUserToken(null); 
            } catch (err) {
              console.error('Logout failed:', err);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
            <View style={styles.loadingHeader}>
            <Text style={styles.loadingTitle}>
                My Profile
            </Text>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Text style={styles.logoutButtonText}>
                Logout
                </Text>
            </TouchableOpacity>
            </View>

            <View style={styles.loadingContainer}>
            <ActivityIndicator
                size="large"
                color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
                Loading your profile...
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
            <View style={styles.loadingHeader}>
            <Text style={styles.loadingTitle}>
                My Profile
            </Text>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Text style={styles.logoutButtonText}>
                Logout
                </Text>
            </TouchableOpacity>
            </View>

            <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>
                !
                </Text>
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
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
                <Text style={styles.title}>
                My Profile
                </Text>

                <Text style={styles.subtitle}>
                Manage your personal information
                </Text>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Text style={styles.logoutButtonText}>
                Logout
                </Text>
            </TouchableOpacity>
            </View>


          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials()}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {form.first_name || form.last_name
                  ? `${form.first_name || ''} ${
                      form.last_name || ''
                    }`.trim()
                  : form.username || 'User'}
              </Text>

              <Text style={styles.profileUsername}>
                @{form.username || ''}
              </Text>

              {form.role ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {typeof form.role === 'object'
                      ? form.role.name
                      : `Role #${form.role}`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Personal Information
            </Text>

            <View style={styles.card}>
              {renderInput(
                'First Name',
                'first_name',
                {
                  placeholder: 'First name',
                },
              )}

              {renderInput(
                'Last Name',
                'last_name',
                {
                  placeholder: 'Last name',
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
                'Job Title',
                'job_title',
                {
                  placeholder: 'Job title',
                },
              )}
            </View>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Account Information
            </Text>

            <View style={styles.card}>
              {renderInput(
                'Username',
                'username',
                {
                  placeholder: 'Username',
                },
              )}

              {renderInput(
                'Email',
                'email',
                {
                  placeholder: 'Email address',
                  keyboardType: 'email-address',
                },
              )}

              {renderInput(
                'Company',
                'company',
                {
                  placeholder: 'Company',
                  editable: false,
                },
              )}
            </View>
          </View>

          {/* Organization */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Organization
            </Text>

            <View style={styles.card}>
              {renderInput(
                'Branch',
                'branch',
                {
                  placeholder: 'Branch',
                  editable: false,
                },
              )}

              {renderInput(
                'Role',
                'role',
                {
                  placeholder: 'Role',
                  editable: false,
                },
              )}
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={saveUser}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator
                color={theme.colors.background}
              />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>

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
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxxl,
    },

    headerText: {
    flex: 1,
    marginRight: theme.spacing.lg,
    },

    logoutButton: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    },

    logoutButtonText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
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

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.xxxl,
    ...theme.shadows.card,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },

  avatarText: {
    color: theme.colors.background,
    fontSize: 24,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  profileUsername: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,216,255,0.10)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 5,
    marginTop: theme.spacing.sm,
  },

  roleText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
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

  disabledInput: {
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceElevated,
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
  errorScreen: {
    flex: 1,
},
loadingScreen: {
  flex: 1,
},

loadingHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: theme.spacing.xxl,
  paddingTop: theme.spacing.lg,
},

loadingTitle: {
  color: theme.colors.text,
  fontSize: 22,
  fontWeight: '800',
},


});
