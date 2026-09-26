// src/screens/Owner/CompanyConfigScreen/index.js

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import api from '../../../utils/axioServices';
import { END_POINT } from '../../../constants/urls';
import { theme } from '../../../theme/theme';

const CompanyConfigScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: null,

    name: '',
    subdomain: '',
    phone: '',
    short_code: '',
    country: '',
    print_code: '',
    offline_bill_number_limit: '',
    commission_per_bill: '',
    bill_pricing_by: 'manual',

    sms_type: '',
    sms_base_url: '',
    sms_api_key: '',
    sms_api_sender_id: '',

    header_1: '',
    header_2: '',
    header_3: '',
    table_title: '',
    footer_1: '',

    csv_header_1: '',
    csv_header_2: '',
    csv_header_3: '',
    csv_table_title: '',
    csv_footer_1: '',

    logo: null,
  });
  const [dropdown, setDropdown] = useState({
    visible: false,
    name: '',
    label: '',
    options: [],
  });


  const fetchCompany = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get(
        END_POINT + '/usr-mngmnt/api/company-config/'
      );

      setFormData((prev) => ({
        ...prev,
        ...data,
        logo: data.logo || null,
      }));
    } catch (err) {
      console.error('Failed to load company configuration:', err);
      setError('Failed to load company configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError('');
    if (success) setSuccess('');
  };

  const pickLogo = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library access to select a company logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        logo: {
          uri: asset.uri,
          name: asset.fileName || 'company-logo.jpg',
          type: asset.mimeType || 'image/jpeg',
        },
      }));

      setSuccess('');
      setError('');
    } catch (err) {
      console.error('Image picker error:', err);
      setError('Failed to select company logo.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.id) {
      setError('Company configuration ID is missing.');
      return;
    }

    try {
      setSaving(true);
      setSuccess('');
      setError('');

      const fd = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        if (key === 'id' || value === null || value === undefined) {
          return;
        }

        if (key === 'logo') {
          // Existing remote logo URL does not need to be uploaded again.
          if (typeof value === 'string') {
            return;
          }

          if (value?.uri) {
            fd.append('logo', {
              uri: value.uri,
              name: value.name || 'company-logo.jpg',
              type: value.type || 'image/jpeg',
            });
          }

          return;
        }

        fd.append(key, String(value));
      });

      await api.put(
        END_POINT +
          '/usr-mngmnt/api/company-config/' +
          formData.id +
          '/',
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess('Company configuration updated successfully.');

      // Refresh the remote logo/data after saving.
      await fetchCompany();
    } catch (err) {
      console.error('Failed to update company configuration:', err);

      setError(
        err?.response?.data?.detail ||
          'Failed to update company configuration.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderInput = ({
    label,
    name,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
  }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={formData[name] == null ? '' : String(formData[name])}
        onChangeText={(value) => updateField(name, value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.textArea,
        ]}
      />
    </View>
  );

  const openDropdown = ({ label, name, options }) => {
  setDropdown({
    visible: true,
    name,
    label,
    options,
  });
};

const closeDropdown = () => {
  setDropdown((prev) => ({
    ...prev,
    visible: false,
  }));
};

const selectDropdownValue = (value) => {
  updateField(dropdown.name, value);
  closeDropdown();
};

const renderPicker = ({
  label,
  name,
  options,
  placeholder = 'Select',
}) => {
  const selectedOption = options.find(
    (option) => option.value === formData[name]
  );

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() =>
          openDropdown({
            label,
            name,
            options,
          })
        }
        style={({ pressed }) => [
          styles.dropdown,
          pressed && styles.dropdownPressed,
        ]}
      >
        <View style={styles.dropdownContent}>
          <Text
            numberOfLines={1}
            style={[
              styles.dropdownText,
              !selectedOption && styles.dropdownPlaceholder,
            ]}
          >
            {selectedOption?.label || placeholder}
          </Text>
        </View>

        <View style={styles.dropdownIconContainer}>
          <Ionicons
            name="chevron-down"
            size={18}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>
    </View>
  );
};


  const renderSectionHeader = (icon, title, subtitle) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading company configuration...
          </Text>
        </View>
      </View>
    );
  }

  const logoUri =
    typeof formData.logo === 'string'
      ? formData.logo
      : formData.logo?.uri;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="settings-outline"
              size={25}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              Company Configuration
            </Text>

            <Text style={styles.subtitle}>
              Manage your company, billing, SMS and printing settings.
            </Text>
          </View>
        </View>

        {/* ALERTS */}
        {success ? (
          <View style={styles.successAlert}>
            <Ionicons
              name="checkmark-circle"
              size={21}
              color={theme.colors.success}
            />

            <Text style={styles.successText}>
              {success}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorAlert}>
            <Ionicons
              name="alert-circle"
              size={21}
              color={theme.colors.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* GENERAL INFORMATION */}
        <View style={styles.card}>
          {renderSectionHeader(
            'business-outline',
            'General Information',
            'Basic information about your company'
          )}

          {renderInput({
            label: 'Company Name',
            name: 'name',
          })}

          {renderInput({
            label: 'Subdomain',
            name: 'subdomain',
          })}

          {renderInput({
            label: 'Phone',
            name: 'phone',
            keyboardType: 'phone-pad',
          })}

          {renderInput({
            label: 'Country',
            name: 'country',
          })}

          {renderInput({
            label: 'Short Code',
            name: 'short_code',
          })}
        </View>

        {/* BILLING SETTINGS */}
        <View style={styles.card}>
          {renderSectionHeader(
            'print-outline',
            'Billing Settings',
            'Configure how shipment prices are calculated'
          )}

          {renderPicker({
            label: 'Pricing Method',
            name: 'bill_pricing_by',
            options: [
              {
                label: 'Manual',
                value: 'manual',
              },
              {
                label: 'Weight',
                value: 'weight',
              },
              {
                label: 'Max of Weight-to-Volume',
                value: 'weight-to-volume',
              },
              {
                label: 'Volume',
                value: 'volume',
              },
            ],
          })}

          {renderInput({
            label: 'Print Code',
            name: 'print_code',
          })}

          {renderInput({
            label: 'Offline Bill Number Limit',
            name: 'offline_bill_number_limit',
            keyboardType: 'numeric',
          })}

          {renderInput({
            label: 'Commission Per Bill',
            name: 'commission_per_bill',
            keyboardType: 'decimal-pad',
          })}
        </View>

        {/* SMS */}
        <View style={styles.card}>
          {renderSectionHeader(
            'chatbubble-ellipses-outline',
            'SMS Configuration',
            'Configure your SMS provider'
          )}

          {renderPicker({
            label: 'SMS Provider',
            name: 'sms_type',
            placeholder: 'Select SMS Provider',
            options: [
              {
                label: 'Twilio',
                value: 'twilio',
              },
              {
                label: 'AfroMessage',
                value: 'afromessage',
              },
              {
                label: 'Beem',
                value: 'beem',
              },
              {
                label: 'Geez SMS',
                value: 'geez_sms',
              },
            ],
          })}

          {renderInput({
            label: 'SMS Base URL',
            name: 'sms_base_url',
            keyboardType: 'url',
          })}

          {renderInput({
            label: 'SMS API Key',
            name: 'sms_api_key',
          })}

          {renderInput({
            label: 'SMS Sender ID',
            name: 'sms_api_sender_id',
          })}
        </View>

        {/* BILL PRINT */}
        <View style={styles.card}>
          {renderSectionHeader(
            'document-text-outline',
            'Bill Print Configuration',
            'Customize the information displayed on printed bills'
          )}

          {renderInput({
            label: 'Header 1',
            name: 'header_1',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'Header 2',
            name: 'header_2',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'Header 3',
            name: 'header_3',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'Table Title',
            name: 'table_title',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'Footer',
            name: 'footer_1',
            multiline: true,
            numberOfLines: 3,
          })}
        </View>

        {/* CSV */}
        <View style={styles.card}>
          {renderSectionHeader(
            'grid-outline',
            'CSV Export Configuration',
            'Customize CSV export headings and footer'
          )}

          {renderInput({
            label: 'CSV Header 1',
            name: 'csv_header_1',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'CSV Header 2',
            name: 'csv_header_2',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'CSV Header 3',
            name: 'csv_header_3',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'CSV Table Title',
            name: 'csv_table_title',
            multiline: true,
            numberOfLines: 3,
          })}

          {renderInput({
            label: 'CSV Footer',
            name: 'csv_footer_1',
            multiline: true,
            numberOfLines: 4,
          })}
        </View>

        {/* LOGO */}
        <View style={styles.card}>
          {renderSectionHeader(
            'image-outline',
            'Company Logo',
            'Upload the logo used on company documents'
          )}

          <Pressable
            style={({ pressed }) => [
              styles.logoButton,
              pressed && styles.pressed,
            ]}
            onPress={pickLogo}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.logoButtonTextContainer}>
              <Text style={styles.logoButtonTitle}>
                {logoUri ? 'Change Logo' : 'Select Logo'}
              </Text>

              <Text style={styles.logoButtonSubtitle}>
                Choose an image from your device
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>

          {logoUri ? (
            <View style={styles.logoPreviewContainer}>
              <Image
                source={{ uri: logoUri }}
                style={styles.logoPreview}
                resizeMode="contain"
              />

              <Text style={styles.logoPreviewText}>
                Company Logo
              </Text>
            </View>
          ) : null}
        </View>

        {/* SAVE */}
        <Pressable
          disabled={saving}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && !saving && styles.pressed,
            saving && styles.disabledButton,
          ]}
        >
          {saving ? (
            <>
              <ActivityIndicator
                size="small"
                color={theme.colors.white}
              />

              <Text style={styles.saveButtonText}>
                Saving...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={21}
                color={theme.colors.white}
              />

              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>
      <Modal
        visible={dropdown.visible}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeDropdown}
          />

          <View style={styles.dropdownModal}>
            {/* Modal Header */}
            <View style={styles.dropdownModalHeader}>
              <View style={styles.dropdownModalTitleContainer}>
                <View style={styles.dropdownModalIcon}>
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <View>
                  <Text style={styles.dropdownModalTitle}>
                    {dropdown.label}
                  </Text>

                  <Text style={styles.dropdownModalSubtitle}>
                    Select an option
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closeDropdown}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {dropdown.options.map((option) => {
                const selected =
                  formData[dropdown.name] === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      selectDropdownValue(option.value)
                    }
                    style={({ pressed }) => [
                      styles.dropdownOption,
                      selected && styles.dropdownOptionSelected,
                      pressed && styles.dropdownOptionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        selected && styles.optionIconSelected,
                      ]}
                    >
                      <Ionicons
                        name={
                          selected
                            ? 'checkmark'
                            : 'ellipse-outline'
                        }
                        size={selected ? 18 : 16}
                        color={
                          selected
                            ? theme.colors.white
                            : theme.colors.textMuted
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selected &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selected ? (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>
                          Selected
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainer: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxxl,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xxxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(0,216,255,0.10)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 23,
    fontWeight: '800',
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },

  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.35)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  successText: {
    flex: 1,
    color: theme.colors.successLight,
    fontSize: 13,
    marginLeft: theme.spacing.md,
    lineHeight: 19,
  },

  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.35)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  errorText: {
    flex: 1,
    color: theme.colors.dangerLight,
    fontSize: 13,
    marginLeft: theme.spacing.md,
    lineHeight: 19,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },

  field: {
    marginBottom: theme.spacing.lg,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },

  input: {
    minHeight: 48,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text,
    fontSize: 14,
  },

  textArea: {
    minHeight: 90,
    paddingTop: theme.spacing.lg,
  },

  pickerContainer: {
    minHeight: 50,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },

  picker: {
    color: theme.colors.text,
    backgroundColor: 'transparent',
    height: 52,
    width: '100%',
  },

  logoButton: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    paddingHorizontal: theme.spacing.lg,
  },

  logoButtonTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },

  logoButtonTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  logoButtonSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  logoPreviewContainer: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  logoPreview: {
    width: '100%',
    height: 130,
  },

  logoPreviewText: {
    color: theme.colors.black,
    fontSize: 12,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },

  saveButton: {
    minHeight: 54,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxxl,
    ...theme.shadows.button,
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: theme.spacing.md,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  bottomSpace: {
    height: 20,
  },
  dropdown: {
    minHeight: 52,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownPressed: {
    opacity: 0.8,
    borderColor: theme.colors.primary,
  },

  dropdownContent: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },

  dropdownText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  dropdownPlaceholder: {
    color: theme.colors.textMuted,
    fontWeight: '400',
  },

  dropdownIconContainer: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  dropdownModal: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },

  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  dropdownModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dropdownModalIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },

  dropdownModalTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  dropdownModalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },

  optionsContainer: {
    padding: theme.spacing.lg,
  },

  dropdownOption: {
    minHeight: 58,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  dropdownOptionSelected: {
    backgroundColor: 'rgba(0,216,255,0.09)',
    borderColor: theme.colors.primary,
  },

  dropdownOptionPressed: {
    opacity: 0.75,
  },

  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.lg,
  },

  optionIconSelected: {
    backgroundColor: theme.colors.primary,
  },

  dropdownOptionText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  dropdownOptionTextSelected: {
    color: theme.colors.text,
    fontWeight: '800',
  },

  selectedBadge: {
    backgroundColor: 'rgba(0,216,255,0.12)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
  },

  selectedBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

});

export default CompanyConfigScreen;
