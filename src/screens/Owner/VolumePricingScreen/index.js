// src/screens/Owner/VolumePricingScreen/index.js
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

const EMPTY_FORM = {
  min_volume: '',
  max_volume: '',
  price: '',
  is_per_volume: false,
}

const VolumePricingScreen = () => {
  const [volumePricings, setVolumePricings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [error, setError] = useState('')

  const loadVolumePricings = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true)
        }

        setError('')

        const res = await api.get(
          `${END_POINT}/usr-mngmnt/api/company-volume-pricing/?search=${encodeURIComponent(
            search
          )}`
        )

        setVolumePricings(res.data.results || res.data || [])
      } catch (err) {
        console.error('Failed to load volume pricings:', err)

        setError('Failed to load volume pricing.')

        if (!showLoader) {
          Alert.alert(
            'Error',
            'Unable to refresh volume pricing.'
          )
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [search]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVolumePricings()
    }, 350)

    return () => clearTimeout(timer)
  }, [loadVolumePricings])

  const onRefresh = () => {
    setRefreshing(true)
    loadVolumePricings(false)
  }

  const openCreate = () => {
    setEditing(false)
    setCurrentId(null)
    setFormData({ ...EMPTY_FORM })
    setError('')
    setModalVisible(true)
  }

  const openEdit = (pricing) => {
    setEditing(true)
    setCurrentId(pricing.id)

    setFormData({
      min_volume:
        pricing.min_volume !== null &&
        pricing.min_volume !== undefined
          ? String(pricing.min_volume)
          : '',
      max_volume:
        pricing.max_volume !== null &&
        pricing.max_volume !== undefined
          ? String(pricing.max_volume)
          : '',
      price:
        pricing.price !== null &&
        pricing.price !== undefined
          ? String(pricing.price)
          : '',
      is_per_volume: Boolean(pricing.is_per_volume),
    })

    setError('')
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalVisible(false)
    setCurrentId(null)
    setEditing(false)
    setFormData({ ...EMPTY_FORM })
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = () => {
    if (
      formData.min_volume === '' ||
      formData.max_volume === '' ||
      formData.price === ''
    ) {
      Alert.alert(
        'Missing information',
        'Please enter minimum volume, maximum volume, and price.'
      )
      return false
    }

    const min = Number(formData.min_volume)
    const max = Number(formData.max_volume)
    const price = Number(formData.price)

    if (
      Number.isNaN(min) ||
      Number.isNaN(max) ||
      Number.isNaN(price)
    ) {
      Alert.alert(
        'Invalid values',
        'Please enter valid numeric values.'
      )
      return false
    }

    if (min < 0 || max < 0 || price < 0) {
      Alert.alert(
        'Invalid values',
        'Values cannot be negative.'
      )
      return false
    }

    if (max < min) {
      Alert.alert(
        'Invalid range',
        'Maximum volume cannot be less than minimum volume.'
      )
      return false
    }

    return true
  }

  const saveVolumePricing = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)

      const payload = {
        min_volume: Number(formData.min_volume),
        max_volume: Number(formData.max_volume),
        price: Number(formData.price),
        is_per_volume: formData.is_per_volume,
      }

      if (editing) {
        await api.put(
          `${END_POINT}/usr-mngmnt/api/company-volume-pricing/${currentId}/`,
          payload
        )
      } else {
        await api.post(
          `${END_POINT}/usr-mngmnt/api/company-volume-pricing/`,
          payload
        )
      }

      closeModal()
      await loadVolumePricings()
    } catch (err) {
      console.error('Failed to save volume pricing:', err)

      const message =
        err?.response?.data?.detail ||
        'Unable to save volume pricing.'

      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  const deleteVolumePricing = (id) => {
    Alert.alert(
      'Delete pricing',
      'Are you sure you want to delete this volume pricing?',
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
              setDeletingId(id)

              await api.delete(
                `${END_POINT}/usr-mngmnt/api/company-volume-pricing/${id}/`
              )

              await loadVolumePricings()
            } catch (err) {
              console.error(
                'Failed to delete volume pricing:',
                err
              )

              Alert.alert(
                'Error',
                'Unable to delete volume pricing.'
              )
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  const renderPricing = ({ item, index }) => {
    const isDeleting = deletingId === item.id

    return (
      <View style={styles.pricingCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>
              {index + 1}
            </Text>
          </View>

          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>
              Volume Range
            </Text>

            <Text style={styles.rangeText}>
              {item.min_volume} - {item.max_volume}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.is_per_volume
                ? styles.statusActive
                : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.is_per_volume
                  ? styles.statusActiveText
                  : styles.statusInactiveText,
              ]}
            >
              {item.is_per_volume ? 'Per Unit' : 'Fixed'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.priceLabel}>
              Price
            </Text>

            <Text style={styles.priceText}>
              ETB {Number(item.price || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.editButton,
                pressed && styles.pressed,
              ]}
              onPress={() => openEdit(item)}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.warning}
              />

              <Text
                style={[
                  styles.actionText,
                  { color: theme.warning },
                ]}
              >
                Edit
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                deleteVolumePricing(item.id)
              }
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator
                  size="small"
                  color={theme.danger}
                />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.danger}
                  />

                  <Text
                    style={[
                      styles.actionText,
                      { color: theme.danger },
                    ]}
                  >
                    Delete
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="cube-outline"
            size={34}
            color={theme.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No Volume Pricing
        </Text>

        <Text style={styles.emptyDescription}>
          {search
            ? 'No pricing rules match your search.'
            : 'Create your first volume pricing rule to get started.'}
        </Text>

        {!search && (
          <Pressable
            style={styles.emptyButton}
            onPress={openCreate}
          >
            <Ionicons
              name="add"
              size={20}
              color={theme.white}
            />

            <Text style={styles.emptyButtonText}>
              Add Pricing
            </Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="cube-outline"
                size={24}
                color={theme.primary}
              />
            </View>

            <View>
              <Text style={styles.title}>
                Volume Pricing
              </Text>

              <Text style={styles.subtitle}>
                Manage volume-based shipment rates
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={openCreate}
          >
            <Ionicons
              name="add"
              size={22}
              color={theme.white}
            />

            <Text style={styles.addButtonText}>
              Add
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={21}
            color={theme.textSecondary}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search volume pricing..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={theme.danger}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              onPress={() => loadVolumePricings()}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Summary */}
        {!loading && volumePricings.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="layers-outline"
                size={21}
                color={theme.primary}
              />
            </View>

            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>
                Pricing Rules
              </Text>

              <Text style={styles.summaryValue}>
                {volumePricings.length}
              </Text>
            </View>

            <View style={styles.summaryRight}>
              <Text style={styles.summaryHint}>
                Volume rates
              </Text>
            </View>
          </View>
        )}

        {/* List */}
        <FlatList
          data={volumePricings}
          keyExtractor={(item, index) =>
            String(item.id ?? index)
          }
          renderItem={renderPricing}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            volumePricings.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />

        {/* Loading overlay */}
        {loading && volumePricings.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.primary}
            />

            <Text style={styles.loadingText}>
              Loading volume pricing...
            </Text>
          </View>
        )}
      </View>

      {/* Create / Edit Modal */}
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
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalIcon}>
                  <Ionicons
                    name={
                      editing
                        ? 'create-outline'
                        : 'add-circle-outline'
                    }
                    size={23}
                    color={theme.primary}
                  />
                </View>

                <View>
                  <Text style={styles.modalTitle}>
                    {editing
                      ? 'Edit Volume Pricing'
                      : 'New Volume Pricing'}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Configure volume-based pricing
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closeModal}
                disabled={saving}
                hitSlop={10}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color={theme.textSecondary}
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
              <View style={styles.field}>
                <Text style={styles.label}>
                  Minimum Volume
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="arrow-down-outline"
                    size={19}
                    color={theme.primary}
                  />

                  <TextInput
                    style={styles.input}
                    value={formData.min_volume}
                    onChangeText={(value) =>
                      updateField(
                        'min_volume',
                        value
                      )
                    }
                    placeholder="e.g. 0"
                    placeholderTextColor={
                      theme.textMuted
                    }
                    keyboardType="decimal-pad"
                  />
                </View>

                <Text style={styles.helperText}>
                  Minimum volume for this pricing range
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Maximum Volume
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="arrow-up-outline"
                    size={19}
                    color={theme.primary}
                  />

                  <TextInput
                    style={styles.input}
                    value={formData.max_volume}
                    onChangeText={(value) =>
                      updateField(
                        'max_volume',
                        value
                      )
                    }
                    placeholder="e.g. 10"
                    placeholderTextColor={
                      theme.textMuted
                    }
                    keyboardType="decimal-pad"
                  />
                </View>

                <Text style={styles.helperText}>
                  Maximum volume for this pricing range
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Price
                </Text>

                <View style={styles.inputContainer}>
                  <Text
                    style={styles.currencyPrefix}
                  >
                    ETB
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(value) =>
                      updateField(
                        'price',
                        value
                      )
                    }
                    placeholder="0.00"
                    placeholderTextColor={
                      theme.textMuted
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Per volume switch */}
              <View style={styles.switchCard}>
                <View style={styles.switchIcon}>
                  <Ionicons
                    name="calculator-outline"
                    size={21}
                    color={theme.primary}
                  />
                </View>

                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>
                    Price Per Unit Volume
                  </Text>

                  <Text
                    style={styles.switchDescription}
                  >
                    Apply this price to each unit of
                    volume
                  </Text>
                </View>

                <Switch
                  value={formData.is_per_volume}
                  onValueChange={(value) =>
                    updateField(
                      'is_per_volume',
                      value
                    )
                  }
                  trackColor={{
                    false: theme.overlayMedium,
                    true: theme.primaryDark,
                  }}
                  thumbColor={
                    formData.is_per_volume
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
              </View>

              {/* Preview */}
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>
                  Pricing Preview
                </Text>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>
                    Range
                  </Text>

                  <Text style={styles.previewValue}>
                    {formData.min_volume || '0'} -{' '}
                    {formData.max_volume || '0'}
                  </Text>
                </View>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>
                    Price
                  </Text>

                  <Text style={styles.previewPrice}>
                    ETB{' '}
                    {Number(
                      formData.price || 0
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>
                    Pricing type
                  </Text>

                  <Text style={styles.previewValue}>
                    {formData.is_per_volume
                      ? 'Per Unit Volume'
                      : 'Fixed Price'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  saving && styles.disabledButton,
                  pressed && styles.pressed,
                ]}
                onPress={saveVolumePricing}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.white}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={19}
                      color={theme.white}
                    />

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
    </SafeAreaView>
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
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.10)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },

  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: theme.radius.md,
    ...theme.shadows.button,
  },

  addButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    marginHorizontal: theme.spacing.md,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(231,76,60,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.25)',
  },

  errorText: {
    flex: 1,
    color: theme.colors.danger,
    fontSize: 13,
    marginHorizontal: 8,
  },

  retryText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xxl,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryInfo: {
    marginLeft: theme.spacing.lg,
  },

  summaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  summaryValue: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },

  summaryRight: {
    marginLeft: 'auto',
  },

  summaryHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  // List
  listContent: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: 35,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  pricingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  indexText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  rangeContainer: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },

  rangeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  rangeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.radius.round,
  },

  statusActive: {
    backgroundColor: 'rgba(22,163,74,0.14)',
  },

  statusInactive: {
    backgroundColor: theme.colors.overlayLight,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statusActiveText: {
    color: theme.colors.success,
  },

  statusInactiveText: {
    color: theme.colors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.lg,
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priceLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  priceText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    marginLeft: 7,
    borderWidth: 1,
  },

  editButton: {
    backgroundColor: 'rgba(217,119,6,0.08)',
    borderColor: 'rgba(217,119,6,0.18)',
  },

  deleteButton: {
    backgroundColor: 'rgba(231,76,60,0.08)',
    borderColor: 'rgba(231,76,60,0.18)',
  },

  actionText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    flex: 1,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  emptyDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 300,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.xxl,
  },

  emptyButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 5,
  },

  // Loading
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 150,
    alignItems: 'center',
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlayDark,
  },

  modalContainer: {
    maxHeight: '92%',
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalContent: {
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxxl,
  },

  field: {
    marginBottom: theme.spacing.xl,
  },

  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginLeft: 10,
  },

  currencyPrefix: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  helperText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 5,
  },

  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },

  switchIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  switchInfo: {
    flex: 1,
    marginHorizontal: theme.spacing.lg,
  },

  switchTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  switchDescription: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  previewCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,216,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  previewTitle: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: theme.spacing.lg,
  },

  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },

  previewLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  previewValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  previewPrice: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: theme.spacing.lg,
    paddingBottom:
      Platform.OS === 'ios'
        ? theme.spacing.xxxl
        : theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1.3,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    ...theme.shadows.button,
  },

  saveButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.75,
  },
})

export default VolumePricingScreen
