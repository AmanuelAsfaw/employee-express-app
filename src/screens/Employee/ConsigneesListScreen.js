// src/screens/Employee/ConsigneesListScreen.js
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

const emptyForm = {
  name: '',
  phone: '',
  company_name_address: '',
  tin_number: '',
  country: '',
}

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

      const data = await getConsignees(search)
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
      console.error('Save consignee error:', error)

      const message =
        error?.response?.data?.detail ||
        'Unable to save consignee.'

      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

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

  const renderConsignee = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Text
              style={styles.consigneeName}
              numberOfLines={1}
            >
              {item.name || '-'}
            </Text>

            <Text style={styles.country}>
              {item.country || '-'}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.editButton,
              ]}
              activeOpacity={0.8}
              onPress={() => openEdit(item)}
            >
              <Text style={styles.editButtonText}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.deleteButton,
              ]}
              activeOpacity={0.8}
              onPress={() => confirmDelete(item)}
            >
              <Text style={styles.deleteButtonText}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Phone
          </Text>

          <Text style={styles.value}>
            {item.phone || '-'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Company / Address
          </Text>

          <Text
            style={styles.value}
            numberOfLines={3}
          >
            {item.company_name_address || '-'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            TIN
          </Text>

          <Text style={styles.value}>
            {item.tin_number || '-'}
          </Text>
        </View>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          No Consignees found
        </Text>

        <Text style={styles.emptyText}>
          Try changing your search or create a new
          consignee.
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Consignees
            </Text>

            <Text style={styles.subtitle}>
              Manage your consignees
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.8}
            onPress={openCreate}
          >
            <Text style={styles.plus}>
              +
            </Text>

            <Text style={styles.newButtonText}>
              New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search consignee..."
            placeholderTextColor={
              theme.colors.textSecondary
            }
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Loading */}
        {loading && consignees.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading consignees...
            </Text>
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
          />
        )}
      </View>

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editing
                    ? 'Edit Consignee'
                    : 'New Consignee'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {editing
                    ? 'Update consignee information'
                    : 'Add a new consignee'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.closeButtonText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.modalBody
              }
            >
              <InputField
                label="Consignee Name"
                value={formData.name}
                onChangeText={(value) =>
                  updateField('name', value)
                }
                placeholder="Enter consignee name"
                required
              />

              <InputField
                label="Phone"
                value={formData.phone}
                onChangeText={(value) =>
                  updateField('phone', value)
                }
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />

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
                placeholder="Enter company name or address"
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

              <InputField
                label="Country"
                value={formData.country}
                onChangeText={(value) =>
                  updateField(
                    'country',
                    value
                  )
                }
                placeholder="Enter country"
              />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.cancelButton,
                ]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.saveButton,
                ]}
                onPress={saveConsignee}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color={theme.colors.background}
                    size="small"
                  />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editing
                      ? 'Update'
                      : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

/**
 * Reusable input component
 */
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  required = false,
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
        textAlignVertical={
          multiline ? 'top' : 'center'
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xxl,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },

  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    height: 44,
    borderRadius: theme.radius.md,
  },

  plus: {
    color: theme.colors.background,
    fontSize: 23,
    fontWeight: '600',
    marginRight: 6,
    lineHeight: 24,
  },

  newButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  },

  /* Search */

  searchContainer: {
    marginBottom: theme.spacing.lg,
  },

  searchInput: {
    height: 48,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 15,
    color: theme.colors.text,
    fontSize: 14,
  },

  /* List */

  listContent: {
    paddingTop: 4,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  /* Card */

  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,

    shadowColor: theme.shadows.card.shadowColor,
    shadowOffset:
      theme.shadows.card.shadowOffset,
    shadowOpacity:
      theme.shadows.card.shadowOpacity,
    shadowRadius:
      theme.shadows.card.shadowRadius,
    elevation: theme.shadows.card.elevation,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  nameContainer: {
    flex: 1,
    paddingRight: 10,
  },

  consigneeName: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },

  country: {
    color: theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    minWidth: 58,
    height: 34,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    marginLeft: 6,
  },

  editButton: {
    backgroundColor:
      'rgba(217,119,6,0.15)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },

  editButtonText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },

  deleteButton: {
    backgroundColor:
      'rgba(231,76,60,0.15)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },

  deleteButtonText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  label: {
    width: 125,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  value: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 19,
  },

  /* Loading */

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },

  /* Empty */

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 28,
  },

  modalBody: {
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: 10,
  },

  /* Form */

  inputGroup: {
    marginBottom: theme.spacing.xl,
  },

  inputLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  required: {
    color: theme.colors.danger,
  },

  input: {
    minHeight: 48,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    color: theme.colors.text,
    fontSize: 14,
  },

  textArea: {
    minHeight: 105,
    paddingTop: 13,
  },

  /* Modal footer */

  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    gap: 10,
  },

  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButton: {
    backgroundColor:
      theme.colors.overlayLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  saveButton: {
    backgroundColor: theme.colors.primary,
  },

  saveButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
})

export default ConsigneesListScreen
