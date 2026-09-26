// src/screens/Employee/SendersListScreen.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import api from '../../utils/axioServices'
import { END_POINT } from '../../constants/urls'
import { theme } from '../../theme/theme'
import { Alert } from '../../components/Alert'

const emptyForm = {
  name: '',
  phone: '',
  company_name_address: '',
  tin_number: '',
  country: '',
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return 'S'
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase()
}

const getAvatarColor = (name = '') => {
  const colors = [
    '#2563EB',
    '#7C3AED',
    '#0891B2',
    '#059669',
    '#D97706',
    '#DB2777',
    '#4F46E5',
  ]

  let hash = 0

  for (let i = 0; i < name.length; i++) {
    hash =
      name.charCodeAt(i) +
      ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

/* -------------------------------------------------------------------------- */
/* Detail Row                                                                 */
/* -------------------------------------------------------------------------- */

const DetailRow = ({
  icon,
  label,
  value,
  multiline = false,
}) => {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={15}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={multiline ? 2 : 1}
        >
          {value || 'Not provided'}
        </Text>
      </View>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/* Input Field                                                                */
/* -------------------------------------------------------------------------- */

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  required = false,
  autoCapitalize = 'sentences',
}) => {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>
          {label}
        </Text>

        {required && (
          <Text style={styles.required}>
            *
          </Text>
        )}
      </View>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={theme.colors.textSecondary}
          style={[
            styles.inputIcon,
            multiline && styles.inputIconMultiline,
          ]}
        />

        <TextInput
          style={[
            styles.input,
            multiline && styles.textarea,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            theme.colors.textSecondary
          }
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical={
            multiline ? 'top' : 'center'
          }
        />
      </View>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/* Main Screen                                                                */
/* -------------------------------------------------------------------------- */

const SendersListScreen = () => {
  const route = useRoute()

  const sender_id = route.params?.senderId

  const [senders, setSenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)

  const [currentId, setCurrentId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const [saving, setSaving] = useState(false)

  /*
   * Prevent senderId from opening the same modal repeatedly
   * when the sender list changes.
   */
  const openedSenderRef = useRef(null)

  /* ------------------------------------------------------------------------ */
  /* Load Senders                                                             */
  /* ------------------------------------------------------------------------ */

  const loadSenders = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        const res = await api.get(
          `${END_POINT}/express-api/api/senders/?search=${encodeURIComponent(
            search
          )}`
        )

        setSenders(
          res.data.results ||
            res.data ||
            []
        )
      } catch (err) {
        console.error(
          'Error loading senders:',
          err
        )

        Alert.alert(
          'Error',
          'Unable to load senders.'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [search]
  )

  useEffect(() => {
    loadSenders()
  }, [loadSenders])

  /* ------------------------------------------------------------------------ */
  /* Auto Open Sender                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (
      !sender_id ||
      senders.length === 0 ||
      openedSenderRef.current === sender_id
    ) {
      return
    }

    const sender = senders.find(
      (item) =>
        String(item.id) === String(sender_id)
    )

    if (sender) {
      openedSenderRef.current = sender_id
      openEdit(sender)
    }
  }, [sender_id, senders])

  /* ------------------------------------------------------------------------ */
  /* Modal                                                                    */
  /* ------------------------------------------------------------------------ */

  const openCreate = () => {
    setEditing(false)
    setCurrentId(null)
    setFormData({ ...emptyForm })
    setModalVisible(true)
  }

  const openEdit = (sender) => {
    setEditing(true)
    setCurrentId(sender.id)

    setFormData({
      name: sender.name || '',
      phone: sender.phone || '',
      company_name_address:
        sender.company_name_address || '',
      tin_number: sender.tin_number || '',
      country: sender.country || '',
    })

    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalVisible(false)
    setEditing(false)
    setCurrentId(null)
    setFormData({ ...emptyForm })
  }

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  /* ------------------------------------------------------------------------ */
  /* Save                                                                     */
  /* ------------------------------------------------------------------------ */

  const saveSender = async () => {
    if (!formData.name.trim()) {
      Alert.alert(
        'Validation',
        'Sender name is required.'
      )

      return
    }

    try {
      setSaving(true)

      if (editing) {
        await api.put(
          `${END_POINT}/express-api/api/senders/${currentId}/`,
          formData
        )
      } else {
        await api.post(
          `${END_POINT}/express-api/api/senders/`,
          formData
        )
      }

      closeModal()

      await loadSenders()
    } catch (err) {
      console.error(
        'Error saving sender:',
        err
      )

      const message =
        err?.response?.data?.detail ||
        'Unable to save sender.'

      Alert.alert(
        'Error',
        message
      )
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  const deleteSender = (sender) => {
    Alert.alert(
      'Delete Sender',
      `Are you sure you want to delete "${sender.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)

              await api.delete(
                `${END_POINT}/express-api/api/senders/${sender.id}/`
              )

              await loadSenders()
            } catch (err) {
              console.error(
                'Error deleting sender:',
                err
              )

              Alert.alert(
                'Error',
                'Unable to delete sender.'
              )

              setLoading(false)
            }
          },
        },
      ]
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Derived                                                                  */
  /* ------------------------------------------------------------------------ */

  const resultText = useMemo(() => {
    if (loading) return ''

    if (senders.length === 1) {
      return '1 sender'
    }

    return `${senders.length} senders`
  }, [loading, senders.length])

  /* ------------------------------------------------------------------------ */
  /* Sender Card                                                              */
  /* ------------------------------------------------------------------------ */

  const renderSender = ({ item }) => {
    const initials = getInitials(item.name)
    const avatarColor = getAvatarColor(
      item.name
    )

    return (
      <View style={styles.senderCard}>
        {/* Header */}
        <View style={styles.senderHeader}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: avatarColor,
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <View style={styles.senderIdentity}>
            <Text
              style={styles.senderName}
              numberOfLines={1}
            >
              {item.name || 'Unnamed sender'}
            </Text>

            <View style={styles.countryRow}>
              <View style={styles.countryDot} />

              <Text
                style={styles.countryText}
                numberOfLines={1}
              >
                {item.country ||
                  'Country not specified'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() =>
                openEdit(item)
              }
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.colors.warning}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.7}
              onPress={() =>
                deleteSender(item)
              }
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.danger}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.details}>
          <DetailRow
            icon="call-outline"
            label="Phone"
            value={item.phone}
          />

          <DetailRow
            icon="business-outline"
            label="Company / Address"
            value={
              item.company_name_address
            }
            multiline
          />

          <DetailRow
            icon="card-outline"
            label="TIN Number"
            value={item.tin_number}
          />
        </View>
      </View>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Empty State                                                              */
  /* ------------------------------------------------------------------------ */

  const renderEmpty = () => {
    if (loading) {
      return null
    }

    const hasSearch =
      search.trim().length > 0

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name={
              hasSearch
                ? 'search-outline'
                : 'people-outline'
            }
            size={32}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {hasSearch
            ? 'No matching senders'
            : 'No senders yet'}
        </Text>

        <Text style={styles.emptyText}>
          {hasSearch
            ? 'Try another name, phone number, or company.'
            : 'Add your first sender to start managing your shipment contacts.'}
        </Text>

        {!hasSearch && (
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.8}
            onPress={openCreate}
          >
            <Ionicons
              name="add"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={styles.emptyButtonText}
            >
              Add Sender
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              DIRECTORY
            </Text>

            <Text style={styles.title}>
              Senders
            </Text>

            <Text style={styles.subtitle}>
              Manage your shipment contacts
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={openCreate}
          >
            <View style={styles.addIconContainer}>
              <Ionicons
                name="add"
                size={21}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.addButtonText}>
              New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.primary}
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone or company"
            placeholderTextColor={
              theme.colors.textSecondary
            }
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearSearch}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Your senders
          </Text>

          {!!resultText && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {resultText}
              </Text>
            </View>
          )}
        </View>

        {/* List */}
        {loading && senders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />

              <Text style={styles.loadingText}>
                Loading senders...
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={senders}
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderSender}
            ListEmptyComponent={
              renderEmpty
            }
            contentContainerStyle={[
              styles.listContent,
              senders.length === 0 &&
                styles.emptyList,
            ]}
            showsVerticalScrollIndicator={
              false
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() =>
                  loadSenders(true)
                }
                tintColor={
                  theme.colors.primary
                }
                colors={[
                  theme.colors.primary,
                ]}
              />
            }
            keyboardShouldPersistTaps="handled"
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Create / Edit Modal                                                 */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
        >
          <View style={styles.modalContainer}>
            {/* Drag Handle */}
            <View
              style={styles.dragHandle}
            />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View
                style={styles.modalTitleArea}
              >
                <View
                  style={styles.modalIcon}
                >
                  <Ionicons
                    name={
                      editing
                        ? 'create-outline'
                        : 'person-add-outline'
                    }
                    size={21}
                    color="#FFFFFF"
                  />
                </View>

                <View
                  style={styles.modalTitleText}
                >
                  <Text
                    style={styles.modalTitle}
                  >
                    {editing
                      ? 'Edit Sender'
                      : 'New Sender'}
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    {editing
                      ? 'Update sender information'
                      : 'Add a new shipment contact'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={
                styles.modalBodyContent
              }
            >
              <Text
                style={styles.sectionLabel}
              >
                BASIC INFORMATION
              </Text>

              <InputField
                label="Sender Name"
                value={formData.name}
                onChangeText={(value) =>
                  updateField(
                    'name',
                    value
                  )
                }
                placeholder="e.g. Abebe Kebede"
                icon="person-outline"
                required
                autoCapitalize="words"
              />

              <InputField
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) =>
                  updateField(
                    'phone',
                    value
                  )
                }
                placeholder="+251 91 234 5678"
                icon="call-outline"
                keyboardType="phone-pad"
              />

              <InputField
                label="Country"
                value={formData.country}
                onChangeText={(value) =>
                  updateField(
                    'country',
                    value
                  )
                }
                placeholder="e.g. Ethiopia"
                icon="globe-outline"
                autoCapitalize="words"
              />

              <Text
                style={[
                  styles.sectionLabel,
                  styles.businessSection,
                ]}
              >
                BUSINESS DETAILS
              </Text>

              <InputField
                label="Company / Address"
                value={
                  formData.company_name_address
                }
                onChangeText={(value) =>
                  updateField(
                    'company_name_address',
                    value
                  )
                }
                placeholder="Enter company name or full address"
                icon="business-outline"
                multiline
                numberOfLines={4}
              />

              <InputField
                label="TIN Number"
                value={
                  formData.tin_number
                }
                onChangeText={(value) =>
                  updateField(
                    'tin_number',
                    value
                  )
                }
                placeholder="Enter TIN number"
                icon="card-outline"
              />

              <View
                style={styles.bottomSpace}
              />
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSender}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      {editing
                        ? 'Save Changes'
                        : 'Create Sender'}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#FFFFFF"
                      style={
                        styles.saveArrow
                      }
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
    paddingHorizontal: 20,
  },

  /* ---------------------------------------------------------------------- */
  /* Header                                                                  */
  /* ---------------------------------------------------------------------- */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  addButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor:
      theme.colors.primary,

    shadowColor:
      theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  addIconContainer: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* ---------------------------------------------------------------------- */
  /* Search                                                                  */
  /* ---------------------------------------------------------------------- */

  searchContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 18,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 1,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: 14,
  },

  clearSearch: {
    paddingLeft: 8,
    paddingVertical: 5,
  },

  /* ---------------------------------------------------------------------- */
  /* Results Header                                                          */
  /* ---------------------------------------------------------------------- */

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  resultsTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  countText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  /* ---------------------------------------------------------------------- */
  /* List                                                                    */
  /* ---------------------------------------------------------------------- */

  listContent: {
    paddingTop: 2,
    paddingBottom: 35,
  },

  emptyList: {
    flexGrow: 1,
  },

  /* ---------------------------------------------------------------------- */
  /* Card                                                                    */
  /* ---------------------------------------------------------------------- */

  senderCard: {
    backgroundColor:
      theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    padding: 17,
    marginBottom: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2,
  },

  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  senderIdentity: {
    flex: 1,
    marginLeft: 13,
    paddingRight: 8,
  },

  senderName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  countryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.primary,
    marginRight: 6,
  },

  countryText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(217,119,6,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(217,119,6,0.18)',
    marginLeft: 5,
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(231,76,60,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(231,76,60,0.15)',
    marginLeft: 6,
  },

  divider: {
    height: 1,
    backgroundColor:
      theme.colors.divider,
    marginVertical: 15,
  },

  details: {
    gap: 12,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    marginRight: 10,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  detailValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                 */
  /* ---------------------------------------------------------------------- */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  /* ---------------------------------------------------------------------- */
  /* Empty                                                                   */
  /* ---------------------------------------------------------------------- */

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    marginBottom: 18,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },

  emptyButton: {
    height: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor:
      theme.colors.primary,
    marginTop: 20,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },

  /* ---------------------------------------------------------------------- */
  /* Modal                                                                   */
  /* ---------------------------------------------------------------------- */

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      'rgba(15,23,42,0.58)',
  },

  modalContainer: {
    maxHeight: '94%',
    backgroundColor:
      theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor:
      theme.colors.border,
    marginTop: 9,
    marginBottom: 3,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor:
      theme.colors.divider,
  },

  modalTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primary,
    marginRight: 12,
  },

  modalTitleText: {
    flex: 1,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    marginLeft: 10,
  },

  modalBody: {
    flexGrow: 0,
  },

  modalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
  },

  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 13,
  },

  businessSection: {
    marginTop: 2,
  },

  inputContainer: {
    marginBottom: 17,
  },

  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  inputLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  required: {
    color: theme.colors.danger,
    fontSize: 13,
    marginLeft: 3,
  },

  inputWrapper: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 13,
  },

  inputWrapperMultiline: {
    alignItems: 'flex-start',
    minHeight: 105,
  },

  inputIcon: {
    marginRight: 9,
  },

  inputIconMultiline: {
    marginTop: 13,
  },

  input: {
    flex: 1,
    minHeight: 48,
    color: theme.colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },

  textarea: {
    minHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },

  bottomSpace: {
    height: 5,
  },

  /* ---------------------------------------------------------------------- */
  /* Modal Footer                                                            */
  /* ---------------------------------------------------------------------- */

  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom:
      Platform.OS === 'ios' ? 25 : 17,
    borderTopWidth: 1,
    borderTopColor:
      theme.colors.divider,
    backgroundColor:
      theme.colors.surface,
    gap: 10,
  },

  cancelButton: {
    flex: 0.85,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primary,

    shadowColor:
      theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.20,
    shadowRadius: 9,
    elevation: 4,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  saveArrow: {
    marginLeft: 8,
  },
})

export default SendersListScreen
