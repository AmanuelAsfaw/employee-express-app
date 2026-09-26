// src/screens/Employee/ConsigneesListScreen.js

import React, {
  useCallback,
  useEffect,
  useMemo,
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

import {
  getConsigneesAPI,
  createConsigneeAPI,
  updateConsigneeAPI,
  deleteConsigneeAPI,
} from '../../utils/employe_api_utils'

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
    return '?'
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
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

/* -------------------------------------------------------------------------- */
/* Main Screen                                                                */
/* -------------------------------------------------------------------------- */

const ConsigneesListScreen = () => {
  const [consignees, setConsignees] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  /* ------------------------------------------------------------------------ */
  /* API                                                                      */
  /* ------------------------------------------------------------------------ */

  const loadConsignees = useCallback(async () => {
    try {
      setLoading(true)

      const data = await getConsigneesAPI(search)

      setConsignees(data)
    } catch (error) {
      console.error('Error loading consignees:', error)

      Alert.alert(
        'Error',
        'Unable to load consignees.'
      )
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadConsignees()
  }, [loadConsignees])

  const onRefresh = async () => {
    try {
      setRefreshing(true)

      const data = await getConsigneesAPI(search)

      setConsignees(data)
    } catch (error) {
      console.error('Refresh error:', error)

      Alert.alert(
        'Error',
        'Unable to refresh consignees.'
      )
    } finally {
      setRefreshing(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Modal                                                                    */
  /* ------------------------------------------------------------------------ */

  const openCreate = () => {
    setEditing(false)
    setCurrentId(null)
    setFormData({ ...emptyForm })
    setModalVisible(true)
  }

  const openEdit = (consignee) => {
    setEditing(true)
    setCurrentId(consignee.id)

    setFormData({
      name: consignee.name || '',
      phone: consignee.phone || '',
      company_name_address:
        consignee.company_name_address || '',
      tin_number: consignee.tin_number || '',
      country: consignee.country || '',
    })

    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalVisible(false)
    setFormData({ ...emptyForm })
    setCurrentId(null)
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

  const saveConsignee = async () => {
    if (!formData.name.trim()) {
      Alert.alert(
        'Validation',
        'Please enter the consignee name.'
      )

      return
    }

    try {
      setSaving(true)

      if (editing) {
        await updateConsigneeAPI(
          currentId,
          formData
        )
      } else {
        await createConsigneeAPI(formData)
      }

      setModalVisible(false)
      setFormData({ ...emptyForm })
      setCurrentId(null)

      await loadConsignees()
    } catch (error) {
      console.error(
        'Save consignee error:',
        error
      )

      const message =
        error?.response?.data?.detail ||
        'Unable to save consignee.'

      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  const confirmDelete = (consignee) => {
    Alert.alert(
      'Delete Consignee',
      `Are you sure you want to delete "${consignee.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteConsigneeHandler(consignee.id),
        },
      ]
    )
  }

  const deleteConsigneeHandler = async (id) => {
    try {
      setLoading(true)

      await deleteConsigneeAPI(id)

      await loadConsignees()
    } catch (error) {
      console.error(
        'Delete consignee error:',
        error
      )

      Alert.alert(
        'Error',
        'Unable to delete consignee.'
      )

      setLoading(false)
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Derived                                                                  */
  /* ------------------------------------------------------------------------ */

  const resultText = useMemo(() => {
    if (loading) return ''

    if (consignees.length === 1) {
      return '1 consignee'
    }

    return `${consignees.length} consignees`
  }, [consignees.length, loading])

  /* ------------------------------------------------------------------------ */
  /* Card                                                                     */
  /* ------------------------------------------------------------------------ */

  const renderConsignee = ({ item }) => {
    const initials = getInitials(item.name)
    const avatarColor = getAvatarColor(item.name)

    return (
      <View style={styles.card}>
        {/* Top section */}
        <View style={styles.cardTop}>
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

          <View style={styles.identity}>
            <Text
              style={styles.consigneeName}
              numberOfLines={1}
            >
              {item.name || 'Unnamed consignee'}
            </Text>

            <View style={styles.countryRow}>
              <View style={styles.countryDot} />

              <Text
                style={styles.country}
                numberOfLines={1}
              >
                {item.country || 'Country not specified'}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => openEdit(item)}
            >
              <Text style={styles.editIcon}>
                ✎
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                styles.deleteIconButton,
              ]}
              activeOpacity={0.7}
              onPress={() => confirmDelete(item)}
            >
              <Text style={styles.deleteIcon}>
                ×
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Details */}
        <View style={styles.details}>
          <DetailRow
            icon="☎"
            label="Phone"
            value={item.phone}
          />

          <DetailRow
            icon="⌂"
            label="Company / Address"
            value={item.company_name_address}
            multiline
          />

          <DetailRow
            icon="#"
            label="TIN Number"
            value={item.tin_number}
            last
          />
        </View>
      </View>
    )
  }

  /* ------------------------------------------------------------------------ */
  /* Empty                                                                    */
  /* ------------------------------------------------------------------------ */

  const renderEmpty = () => {
    if (loading) return null

    const hasSearch = search.trim().length > 0

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>
            {hasSearch ? '⌕' : '+'}
          </Text>
        </View>

        <Text style={styles.emptyTitle}>
          {hasSearch
            ? 'No matching consignees'
            : 'No consignees yet'}
        </Text>

        <Text style={styles.emptyText}>
          {hasSearch
            ? 'Try searching with another name, phone number, or company.'
            : 'Add your first consignee to start managing your delivery contacts.'}
        </Text>

        {!hasSearch && (
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.8}
            onPress={openCreate}
          >
            <Text style={styles.emptyButtonText}>
              + Add Consignee
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
              Consignees
            </Text>

            <Text style={styles.subtitle}>
              Manage your delivery contacts
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.8}
            onPress={openCreate}
          >
            <View style={styles.newButtonIcon}>
              <Text style={styles.plus}>
                +
              </Text>
            </View>

            <Text style={styles.newButtonText}>
              New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>
              ⌕
            </Text>

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
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Results heading */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Your consignees
          </Text>

          {!!resultText && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {resultText}
              </Text>
            </View>
          )}
        </View>

        {/* Loading */}
        {loading && consignees.length === 0 ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />

              <Text style={styles.loadingText}>
                Loading consignees...
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={consignees}
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderConsignee}
            contentContainerStyle={[
              styles.listContent,
              consignees.length === 0 &&
                styles.emptyList,
            ]}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
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
        animationType="slide"
        transparent
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
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleArea}>
                <View style={styles.modalIcon}>
                  <Text style={styles.modalIconText}>
                    {editing ? '✎' : '+'}
                  </Text>
                </View>

                <View style={styles.modalTitleText}>
                  <Text style={styles.modalTitle}>
                    {editing
                      ? 'Edit Consignee'
                      : 'New Consignee'}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editing
                      ? 'Update contact information'
                      : 'Add a new delivery contact'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.modalBody
              }
              keyboardDismissMode="interactive"
            >
              <Text style={styles.sectionLabel}>
                BASIC INFORMATION
              </Text>

              <InputField
                label="Consignee Name"
                value={formData.name}
                onChangeText={(value) =>
                  updateField('name', value)
                }
                placeholder="e.g. Abebe Kebede"
                required
                autoCapitalize="words"
              />

              <InputField
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) =>
                  updateField('phone', value)
                }
                placeholder="e.g. +251 91 234 5678"
                keyboardType="phone-pad"
              />

              <InputField
                label="Country"
                value={formData.country}
                onChangeText={(value) =>
                  updateField('country', value)
                }
                placeholder="e.g. Ethiopia"
                autoCapitalize="words"
              />

              <Text style={styles.sectionLabel}>
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
                multiline
                numberOfLines={4}
              />

              <InputField
                label="TIN Number"
                value={formData.tin_number}
                onChangeText={(value) =>
                  updateField(
                    'tin_number',
                    value
                  )
                }
                placeholder="Enter TIN number"
              />

              <View style={styles.formBottomSpace} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveConsignee}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      {editing
                        ? 'Save Changes'
                        : 'Create Consignee'}
                    </Text>

                    <Text style={styles.saveArrow}>
                      →
                    </Text>
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
/* Detail Row                                                                 */
/* -------------------------------------------------------------------------- */

const DetailRow = ({
  icon,
  label,
  value,
  multiline = false,
  last = false,
}) => {
  return (
    <View
      style={[
        styles.detailRow,
        last && styles.detailRowLast,
      ]}
    >
      <View style={styles.detailIcon}>
        <Text style={styles.detailIconText}>
          {icon}
        </Text>
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
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  required = false,
  autoCapitalize = 'sentences',
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}

        {required && (
          <Text style={styles.required}>
            {' '}
            *
          </Text>
        )}
      </Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
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
  )
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    paddingRight: 16,
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

  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,

    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  newButtonIcon: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  plus: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '500',
    lineHeight: 24,
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* ---------------------------------------------------------------------- */
  /* Search                                                                  */
  /* ---------------------------------------------------------------------- */

  searchWrapper: {
    marginBottom: 18,
  },

  searchContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 15,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  searchIcon: {
    color: theme.colors.primary,
    fontSize: 23,
    width: 30,
    textAlign: 'center',
    marginRight: 5,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: 14,
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
    backgroundColor:
      theme.colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
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

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
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

  cardTop: {
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

  identity: {
    flex: 1,
    marginLeft: 13,
    paddingRight: 8,
  },

  consigneeName: {
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
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  },

  country: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
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
    marginLeft: 6,
  },

  deleteIconButton: {
    backgroundColor:
      'rgba(231,76,60,0.08)',
    borderColor:
      'rgba(231,76,60,0.15)',
  },

  editIcon: {
    color: theme.colors.warning,
    fontSize: 19,
    fontWeight: '600',
  },

  deleteIcon: {
    color: theme.colors.danger,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 22,
  },

  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 15,
  },

  details: {
    gap: 12,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailRowLast: {
    marginBottom: 0,
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor:
      theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  detailIconText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor:
      theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emptyIconText: {
    color: theme.colors.primary,
    fontSize: 30,
    fontWeight: '300',
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
    marginTop: 20,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      theme.colors.border,
    alignSelf: 'center',
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
    borderBottomColor: theme.colors.divider,
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
    backgroundColor:
      theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalIconText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
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
    backgroundColor:
      theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  closeButtonText: {
    color: theme.colors.text,
    fontSize: 25,
    fontWeight: '300',
    lineHeight: 26,
  },

  modalBody: {
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
    marginTop: 2,
  },

  inputGroup: {
    marginBottom: 17,
  },

  inputLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },

  required: {
    color: theme.colors.danger,
  },

  input: {
    minHeight: 49,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: theme.colors.text,
    fontSize: 14,
  },

  textArea: {
    minHeight: 100,
    paddingTop: 13,
    paddingBottom: 13,
  },

  formBottomSpace: {
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
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
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
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.primary,

    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 4,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  saveArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 8,
    marginTop: -1,
  },
})

export default ConsigneesListScreen
