// src/screens/Employee/SendersListScreen.js

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import api from '../../utils/axioServices'
import { END_POINT } from '../../constants/urls'
import { theme } from '../../theme/theme'

const emptyForm = {
  name: '',
  phone: '',
  company_name_address: '',
  tin_number: '',
  country: '',
}

const SendersListScreen = () => {
  const route = useRoute()

  const sender_id = route.params?.senderId

  const [senders, setSenders] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)

  const [currentId, setCurrentId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const loadSenders = async () => {
    try {
      setLoading(true)

      const res = await api.get(
        `${END_POINT}/express-api/api/senders/?search=${encodeURIComponent(search)}`
      )

      setSenders(res.data.results || res.data || [])
    } catch (err) {
      console.error('Error loading senders:', err)

      Alert.alert(
        'Error',
        'Unable to load senders.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSenders()
  }, [search])

  // Open sender automatically when senderId is passed
  useEffect(() => {
    if (sender_id && senders.length > 0) {
      const sender = senders.find(
        (s) => String(s.id) === String(sender_id)
      )

      if (sender) {
        openEdit(sender)
      }
    }
  }, [sender_id, senders])

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
      company_name_address: sender.company_name_address || '',
      tin_number: sender.tin_number || '',
      country: sender.country || '',
    })

    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditing(false)
    setCurrentId(null)
    setFormData({ ...emptyForm })
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveSender = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation', 'Sender name is required.')
      return
    }

    try {
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
      loadSenders()
    } catch (err) {
      console.error('Error saving sender:', err)

      Alert.alert(
        'Error',
        'Unable to save sender.'
      )
    }
  }

  const deleteSender = (id) => {
    Alert.alert(
      'Delete Sender',
      'Are you sure you want to delete this sender?',
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
                `${END_POINT}/express-api/api/senders/${id}/`
              )

              loadSenders()
            } catch (err) {
              console.error('Error deleting sender:', err)

              Alert.alert(
                'Error',
                'Unable to delete sender.'
              )
            }
          },
        },
      ]
    )
  }

  const renderSender = ({ item }) => {
    return (
      <View style={styles.senderCard}>
        <View style={styles.senderHeader}>
          <View style={styles.senderTitleContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>

            <View style={styles.senderTitle}>
              <Text style={styles.senderName}>
                {item.name || '-'}
              </Text>

              <Text style={styles.senderPhone}>
                {item.phone || '-'}
              </Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEdit(item)}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color="#f9a825"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteSender(item.id)}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color="#dc3545"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Company / Address
          </Text>

          <Text style={styles.infoValue}>
            {item.company_name_address || '-'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            TIN
          </Text>

          <Text style={styles.infoValue}>
            {item.tin_number || '-'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Country
          </Text>

          <Text style={styles.infoValue}>
            {item.country || '-'}
          </Text>
        </View>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) {
      return null
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="people-outline"
          size={50}
          color="#adb5bd"
        />

        <Text style={styles.emptyTitle}>
          No Senders found
        </Text>

        <Text style={styles.emptyText}>
          Try changing your search or add a new sender.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Senders
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreate}
        >
          <Ionicons
            name="add"
            size={21}
            color="#fff"
          />

          <Text style={styles.addButtonText}>
            New Sender
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#6c757d"
          style={styles.searchIcon}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search sender..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            style={styles.clearSearch}
          >
            <Ionicons
              name="close-circle"
              size={19}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && senders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#321fdb"
          />

          <Text style={styles.loadingText}>
            Loading senders...
          </Text>
        </View>
      ) : (
        <FlatList
          data={senders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSender}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            senders.length === 0
              ? styles.emptyList
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadSenders}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing
                  ? 'Edit Sender'
                  : 'New Sender'}
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={25}
                  color="#495057"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* Sender Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Sender Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) =>
                    updateField('name', value)
                  }
                  placeholder="Enter sender name"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Phone
                </Text>

                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(value) =>
                    updateField('phone', value)
                  }
                  placeholder="Enter phone number"
                  placeholderTextColor="#adb5bd"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Company / Address */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Company / Address
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.textarea,
                  ]}
                  value={formData.company_name_address}
                  onChangeText={(value) =>
                    updateField(
                      'company_name_address',
                      value
                    )
                  }
                  placeholder="Enter company or address"
                  placeholderTextColor="#adb5bd"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* TIN */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  TIN Number
                </Text>

                <TextInput
                  style={styles.input}
                  value={formData.tin_number}
                  onChangeText={(value) =>
                    updateField('tin_number', value)
                  }
                  placeholder="Enter TIN number"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              {/* Country */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Country
                </Text>

                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(value) =>
                    updateField('country', value)
                  }
                  placeholder="Enter country"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <View style={styles.bottomSpace} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveSender}
              >
                <Ionicons
                  name="save-outline"
                  size={19}
                  color="#fff"
                />

                <Text style={styles.saveButtonText}>
                  Save
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    ...theme.shadows.button,
  },

  addButtonText: {
    color: theme.colors.background, // High-contrast text on bright primary
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 46,
  },

  searchIcon: {
    marginLeft: 13,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    color: theme.colors.text,
    fontSize: 15,
  },

  clearSearch: {
    paddingHorizontal: 12,
  },

  listContent: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
  },

  senderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },

  senderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  senderTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: theme.colors.cyan,
    fontSize: 18,
    fontWeight: '700',
  },

  senderTitle: {
    marginLeft: 11,
    flex: 1,
  },

  senderName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },

  senderPhone: {
    marginTop: 3,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 13,
  },

  infoRow: {
    marginBottom: 9,
  },

  infoLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '92%',
    minHeight: '55%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text,
  },

  closeButton: {
    padding: 2,
  },

  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 7,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },

  textarea: {
    height: 95,
    paddingTop: 11,
  },

  bottomSpace: {
    height: 20,
  },

  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.textDisabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...theme.shadows.button,
  },

  saveButtonText: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 7,
  },
});

export default SendersListScreen
