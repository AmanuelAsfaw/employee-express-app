// src/screens/Owner/SpecialSMSScreen/index.js

import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

const SpecialSMSScreen = () => {
  const [senders, setSenders] = useState([])
  const [consignees, setConsignees] = useState([])

  const [selected, setSelected] = useState([])
  const [message, setMessage] = useState('')

  const [senderSearch, setSenderSearch] = useState('')
  const [consigneeSearch, setConsigneeSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [result, setResult] = useState(null)

  const [previousMessages, setPreviousMessages] = useState([])
  const [messageModal, setMessageModal] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [groupModal, setGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [savingGroup, setSavingGroup] = useState(false)

  useEffect(() => {
    loadGroups()
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)

      const res = await api.get(
        `${END_POINT}/usr-mngmnt/api/special-sms/contacts/`
      )

      setSenders(res.data.senders || [])
      setConsignees(res.data.consignees || [])
    } catch (err) {
      console.error(err)

      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to load contacts.'
      )
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      setLoadingMessages(true)

      const res = await api.get(
        `${END_POINT}/usr-mngmnt/api/special-sms/previous_messages/`
      )

      setPreviousMessages(res.data.results || [])
    } catch (err) {
      console.error(err)

      Alert.alert(
        'Error',
        err.response?.data?.message ||
          'Failed to load previous messages.'
      )
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadGroups = async () => {
    try {
      const res = await api.get(
        `${END_POINT}/express-api/api/special-sms/groups/`
      )

      setGroups(res.data.results || res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const isSelected = (phone) => {
    return selected.some((item) => item.phone === phone)
  }

  const toggleSelect = (contact) => {
    if (isSelected(contact.phone)) {
      setSelected((prev) =>
        prev.filter((item) => item.phone !== contact.phone)
      )
    } else {
      setSelected((prev) => [...prev, contact])
    }

    setResult(null)
  }

  const selectAll = (items) => {
    setSelected((prev) => {
      const unique = {}

      ;[...prev, ...items].forEach((item) => {
        unique[item.phone] = item
      })

      return Object.values(unique)
    })
  }

  const clearSelection = () => {
    setSelected([])
    setSelectedGroup('')
  }

  const sendSMS = async () => {
    if (!message.trim()) {
      Alert.alert('Validation', 'Please enter SMS message.')
      return
    }

    if (selected.length === 0) {
      Alert.alert('Validation', 'Please select contacts.')
      return
    }

    try {
      setSending(true)
      setResult(null)

      const res = await api.post(
        `${END_POINT}/usr-mngmnt/api/special-sms/send/`,
        {
          message,
          recipients: selected,
        }
      )

      setResult(res.data)
      setMessage('')
      setSelected([])
      setSelectedGroup('')
    } catch (err) {
      console.error(err)

      setResult({
        success: false,
        message:
          err.response?.data?.message ||
          'SMS sending failed.',
      })
    } finally {
      setSending(false)
    }
  }

  const filteredSenders = useMemo(() => {
    const search = senderSearch.toLowerCase().trim()

    if (!search) return senders

    return senders.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(search) ||
        (item.phone || '').includes(search)
    )
  }, [senders, senderSearch])

  const filteredConsignees = useMemo(() => {
    const search = consigneeSearch.toLowerCase().trim()

    if (!search) return consignees

    return consignees.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(search) ||
        (item.phone || '').includes(search)
    )
  }, [consignees, consigneeSearch])

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId)

    if (!groupId) {
      setSelected([])
      return
    }

    try {
      const res = await api.get(
        `${END_POINT}/express-api/api/special-sms/groups/${groupId}/contacts/`
      )

      if (res.data.success) {
        setSelected(res.data.contacts || [])
      }
    } catch (err) {
      console.error(err)

      setSelected([])

      Alert.alert(
        'Error',
        err.response?.data?.message ||
          'Failed to load group contacts.'
      )
    }
  }

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Validation', 'Please enter group name.')
      return
    }

    if (selected.length === 0) {
      Alert.alert('Validation', 'Please select contacts.')
      return
    }

    try {
      setSavingGroup(true)

      const res = await api.post(
        `${END_POINT}/express-api/api/special-sms/groups/`,
        {
          name: groupName.trim(),
          contacts: selected,
        }
      )

      const newGroup = res.data

      setGroups((prev) => [...prev, newGroup])
      setSelectedGroup(String(newGroup.id))
      setGroupName('')
      setGroupModal(false)
    } catch (err) {
      console.error(err)

      Alert.alert(
        'Error',
        err.response?.data?.message ||
          'Failed to create contact group.'
      )
    } finally {
      setSavingGroup(false)
    }
  }

  const openPreviousMessages = () => {
    loadMessages()
    setMessageModal(true)
  }

  const usePreviousMessage = (item) => {
    setMessage(item.message || '')
    setMessageModal(false)
  }

  const renderContact = ({ item }) => {
    const selectedContact = isSelected(item.phone)

    return (
      <Pressable
        onPress={() => toggleSelect(item)}
        style={[
          styles.contactRow,
          selectedContact && styles.contactRowSelected,
        ]}
      >
        <View
          style={[
            styles.checkbox,
            selectedContact && styles.checkboxSelected,
          ]}
        >
          {selectedContact && (
            <Ionicons
              name="checkmark"
              size={15}
              color={theme.colors.background}
            />
          )}
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.name || '-'}
          </Text>

          <Text style={styles.contactPhone}>
            {item.phone || '-'}
          </Text>
        </View>
      </Pressable>
    )
  }

  const renderGroupOption = (group) => {
    const active = String(selectedGroup) === String(group.id)

    return (
      <Pressable
        key={group.id}
        onPress={() => handleGroupChange(String(group.id))}
        style={[
          styles.groupOption,
          active && styles.groupOptionSelected,
        ]}
      >
        <View style={styles.groupIcon}>
          <Ionicons
            name="people-outline"
            size={18}
            color={
              active
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
        </View>

        <View style={styles.groupOptionText}>
          <Text style={styles.groupName}>
            {group.name}
          </Text>

          {group.constacts_count != null && (
            <Text style={styles.groupCount}>
              {group.constacts_count} contacts
            </Text>
          )}
        </View>

        {active && (
          <Ionicons
            name="checkmark-circle"
            size={21}
            color={theme.colors.primary}
          />
        )}
      </Pressable>
    )
  }

  const renderPreviousMessage = ({ item }) => {
    return (
      <View style={styles.messageHistoryCard}>
        <Text style={styles.historyMessage}>
          {item.message || '-'}
        </Text>

        <View style={styles.historyMeta}>
          <View style={styles.historyMetaItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={theme.colors.textSecondary}
            />

            <Text style={styles.historyMetaText}>
              {item.created_at
                ? new Date(item.created_at).toLocaleString()
                : '-'}
            </Text>
          </View>

          <View style={styles.historyMetaItem}>
            <Ionicons
              name="people-outline"
              size={14}
              color={theme.colors.textSecondary}
            />

            <Text style={styles.historyMetaText}>
              {item.total || 0} contacts
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => usePreviousMessage(item)}
          style={styles.useMessageButton}
        >
          <Ionicons
            name="return-down-forward-outline"
            size={17}
            color={theme.colors.primary}
          />

          <Text style={styles.useMessageText}>Use Message</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.headerCard}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View>
                <Text style={styles.title}>Special SMS</Text>
                <Text style={styles.subtitle}>
                  Send messages to selected contacts
                </Text>
              </View>
            </View>

            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeLabel}>
                Selected
              </Text>
              <Text style={styles.selectedBadgeValue}>
                {selected.length}
              </Text>
            </View>
          </View>

          {/* RESULT */}
          {result && (
            <View
              style={[
                styles.resultCard,
                result.success
                  ? styles.resultSuccess
                  : styles.resultDanger,
              ]}
            >
              <Ionicons
                name={
                  result.success
                    ? 'checkmark-circle'
                    : 'close-circle'
                }
                size={22}
                color={
                  result.success
                    ? theme.colors.success
                    : theme.colors.danger
                }
              />

              <View style={styles.resultContent}>
                <Text
                  style={[
                    styles.resultMessage,
                    {
                      color: result.success
                        ? theme.colors.success
                        : theme.colors.danger,
                    },
                  ]}
                >
                  {result.message}
                </Text>

                {result.summary && (
                  <Text style={styles.resultSummary}>
                    Total: {result.summary.total}  •  Success:{' '}
                    {result.summary.success}  •  Failed:{' '}
                    {result.summary.failed}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* MESSAGE COMPOSER */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Compose Message
                </Text>

                <Text style={styles.sectionDescription}>
                  Select recipients and write your SMS
                </Text>
              </View>

              <Pressable
                onPress={openPreviousMessages}
                style={styles.historyButton}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.colors.primary}
                />

                <Text style={styles.historyButtonText}>
                  History
                </Text>
              </Pressable>
            </View>

            {/* GROUP */}
            <Text style={styles.inputLabel}>
              Contact Group
            </Text>

            <Pressable
              onPress={() => setGroupModal(true)}
              style={styles.selectInput}
            >
              <View style={styles.selectLeft}>
                <Ionicons
                  name="people-outline"
                  size={19}
                  color={theme.colors.primary}
                />

                <Text
                  style={[
                    styles.selectText,
                    !selectedGroup &&
                      styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedGroup
                    ? groups.find(
                        (group) =>
                          String(group.id) ===
                          String(selectedGroup)
                      )?.name || 'Selected group'
                    : 'Select a contact group'}
                </Text>
              </View>

              <Ionicons
                name="chevron-down"
                size={19}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            <Pressable
              disabled={selected.length === 0}
              onPress={() => setGroupModal(true)}
              style={[
                styles.createGroupButton,
                selected.length === 0 &&
                  styles.disabledButton,
              ]}
            >
              <Ionicons
                name="add"
                size={19}
                color={
                  selected.length === 0
                    ? theme.colors.textDisabled
                    : theme.colors.primary
                }
              />

              <Text
                style={[
                  styles.createGroupText,
                  selected.length === 0 &&
                    styles.disabledText,
                ]}
              >
                Create Group from Selection
              </Text>
            </Pressable>

            <View style={styles.selectionInfo}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.selectionInfoText}>
                {selected.length} contacts selected
              </Text>
            </View>

            {/* MESSAGE */}
            <Text style={styles.inputLabel}>
              SMS Message
            </Text>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write SMS message..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlignVertical="top"
              style={styles.messageInput}
              maxLength={1000}
            />

            <View style={styles.messageFooter}>
              <Text style={styles.characterCount}>
                {message.length}/1000
              </Text>

              <Pressable
                onPress={sendSMS}
                disabled={sending}
                style={[
                  styles.sendButton,
                  sending && styles.disabledSendButton,
                ]}
              >
                {sending ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.background}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="send"
                      size={18}
                      color={theme.colors.background}
                    />

                    <Text style={styles.sendButtonText}>
                      Send SMS
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* CONTACTS */}
          <ContactSection
            title="Senders"
            count={senders.length}
            search={senderSearch}
            setSearch={setSenderSearch}
            data={filteredSenders}
            loading={loading}
            onSelectAll={() =>
              selectAll(filteredSenders)
            }
            renderItem={renderContact}
          />

          <ContactSection
            title="Consignees"
            count={consignees.length}
            search={consigneeSearch}
            setSearch={setConsigneeSearch}
            data={filteredConsignees}
            loading={loading}
            onSelectAll={() =>
              selectAll(filteredConsignees)
            }
            renderItem={renderContact}
          />

          {/* CLEAR */}
          {selected.length > 0 && (
            <Pressable
              onPress={clearSelection}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle-outline"
                size={19}
                color={theme.colors.danger}
              />

              <Text style={styles.clearButtonText}>
                Clear Selection
              </Text>
            </Pressable>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PREVIOUS MESSAGES MODAL */}
      <Modal
        visible={messageModal}
        animationType="slide"
        transparent
        onRequestClose={() => setMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Previous SMS Messages
                </Text>

                <Text style={styles.modalSubtitle}>
                  Reuse a previous message
                </Text>
              </View>

              <Pressable
                onPress={() => setMessageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={theme.colors.text}
                />
              </Pressable>
            </View>

            {loadingMessages ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator
                  size="large"
                  color={theme.colors.primary}
                />

                <Text style={styles.loadingText}>
                  Loading messages...
                </Text>
              </View>
            ) : previousMessages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="chatbubble-outline"
                  size={42}
                  color={theme.colors.textMuted}
                />

                <Text style={styles.emptyTitle}>
                  No previous messages
                </Text>

                <Text style={styles.emptyText}>
                  Your previous SMS messages will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={previousMessages}
                keyExtractor={(item) =>
                  String(item.id)
                }
                renderItem={renderPreviousMessage}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.modalListContent
                }
              />
            )}

            <Pressable
              onPress={() => setMessageModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* GROUP MODAL */}
      <Modal
        visible={groupModal}
        animationType="slide"
        transparent
        onRequestClose={() => setGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Contact Groups
                </Text>

                <Text style={styles.modalSubtitle}>
                  Select or create a contact group
                </Text>
              </View>

              <Pressable
                onPress={() => setGroupModal(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={theme.colors.text}
                />
              </Pressable>
            </View>

            {/* EXISTING GROUPS */}
            {groups.length > 0 && (
              <>
                <Text style={styles.modalSectionTitle}>
                  Existing Groups
                </Text>

                <ScrollView
                  style={styles.groupsList}
                  showsVerticalScrollIndicator={false}
                >
                  {groups.map(renderGroupOption)}
                </ScrollView>
              </>
            )}

            <View style={styles.divider} />

            {/* CREATE GROUP */}
            <Text style={styles.modalSectionTitle}>
              Create New Group
            </Text>

            <Text style={styles.inputLabel}>
              Group Name
            </Text>

            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g. VIP Customers"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.textInput}
            />

            <View style={styles.groupSummary}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={theme.colors.info}
              />

              <Text style={styles.groupSummaryText}>
                <Text style={styles.groupSummaryStrong}>
                  {selected.length}
                </Text>{' '}
                contacts will be saved to this group.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setGroupModal(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={
                  savingGroup ||
                  !groupName.trim() ||
                  selected.length === 0
                }
                onPress={createGroup}
                style={[
                  styles.saveButton,
                  (savingGroup ||
                    !groupName.trim() ||
                    selected.length === 0) &&
                    styles.disabledButton,
                ]}
              >
                {savingGroup ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.background}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color={
                        !groupName.trim() ||
                        selected.length === 0
                          ? theme.colors.textDisabled
                          : theme.colors.background
                      }
                    />

                    <Text
                      style={[
                        styles.saveButtonText,
                        (!groupName.trim() ||
                          selected.length === 0) &&
                          styles.disabledText,
                      ]}
                    >
                      Save Group
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

/* -------------------------------------------------------------------------- */
/* CONTACT SECTION                                                            */
/* -------------------------------------------------------------------------- */

const ContactSection = ({
  title,
  count,
  search,
  setSearch,
  data,
  loading,
  onSelectAll,
  renderItem,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.contactHeader}>
        <View style={styles.contactTitleContainer}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {count}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onSelectAll}
          disabled={data.length === 0}
          style={[
            styles.selectAllButton,
            data.length === 0 &&
              styles.disabledButton,
          ]}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={17}
            color={
              data.length === 0
                ? theme.colors.textDisabled
                : theme.colors.primary
            }
          />

          <Text
            style={[
              styles.selectAllText,
              data.length === 0 &&
                styles.disabledText,
            ]}
          >
            Select All
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={19}
          color={theme.colors.textSecondary}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${title.toLowerCase()}...`}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
        />

        {!!search && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.listLoading}>
            <ActivityIndicator
              color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading contacts...
            </Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.listEmpty}>
            <Ionicons
              name="people-outline"
              size={34}
              color={theme.colors.textMuted}
            />

            <Text style={styles.emptyListText}>
              No {title.toLowerCase()} found
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.phone)}
            renderItem={renderItem}
            scrollEnabled
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={styles.contactList}
            contentContainerStyle={styles.contactListContent}
            />

        )}
      </View>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    padding: theme.spacing.xl,
  },

  /* HEADER */

  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
  },

  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },

  title: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '700',
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  selectedBadge: {
    minWidth: 70,
    backgroundColor: 'rgba(0,216,255,0.10)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },

  selectedBadgeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },

  selectedBadgeValue: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 1,
  },

  /* RESULT */

  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
  },

  resultSuccess: {
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderColor: 'rgba(22,163,74,0.30)',
  },

  resultDanger: {
    backgroundColor: 'rgba(231,76,60,0.10)',
    borderColor: 'rgba(231,76,60,0.30)',
  },

  resultContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },

  resultMessage: {
    fontSize: 14,
    fontWeight: '600',
  },

  resultSummary: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  /* CARD */

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  sectionDescription: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.overlayLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  historyButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },

  /* INPUTS */

  inputLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },

  textInput: {
    height: 48,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 14,
  },

  selectInput: {
    minHeight: 48,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  selectText: {
    color: theme.colors.text,
    fontSize: 13,
    marginLeft: theme.spacing.md,
    flex: 1,
  },

  placeholderText: {
    color: theme.colors.textMuted,
  },

  createGroupButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  createGroupText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },

  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },

  selectionInfoText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  messageInput: {
    minHeight: 120,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    fontSize: 14,
    lineHeight: 20,
  },

  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },

  characterCount: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  sendButton: {
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },

  sendButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  disabledSendButton: {
    opacity: 0.6,
  },

  /* CONTACTS */

  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },

  contactTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countBadge: {
    minWidth: 27,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: theme.radius.round,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },

  countBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  selectAllText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },

  searchContainer: {
    height: 45,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    marginLeft: theme.spacing.md,
    paddingVertical: 0,
  },

  listContainer: {
    maxHeight: 420,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },

  contactRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  contactRowSelected: {
    backgroundColor: 'rgba(0,216,255,0.06)',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  contactInfo: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },

  contactName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  contactPhone: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  listLoading: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing.md,
  },

  listEmpty: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyListText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: theme.spacing.sm,
  },

  /* CLEAR */

  clearButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.30)',
    backgroundColor: 'rgba(231,76,60,0.08)',
  },

  clearButtonText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 7,
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing.lg,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '700',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalLoading: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    paddingVertical: theme.spacing.huge,
    alignItems: 'center',
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: theme.spacing.lg,
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },

  modalListContent: {
    paddingBottom: theme.spacing.md,
  },

  messageHistoryCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  historyMessage: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 19,
  },

  historyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  historyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  historyMetaText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginLeft: 5,
  },

  useMessageButton: {
    marginTop: theme.spacing.lg,
    minHeight: 38,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(0,216,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  useMessageText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  modalCloseButton: {
    height: 45,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.overlayLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },

  modalCloseText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  /* GROUP MODAL */

  modalSectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },

  groupsList: {
    maxHeight: 190,
  },

  groupOption: {
    minHeight: 57,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  groupOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0,216,255,0.08)',
  },

  groupIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupOptionText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },

  groupName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  groupCount: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.xl,
  },

  groupSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,145,178,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(8,145,178,0.25)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },

  groupSummaryText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: theme.spacing.md,
  },

  groupSummaryStrong: {
    color: theme.colors.info,
    fontWeight: '800',
  },

  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.overlayLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },

  disabledButton: {
    opacity: 0.45,
  },

  disabledText: {
    color: theme.colors.textDisabled,
  },

  bottomSpace: {
    height: 40,
  },
})

export default SpecialSMSScreen
