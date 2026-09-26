// src/screens/Owner/BranchListScreen/index.js

import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

import { theme } from '../../../theme/theme'
import api from '../../../utils/axioServices'
import { END_POINT } from '../../../constants/urls'

const emptyForm = {
  name: '',
  code: '',
  address: '',
  phone: '',
  is_active: true,
}

const BranchListScreen = () => {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const res = await api.get(
        `${END_POINT}/usr-mngmnt/api/branches/?search=${encodeURIComponent(
          search,
        )}`,
      )

      setBranches(res.data?.results || res.data || [])
    } catch (err) {
      console.error('Failed to load branches:', err)
      setError('Failed to load branches.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBranches()
    }, 300)

    return () => clearTimeout(timer)
  }, [loadBranches])

  const onRefresh = async () => {
    try {
      setRefreshing(true)
      await loadBranches()
    } finally {
      setRefreshing(false)
    }
  }

  const openCreate = () => {
    setEditing(false)
    setCurrentId(null)
    setFormData({
      ...emptyForm,
    })
    setError('')
    setModalVisible(true)
  }

  const openEdit = (branch) => {
    setEditing(true)
    setCurrentId(branch.id)
    setError('')

    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      is_active: branch.is_active ?? true,
    })

    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalVisible(false)
    setError('')
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveBranch = async () => {
    if (!formData.name.trim()) {
      setError('Branch name is required.')
      return
    }

    try {
      setSaving(true)
      setError('')

      if (editing) {
        await api.put(
          `${END_POINT}/usr-mngmnt/api/branches/${currentId}/`,
          formData,
        )
      } else {
        await api.post(
          `${END_POINT}/usr-mngmnt/api/branches/`,
          formData,
        )
      }

      setModalVisible(false)
      setFormData({
        ...emptyForm,
      })

      await loadBranches()
    } catch (err) {
      console.error('Failed to save branch:', err)

      setError(
        err?.response?.data?.detail ||
          'Unable to save branch.',
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteBranch = (id) => {
    Alert.alert(
      'Delete Branch',
      'Are you sure you want to delete this branch?',
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
                `${END_POINT}/usr-mngmnt/api/branches/${id}/`,
              )

              await loadBranches()
            } catch (err) {
              console.error(
                'Failed to delete branch:',
                err,
              )

              Alert.alert(
                'Error',
                'Unable to delete branch.',
              )

              setLoading(false)
            }
          },
        },
      ],
    )
  }

  const renderBranch = ({ item }) => {
    return (
      <View style={styles.branchCard}>
        {/* Header */}
        <View style={styles.branchHeader}>
          <View style={styles.branchTitleContainer}>
            <View style={styles.branchIcon}>
              <Text style={styles.branchIconText}>
                {item.name?.charAt(0)?.toUpperCase() || 'B'}
              </Text>
            </View>

            <View style={styles.branchTitleContent}>
              <Text
                style={styles.branchName}
                numberOfLines={1}
              >
                {item.name || '-'}
              </Text>

              <Text style={styles.branchCode}>
                Code: {item.code || '-'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.is_active
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                item.is_active
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                item.is_active
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Phone
            </Text>

            <Text
              style={styles.detailValue}
              numberOfLines={1}
            >
              {item.phone || '-'}
            </Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Address
            </Text>

            <Text
              style={[
                styles.detailValue,
                styles.addressValue,
              ]}
              numberOfLines={2}
            >
              {item.address || '-'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.editButton,
              pressed && styles.pressed,
            ]}
            onPress={() => openEdit(item)}
          >
            <Text style={styles.editButtonText}>
              ✎
            </Text>

            <Text style={styles.editButtonLabel}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
            onPress={() => deleteBranch(item.id)}
          >
            <Text style={styles.deleteButtonText}>
              🗑
            </Text>

            <Text style={styles.deleteButtonLabel}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>⌂</Text>
        </View>

        <Text style={styles.emptyTitle}>
          No branches found
        </Text>

        <Text style={styles.emptyDescription}>
          {search
            ? 'Try changing your search.'
            : 'Create your first branch to get started.'}
        </Text>

        {!search && (
          <Pressable
            style={styles.emptyButton}
            onPress={openCreate}
          >
            <Text style={styles.emptyButtonText}>
              + New Branch
            </Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>
              Branches
            </Text>

            <Text style={styles.screenSubtitle}>
              Manage your company branches
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={openCreate}
          >
            <Text style={styles.addButtonIcon}>+</Text>

            <Text style={styles.addButtonText}>
              New
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search branch..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          )}
        </View>

        {/* Error */}
        {error && !modalVisible && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable onPress={loadBranches}>
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* Count */}
        {!loading && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {branches.length}{' '}
              {branches.length === 1
                ? 'branch'
                : 'branches'}
            </Text>
          </View>
        )}

        {/* List */}
        {loading && branches.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading branches...
            </Text>
          </View>
        ) : (
          <FlatList
            data={branches}
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderBranch}
            contentContainerStyle={
              branches.length === 0
                ? styles.emptyList
                : styles.listContent
            }
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
                progressBackgroundColor={
                  theme.colors.surfaceElevated
                }
              />
            }
          />
        )}

        {/* Create/Edit Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
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
                      ? 'Edit Branch'
                      : 'New Branch'}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editing
                      ? 'Update branch information'
                      : 'Create a new company branch'}
                  </Text>
                </View>

                <Pressable
                  onPress={closeModal}
                  disabled={saving}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>
                    ×
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.modalContent
                }
              >
                {error && (
                  <View style={styles.modalError}>
                    <Text style={styles.modalErrorText}>
                      {error}
                    </Text>
                  </View>
                )}

                {/* Branch Name */}
                <Field
                  label="Branch Name"
                  required
                  value={formData.name}
                  onChangeText={(value) =>
                    updateField('name', value)
                  }
                  placeholder="Enter branch name"
                />

                {/* Branch Code */}
                <Field
                  label="Branch Code"
                  value={formData.code}
                  onChangeText={(value) =>
                    updateField('code', value)
                  }
                  placeholder="Enter branch code"
                  autoCapitalize="characters"
                />

                {/* Phone */}
                <Field
                  label="Phone"
                  value={formData.phone}
                  onChangeText={(value) =>
                    updateField('phone', value)
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />

                {/* Address */}
                <Field
                  label="Address"
                  value={formData.address}
                  onChangeText={(value) =>
                    updateField('address', value)
                  }
                  placeholder="Enter branch address"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* Active */}
                <View style={styles.switchContainer}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchLabel}>
                      Active
                    </Text>

                    <Text
                      style={styles.switchDescription}
                    >
                      Allow this branch to operate
                    </Text>
                  </View>

                  <Switch
                    value={formData.is_active}
                    onValueChange={(value) =>
                      updateField(
                        'is_active',
                        value,
                      )
                    }
                    trackColor={{
                      false:
                        theme.colors.overlayMedium,
                      true:
                        theme.colors.primaryDark,
                    }}
                    thumbColor={
                      formData.is_active
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text
                    style={styles.cancelButtonText}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    saving && styles.disabledButton,
                    pressed && !saving && styles.pressed,
                  ]}
                  onPress={saveBranch}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.background}
                    />
                  ) : (
                    <>
                      <Text style={styles.saveIcon}>
                        ✓
                      </Text>

                      <Text
                        style={styles.saveButtonText}
                      >
                        Save
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

/**
 * Reusable form field
 */
const Field = ({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  textAlignVertical,
}) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}

        {required && (
          <Text style={styles.required}> *</Text>
        )}
      </Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.textarea,
          textAlignVertical && {
            textAlignVertical,
          },
        ]}
        value={String(value ?? '')}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          theme.colors.textSecondary
        }
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        selectionColor={theme.colors.primary}
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
    paddingHorizontal: theme.spacing.xl,
  },

  // -------------------------
  // Header
  // -------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },

  screenTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },

  screenSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  addButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },

  addButtonIcon: {
    color: theme.colors.background,
    fontSize: 22,
    fontWeight: '700',
    marginRight: 4,
    lineHeight: 22,
  },

  addButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },

  // -------------------------
  // Search
  // -------------------------

  searchContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  searchIcon: {
    color: theme.colors.primary,
    fontSize: 25,
    marginRight: theme.spacing.sm,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    color: theme.colors.text,
    fontSize: 21,
    lineHeight: 23,
  },

  // -------------------------
  // Error
  // -------------------------

  errorBanner: {
    backgroundColor: 'rgba(231,76,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.35)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  errorText: {
    color: theme.colors.danger,
    flex: 1,
    fontSize: 13,
  },

  retryText: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginLeft: theme.spacing.md,
  },

  // -------------------------
  // Count
  // -------------------------

  countRow: {
    paddingVertical: theme.spacing.sm,
  },

  countText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  // -------------------------
  // List
  // -------------------------

  listContent: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },

  emptyList: {
    flexGrow: 1,
  },

  branchCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },

  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  branchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },

  branchIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.10)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  branchIconText: {
    color: theme.colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },

  branchTitleContent: {
    flex: 1,
  },

  branchName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  branchCode: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  // -------------------------
  // Status
  // -------------------------

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.round,
  },

  activeBadge: {
    backgroundColor: 'rgba(22,163,74,0.13)',
  },

  inactiveBadge: {
    backgroundColor: 'rgba(231,76,60,0.13)',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.round,
    marginRight: 6,
  },

  activeDot: {
    backgroundColor: theme.colors.success,
  },

  inactiveDot: {
    backgroundColor: theme.colors.danger,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  activeText: {
    color: theme.colors.success,
  },

  inactiveText: {
    color: theme.colors.danger,
  },

  // -------------------------
  // Details
  // -------------------------

  detailsContainer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },

  detailLabel: {
    width: 75,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  detailValue: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    textAlign: 'right',
  },

  addressValue: {
    lineHeight: 19,
  },

  detailDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },

  // -------------------------
  // Actions
  // -------------------------

  actionContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },

  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  editButton: {
    backgroundColor: 'rgba(217,119,6,0.10)',
    borderColor: 'rgba(217,119,6,0.30)',
  },

  deleteButton: {
    backgroundColor: 'rgba(231,76,60,0.10)',
    borderColor: 'rgba(231,76,60,0.30)',
  },

  editButtonText: {
    color: theme.colors.warning,
    fontSize: 19,
    marginRight: 6,
  },

  editButtonLabel: {
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },

  deleteButtonText: {
    fontSize: 15,
    marginRight: 6,
  },

  deleteButtonLabel: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },

  // -------------------------
  // Loading
  // -------------------------

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: theme.spacing.md,
  },

  // -------------------------
  // Empty
  // -------------------------

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxxl,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },

  emptyIconText: {
    color: theme.colors.primary,
    fontSize: 32,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },

  emptyDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },

  emptyButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
  },

  emptyButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },

  // -------------------------
  // Modal
  // -------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    color: theme.colors.text,
    fontSize: 27,
    fontWeight: '300',
    lineHeight: 30,
  },

  modalContent: {
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
  },

  modalError: {
    backgroundColor: 'rgba(231,76,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.30)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },

  modalErrorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },

  // -------------------------
  // Form
  // -------------------------

  fieldContainer: {
    marginBottom: theme.spacing.xl,
  },

  fieldLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },

  required: {
    color: theme.colors.danger,
  },

  input: {
    minHeight: 48,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 14,
  },

  textarea: {
    minHeight: 100,
    paddingTop: theme.spacing.lg,
  },

  // -------------------------
  // Switch
  // -------------------------

  switchContainer: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  switchTextContainer: {
    flex: 1,
  },

  switchLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  switchDescription: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  // -------------------------
  // Modal Footer
  // -------------------------

  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },

  disabledButton: {
    opacity: 0.55,
  },

  saveIcon: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '900',
    marginRight: 6,
  },

  saveButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
})

export default BranchListScreen
