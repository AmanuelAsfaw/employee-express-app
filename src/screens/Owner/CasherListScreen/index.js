// src/screens/Owner/CasherListScreen/index.js
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
import { Ionicons } from '@expo/vector-icons'

import api from '../../../utils/axioServices'
import { END_POINT } from '../../../constants/urls'
import { theme } from '../../../theme/theme'

const emptyForm = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  job_title: '',
  branch: '',
  role: '',
  export_file_branches: [],
  is_active: true,
}

const CasherListScreen = ({ route, navigation }) => {
  const [branches, setBranches] = useState([])
  const [employees, setEmployees] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [formData, setFormData] = useState(emptyForm)

  const casherId = route?.params?.casherId

  const updateForm = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const loadBranches = useCallback(async () => {
    try {
      const res = await api.get(
        `${END_POINT}/usr-mngmnt/api/branches/`
      )

      setBranches(res.data.results || res.data || [])
    } catch (err) {
      console.error('Failed to load branches:', err)
      Alert.alert(
        'Error',
        'Unable to load branches.'
      )
    }
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true)

      const res = await api.get(
        `${END_POINT}/usr-mngmnt/api/company-employees/?search=${encodeURIComponent(
          search
        )}`
      )

      setEmployees(res.data.results || res.data || [])
    } catch (err) {
      console.error('Failed to load employees:', err)

      Alert.alert(
        'Error',
        'Unable to load employees.'
      )
    } finally {
      setLoading(false)
    }
  }, [search])

  const loadData = useCallback(async () => {
    await Promise.all([
      loadBranches(),
      loadEmployees(),
    ])
  }, [loadBranches, loadEmployees])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!casherId || employees.length === 0) {
      return
    }

    const employee = employees.find(
      (item) => String(item.id) === String(casherId)
    )

    if (employee) {
      openEdit(employee)
    }
  }, [casherId, employees])

  const onRefresh = async () => {
    setRefreshing(true)

    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const openCreate = () => {
    setEditing(false)
    setCurrentId(null)

    setFormData({
      ...emptyForm,
      export_file_branches: [],
    })

    setModalVisible(true)
  }

  const openEdit = (employee) => {
    setEditing(true)
    setCurrentId(employee.id)

    setFormData({
      username: employee.username || '',
      password: '',
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      job_title: employee.job_title || '',
      branch: employee.branch
        ? String(employee.branch)
        : '',
      role: employee.role
        ? String(employee.role)
        : '',
      export_file_branches:
        employee.export_file_branches?.map(String) || [],
      is_active: employee.is_active ?? true,
    })

    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    setModalVisible(false)
  }

  const saveEmployee = async () => {
    if (!formData.first_name.trim()) {
      Alert.alert(
        'Validation',
        'First name is required.'
      )
      return
    }

    if (!formData.last_name.trim()) {
      Alert.alert(
        'Validation',
        'Last name is required.'
      )
      return
    }

    if (!formData.username.trim()) {
      Alert.alert(
        'Validation',
        'Username is required.'
      )
      return
    }

    if (!editing && !formData.password) {
      Alert.alert(
        'Validation',
        'Password is required for a new employee.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        ...formData,
        branch: formData.branch
          ? Number(formData.branch)
          : null,
        role: formData.role
          ? Number(formData.role)
          : null,
        export_file_branches:
          formData.export_file_branches.map(Number),
      }

      if (editing) {
        await api.patch(
          `${END_POINT}/usr-mngmnt/api/company-employees/${currentId}/`,
          payload
        )
      } else {
        await api.post(
          `${END_POINT}/usr-mngmnt/api/company-employees/`,
          payload
        )
      }

      setModalVisible(false)

      await loadEmployees()

      Alert.alert(
        'Success',
        editing
          ? 'Employee updated successfully.'
          : 'Employee created successfully.'
      )
    } catch (err) {
      console.error(
        'Failed to save employee:',
        err
      )

      const message =
        err?.response?.data?.detail ||
        'Unable to save employee.'

      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  const deleteEmployee = (id) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
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
              await api.delete(
                `${END_POINT}/usr-mngmnt/api/company-employees/${id}/`
              )

              await loadEmployees()
            } catch (err) {
              console.error(
                'Failed to delete employee:',
                err
              )

              Alert.alert(
                'Error',
                'Unable to delete employee.'
              )
            }
          },
        },
      ]
    )
  }

  const toggleExportBranch = (branchId) => {
    const id = String(branchId)

    setFormData((prev) => {
      const exists =
        prev.export_file_branches.includes(id)

      return {
        ...prev,
        export_file_branches: exists
          ? prev.export_file_branches.filter(
              (item) => item !== id
            )
          : [...prev.export_file_branches, id],
      }
    })
  }

  const getBranchName = (branchId) => {
    const branch = branches.find(
      (item) =>
        String(item.id) === String(branchId)
    )

    return branch?.name || '-'
  }

  const renderEmployee = ({ item }) => {
    const fullName =
      `${item.first_name || ''} ${
        item.last_name || ''
      }`.trim()

    return (
      <View style={styles.employeeCard}>
        <View style={styles.employeeHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.first_name?.[0] || 'U').toUpperCase()}
            </Text>
          </View>

          <View style={styles.employeeTitleContainer}>
            <Text
              style={styles.employeeName}
              numberOfLines={1}
            >
              {fullName || item.username || '-'}
            </Text>

            <Text
              style={styles.username}
              numberOfLines={1}
            >
              @{item.username || '-'}
            </Text>
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
                {
                  backgroundColor: item.is_active
                    ? theme.colors.success
                    : theme.colors.danger,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: item.is_active
                    ? theme.colors.success
                    : theme.colors.danger,
                },
              ]}
            >
              {item.is_active
                ? 'Active'
                : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoItem
            icon="call-outline"
            label="Phone"
            value={item.phone || '-'}
          />

          <InfoItem
            icon="business-outline"
            label="Branch"
            value={
              item.branch_name ||
              getBranchName(item.branch)
            }
          />

          <InfoItem
            icon="shield-checkmark-outline"
            label="Role"
            value={item.role_name || '-'}
          />

          <InfoItem
            icon="briefcase-outline"
            label="Job Title"
            value={item.job_title || '-'}
          />
        </View>

        {item.email ? (
          <View style={styles.emailRow}>
            <Ionicons
              name="mail-outline"
              size={17}
              color={theme.colors.textSecondary}
            />

            <Text
              style={styles.emailText}
              numberOfLines={1}
            >
              {item.email}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.actionButton,
              styles.editButton,
            ]}
            onPress={() => openEdit(item)}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={theme.colors.primary}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.colors.primary,
                },
              ]}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              styles.deleteButton,
            ]}
            onPress={() =>
              deleteEmployee(item.id)
            }
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.danger}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.colors.danger,
                },
              ]}
            >
              Delete
            </Text>
          </Pressable>
        </View>
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
              Employees / Cashiers
            </Text>

            <Text style={styles.subtitle}>
              Manage your company employees
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={openCreate}
          >
            <Ionicons
              name="add"
              size={22}
              color={theme.colors.background}
            />

            <Text style={styles.addButtonText}>
              New Casher
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search casher..."
            placeholderTextColor={
              theme.colors.textMuted
            }
            style={styles.searchInput}
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {employees.length} employee
            {employees.length === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Employee list */}
        {loading && employees.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading employees...
            </Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) =>
              String(item.id)
            }
            renderItem={renderEmployee}
            contentContainerStyle={
              employees.length === 0
                ? styles.emptyList
                : styles.listContent
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={54}
                  color={theme.colors.textMuted}
                />

                <Text style={styles.emptyTitle}>
                  No employees found
                </Text>

                <Text style={styles.emptyText}>
                  Try another search or create a
                  new casher.
                </Text>
              </View>
            }
          />
        )}
      </View>

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
                    ? 'Edit Employee'
                    : 'New Employee'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {editing
                    ? 'Update employee information'
                    : 'Create a new employee account'}
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={
                styles.modalContent
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Personal Information */}
              <SectionTitle
                icon="person-outline"
                title="Personal Information"
              />

              <View style={styles.twoColumn}>
                <View style={styles.column}>
                  <InputField
                    label="First Name"
                    value={formData.first_name}
                    onChangeText={(value) =>
                      updateForm(
                        'first_name',
                        value
                      )
                    }
                    placeholder="First name"
                  />
                </View>

                <View style={styles.column}>
                  <InputField
                    label="Last Name"
                    value={formData.last_name}
                    onChangeText={(value) =>
                      updateForm(
                        'last_name',
                        value
                      )
                    }
                    placeholder="Last name"
                  />
                </View>
              </View>

              <InputField
                label="Email"
                value={formData.email}
                onChangeText={(value) =>
                  updateForm('email', value)
                }
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputField
                label="Phone"
                value={formData.phone}
                onChangeText={(value) =>
                  updateForm('phone', value)
                }
                placeholder="Phone number"
                keyboardType="phone-pad"
              />

              <InputField
                label="Job Title"
                value={formData.job_title}
                onChangeText={(value) =>
                  updateForm(
                    'job_title',
                    value
                  )
                }
                placeholder="Job title"
              />

              {/* Account */}
              <SectionTitle
                icon="lock-closed-outline"
                title="Account"
              />

              <InputField
                label="Username"
                value={formData.username}
                onChangeText={(value) =>
                  updateForm(
                    'username',
                    value
                  )
                }
                placeholder="Username"
                autoCapitalize="none"
              />

              <InputField
                label={
                  editing
                    ? 'Password (leave blank to keep current)'
                    : 'Password'
                }
                value={formData.password}
                onChangeText={(value) =>
                  updateForm(
                    'password',
                    value
                  )
                }
                placeholder={
                  editing
                    ? 'Leave blank to keep current'
                    : 'Password'
                }
                secureTextEntry
                autoCapitalize="none"
              />

              {/* Branch */}
              <SectionTitle
                icon="business-outline"
                title="Branch Access"
              />

              <FieldLabel>
                Primary Branch
              </FieldLabel>

              <View style={styles.selectContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                }
                  contentContainerStyle={
                    styles.horizontalOptions
                  }
                >
                  {branches.map((branch) => {
                    const selected =
                      String(
                        formData.branch
                      ) ===
                      String(branch.id)

                    return (
                      <Pressable
                        key={branch.id}
                        style={[
                          styles.selectOption,
                          selected &&
                            styles.selectOptionSelected,
                        ]}
                        onPress={() =>
                          updateForm(
                            'branch',
                            String(
                              branch.id
                            )
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            selected &&
                              styles.selectOptionTextSelected,
                          ]}
                        >
                          {branch.name}
                        </Text>

                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={
                              theme.colors.primary
                            }
                          />
                        )}
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>

              {/* Export branches */}
              <FieldLabel>
                Export File Branches
              </FieldLabel>

              <Text style={styles.helperText}>
                Select all branches this employee
                can use for export files.
              </Text>

              <View style={styles.branchList}>
                {branches.map((branch) => {
                  const selected =
                    formData.export_file_branches.includes(
                      String(branch.id)
                    )

                  return (
                    <Pressable
                      key={branch.id}
                      style={[
                        styles.branchOption,
                        selected &&
                          styles.branchOptionSelected,
                      ]}
                      onPress={() =>
                        toggleExportBranch(
                          branch.id
                        )
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selected &&
                            styles.checkboxSelected,
                        ]}
                      >
                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={15}
                            color={
                              theme.colors.background
                            }
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.branchOptionText,
                          selected &&
                            styles.branchOptionTextSelected,
                        ]}
                      >
                        {branch.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Active */}
              <View style={styles.activeRow}>
                <View style={styles.activeInfo}>
                  <Text style={styles.activeTitle}>
                    Active Employee
                  </Text>

                  <Text
                    style={styles.activeDescription}
                  >
                    Allow this employee to access
                    the system.
                  </Text>
                </View>

                <Switch
                  value={formData.is_active}
                  onValueChange={(value) =>
                    updateForm(
                      'is_active',
                      value
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
                      : theme.colors.textMuted
                  }
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={[
                  styles.footerButton,
                  styles.cancelButton,
                ]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.footerButton,
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                ]}
                onPress={saveEmployee}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      theme.colors.background
                    }
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={19}
                      color={
                        theme.colors.background
                      }
                    />

                    <Text
                      style={styles.saveText}
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
    </SafeAreaView>
  )
}

/* =====================================================
   Reusable Components
===================================================== */

const SectionTitle = ({ icon, title }) => (
  <View style={styles.sectionTitle}>
    <View style={styles.sectionIcon}>
      <Ionicons
        name={icon}
        size={18}
        color={theme.colors.primary}
      />
    </View>

    <Text style={styles.sectionTitleText}>
      {title}
    </Text>
  </View>
)

const FieldLabel = ({ children }) => (
  <Text style={styles.fieldLabel}>
    {children}
  </Text>
)

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}) => (
  <View style={styles.inputGroup}>
    <FieldLabel>{label}</FieldLabel>

    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={
        theme.colors.textMuted
      }
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={
        autoCapitalize || 'sentences'
      }
      style={styles.input}
    />
  </View>
)

const InfoItem = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoItem}>
    <Ionicons
      name={icon}
      size={16}
      color={theme.colors.primary}
    />

    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  </View>
)

/* =====================================================
   Styles
===================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  title: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    gap: 5,
    ...theme.shadows.button,
  },

  addButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '800',
  },

  /* Search */

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginHorizontal: theme.spacing.md,
    paddingVertical: 0,
  },

  countRow: {
    paddingVertical: theme.spacing.lg,
  },

  countText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  /* List */

  listContent: {
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  employeeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },

  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: theme.radius.round,
    backgroundColor:
      'rgba(0,216,255,0.12)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },

  employeeTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },

  employeeName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  username: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.radius.round,
    gap: 5,
  },

  activeBadge: {
    backgroundColor:
      'rgba(22,163,74,0.12)',
  },

  inactiveBadge: {
    backgroundColor:
      'rgba(231,76,60,0.12)',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.lg,
  },

  infoItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
  },

  infoTextContainer: {
    flex: 1,
    marginLeft: 8,
  },

  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },

  infoValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },

  emailText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },

  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },

  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
  },

  editButton: {
    backgroundColor:
      'rgba(0,216,255,0.08)',
    borderColor:
      'rgba(0,216,255,0.20)',
  },

  deleteButton: {
    backgroundColor:
      'rgba(231,76,60,0.08)',
    borderColor:
      'rgba(231,76,60,0.20)',
  },

  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Loading */

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    fontSize: 13,
  },

  /* Empty */

  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.huge,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: theme.spacing.lg,
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '94%',
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
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

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.round,
    backgroundColor:
      theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalContent: {
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
  },

  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    backgroundColor:
      theme.colors.surfaceSecondary,
  },

  footerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  cancelButton: {
    backgroundColor:
      theme.colors.overlayLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },

  saveButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },

  /* Sections */

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    backgroundColor:
      'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  sectionTitleText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  /* Inputs */

  inputGroup: {
    marginBottom: theme.spacing.lg,
  },

  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },

  input: {
    minHeight: 46,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text,
    fontSize: 14,
  },

  /* Two column */

  twoColumn: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },

  column: {
    flex: 1,
  },

  /* Branch selector */

  selectContainer: {
    marginBottom: theme.spacing.lg,
  },

  horizontalOptions: {
    gap: theme.spacing.sm,
    paddingBottom: 3,
  },

  selectOption: {
    minHeight: 42,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor:
      theme.colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  selectOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor:
      'rgba(0,216,255,0.10)',
  },

  selectOptionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  selectOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },

  helperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: theme.spacing.md,
  },

  branchList: {
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },

  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  branchOptionSelected: {
    backgroundColor:
      'rgba(0,216,255,0.08)',
    borderColor:
      'rgba(0,216,255,0.25)',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor:
      theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  branchOptionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },

  branchOptionTextSelected: {
    color: theme.colors.text,
    fontWeight: '600',
  },

  /* Active */

  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  activeInfo: {
    flex: 1,
    paddingRight: theme.spacing.lg,
  },

  activeTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  activeDescription: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
})

export default CasherListScreen
