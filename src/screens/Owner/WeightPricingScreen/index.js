// src/screens/Owner/WeightPricingScreen/index.js

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
import { useFocusEffect, useRoute } from '@react-navigation/native'

import api from '../../../utils/axioServices'
import { END_POINT } from '../../../constants/urls'
import { theme } from '../../../theme/theme'

const emptyForm = {
  min_weight: '',
  max_weight: '',
  price: '',
  is_per_weight: false,
}

const WeightPricingScreen = () => {
  const route = useRoute()

  const [weightPricings, setWeightPricings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const weightPricingId =
    route?.params?.weightPricingId ||
    route?.params?.id ||
    null

  // --------------------------------------------------
  // LOAD WEIGHT PRICINGS
  // --------------------------------------------------

  const loadWeightPricings = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const res = await api.get(
        `${END_POINT}/usr-mngmnt/api/company-weight-pricing/?search=${encodeURIComponent(
          search
        )}`
      )

      setWeightPricings(res.data?.results || res.data || [])
    } catch (err) {
      console.error('Failed to load weight pricings:', err)

      Alert.alert(
        'Error',
        'Failed to load weight pricing.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWeightPricings()
    }, 350)

    return () => clearTimeout(timer)
  }, [search])

  useFocusEffect(
    useCallback(() => {
      loadWeightPricings()
    }, [])
  )

  // --------------------------------------------------
  // OPEN CREATE
  // --------------------------------------------------

  const openCreate = () => {
    setEditing(false)
    setCurrentId(null)
    setFormData({
      ...emptyForm,
    })
    setModalVisible(true)
  }

  // --------------------------------------------------
  // OPEN EDIT
  // --------------------------------------------------

  const openEdit = (pricing) => {
    setEditing(true)
    setCurrentId(pricing.id)

    setFormData({
      min_weight:
        pricing.min_weight !== null &&
        pricing.min_weight !== undefined
          ? String(pricing.min_weight)
          : '',

      max_weight:
        pricing.max_weight !== null &&
        pricing.max_weight !== undefined
          ? String(pricing.max_weight)
          : '',

      price:
        pricing.price !== null &&
        pricing.price !== undefined
          ? String(pricing.price)
          : '',

      is_per_weight: Boolean(
        pricing.is_per_weight
      ),
    })

    setModalVisible(true)
  }

  // --------------------------------------------------
  // OPEN FROM PARAM
  // --------------------------------------------------

  useEffect(() => {
    if (!weightPricingId || !weightPricings.length) {
      return
    }

    const pricing = weightPricings.find(
      item => String(item.id) === String(weightPricingId)
    )

    if (pricing) {
      openEdit(pricing)
    }
  }, [weightPricingId, weightPricings])

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const saveWeightPricing = async () => {
    if (
      formData.min_weight === '' ||
      formData.max_weight === '' ||
      formData.price === ''
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill in minimum weight, maximum weight, and price.'
      )
      return
    }

    const minWeight = Number(formData.min_weight)
    const maxWeight = Number(formData.max_weight)
    const price = Number(formData.price)

    if (
      Number.isNaN(minWeight) ||
      Number.isNaN(maxWeight) ||
      Number.isNaN(price)
    ) {
      Alert.alert(
        'Invalid Values',
        'Please enter valid numeric values.'
      )
      return
    }

    if (minWeight < 0 || maxWeight < 0 || price < 0) {
      Alert.alert(
        'Invalid Values',
        'Weight and price cannot be negative.'
      )
      return
    }

    if (maxWeight < minWeight) {
      Alert.alert(
        'Invalid Range',
        'Maximum weight must be greater than or equal to minimum weight.'
      )
      return
    }

    try {
      setSaving(true)

      const payload = {
        min_weight: minWeight,
        max_weight: maxWeight,
        price,
        is_per_weight: formData.is_per_weight,
      }

      if (editing) {
        await api.put(
          `${END_POINT}/usr-mngmnt/api/company-weight-pricing/${currentId}/`,
          payload
        )
      } else {
        await api.post(
          `${END_POINT}/usr-mngmnt/api/company-weight-pricing/`,
          payload
        )
      }

      setModalVisible(false)
      setFormData({
        ...emptyForm,
      })
      setCurrentId(null)
      setEditing(false)

      await loadWeightPricings()
    } catch (err) {
      console.error('Failed to save weight pricing:', err)

      const message =
        err?.response?.data?.detail ||
        'Unable to save weight pricing.'

      Alert.alert('Error', message)
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const deleteWeightPricing = (id) => {
    Alert.alert(
      'Delete Pricing',
      'Are you sure you want to delete this pricing?',
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
                `${END_POINT}/usr-mngmnt/api/company-weight-pricing/${id}/`
              )

              await loadWeightPricings()
            } catch (err) {
              console.error(
                'Failed to delete pricing:',
                err
              )

              Alert.alert(
                'Error',
                'Unable to delete pricing.'
              )

              setLoading(false)
            }
          },
        },
      ]
    )
  }

  // --------------------------------------------------
  // INPUT
  // --------------------------------------------------

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // --------------------------------------------------
  // RENDER ITEM
  // --------------------------------------------------

  const renderPricingItem = ({ item, index }) => {
    const minWeight = Number(
      item.min_weight || 0
    )

    const maxWeight = Number(
      item.max_weight || 0
    )

    const price = Number(
      item.price || 0
    )

    return (
      <View
        style={[
          styles.pricingCard,
          index === 0 && styles.firstCard,
        ]}
      >
        {/* Card header */}

        <View style={styles.pricingCardHeader}>
          <View style={styles.rangeIcon}>
            <Ionicons
              name="scale-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.rangeInfo}>
            <Text style={styles.rangeTitle}>
              {minWeight} kg - {maxWeight} kg
            </Text>

            <Text style={styles.rangeSubtitle}>
              Weight range
            </Text>
          </View>

          <View
            style={[
              styles.perKgBadge,
              item.is_per_weight
                ? styles.perKgBadgeActive
                : styles.perKgBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.perKgText,
                item.is_per_weight
                  ? styles.perKgTextActive
                  : styles.perKgTextInactive,
              ]}
            >
              {item.is_per_weight
                ? 'Per KG'
                : 'Fixed'}
            </Text>
          </View>
        </View>

        {/* Price */}

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>
            Price
          </Text>

          <Text style={styles.priceValue}>
            ETB {price.toFixed(2)}
          </Text>

          {item.is_per_weight && (
            <Text style={styles.priceUnit}>
              per kilogram
            </Text>
          )}
        </View>

        {/* Actions */}

        <View style={styles.actionsRow}>
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
              color={theme.colors.warning}
            />

            <Text style={styles.editButtonText}>
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
              deleteWeightPricing(item.id)
            }
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={theme.colors.danger}
            />

            <Text style={styles.deleteButtonText}>
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // --------------------------------------------------
  // EMPTY
  // --------------------------------------------------

  const renderEmpty = () => {
    if (loading) {
      return null
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="scale-outline"
            size={42}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No Weight Pricings
        </Text>

        <Text style={styles.emptyText}>
          Create your first weight pricing rule
          to start calculating shipment prices.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
          onPress={openCreate}
        >
          <Ionicons
            name="add"
            size={20}
            color={theme.colors.white}
          />

          <Text style={styles.emptyButtonText}>
            New Weight Pricing
          </Text>
        </Pressable>
      </View>
    )
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading && weightPricings.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading weight pricing...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // --------------------------------------------------
  // SCREEN
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="scale-outline"
                size={25}
                color={theme.colors.primary}
              />
            </View>

            <View>
              <Text style={styles.title}>
                Weight Pricing
              </Text>

              <Text style={styles.subtitle}>
                Manage shipment weight rates
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
              color={theme.colors.background}
            />

            <Text style={styles.addButtonText}>
              New
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
            style={styles.searchInput}
            placeholder="Search weight pricing..."
            placeholderTextColor={
              theme.colors.textMuted
            }
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Count */}

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {weightPricings.length}{' '}
            {weightPricings.length === 1
              ? 'pricing'
              : 'pricings'}
          </Text>

          {loading && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
            />
          )}
        </View>

        {/* List */}

        <FlatList
          data={weightPricings}
          keyExtractor={(item, index) =>
            String(item.id || index)
          }
          renderItem={renderPricingItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            weightPricings.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                loadWeightPricings(true)
              }
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      </View>

      {/* CREATE / EDIT MODAL */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          !saving && setModalVisible(false)
        }
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
                    ? 'Edit Weight Pricing'
                    : 'New Weight Pricing'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Configure the weight pricing range
                </Text>
              </View>

              <Pressable
                disabled={saving}
                onPress={() =>
                  setModalVisible(false)
                }
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
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

              {/* Minimum Weight */}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Minimum Weight
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="arrow-down-outline"
                    size={19}
                    color={theme.colors.primary}
                  />

                  <TextInput
                    style={styles.input}
                    value={String(
                      formData.min_weight
                    )}
                    onChangeText={value =>
                      updateField(
                        'min_weight',
                        value
                      )
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                  />

                  <Text style={styles.inputUnit}>
                    KG
                  </Text>
                </View>
              </View>

              {/* Maximum Weight */}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Maximum Weight
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="arrow-up-outline"
                    size={19}
                    color={theme.colors.primary}
                  />

                  <TextInput
                    style={styles.input}
                    value={String(
                      formData.max_weight
                    )}
                    onChangeText={value =>
                      updateField(
                        'max_weight',
                        value
                      )
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                  />

                  <Text style={styles.inputUnit}>
                    KG
                  </Text>
                </View>
              </View>

              {/* Price */}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Price
                </Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.currency}>
                    ETB
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={String(
                      formData.price
                    )}
                    onChangeText={value =>
                      updateField(
                        'price',
                        value
                      )
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                  />
                </View>
              </View>

              {/* Per KG */}

              <View style={styles.switchCard}>
                <View style={styles.switchIcon}>
                  <Ionicons
                    name="calculator-outline"
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>
                    Price Per KG
                  </Text>

                  <Text style={styles.switchDescription}>
                    Apply the price to each kilogram
                    of the shipment.
                  </Text>
                </View>

                <Switch
                  value={
                    formData.is_per_weight
                  }
                  onValueChange={value =>
                    updateField(
                      'is_per_weight',
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
                    formData.is_per_weight
                      ? theme.colors.primary
                      : '#9CA3AF'
                  }
                />
              </View>

              {/* Preview */}

              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={theme.colors.primary}
                  />

                  <Text style={styles.previewTitle}>
                    Pricing Preview
                  </Text>
                </View>

                <Text style={styles.previewText}>
                  {formData.min_weight || '0'} KG
                  {'  →  '}
                  {formData.max_weight || '0'} KG
                </Text>

                <Text style={styles.previewPrice}>
                  ETB{' '}
                  {Number(
                    formData.price || 0
                  ).toFixed(2)}
                  {formData.is_per_weight
                    ? ' / KG'
                    : ''}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}

            <View style={styles.modalFooter}>
              <Pressable
                disabled={saving}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={saveWeightPricing}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      theme.colors.background
                    }
                  />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={19}
                    color={
                      theme.colors.background
                    }
                  />
                )}

                <Text style={styles.saveText}>
                  {saving
                    ? 'Saving...'
                    : 'Save Pricing'}
                </Text>
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
    paddingHorizontal: theme.spacing.xl,
  },

  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor:
      'rgba(0,216,255,0.10)',
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
    marginLeft: 10,
    ...theme.shadows.button,
  },

  addButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  searchContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginHorizontal: 10,
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },

  countText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // --------------------------------------------------
  // LIST
  // --------------------------------------------------

  listContent: {
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  pricingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },

  firstCard: {
    borderColor:
      'rgba(0,216,255,0.20)',
  },

  pricingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rangeIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.sm,
    backgroundColor:
      'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rangeInfo: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },

  rangeTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  rangeSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  perKgBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.round,
  },

  perKgBadgeActive: {
    backgroundColor:
      'rgba(22,163,74,0.15)',
  },

  perKgBadgeInactive: {
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },

  perKgText: {
    fontSize: 10,
    fontWeight: '800',
  },

  perKgTextActive: {
    color: '#4ADE80',
  },

  perKgTextInactive: {
    color: theme.colors.textSecondary,
  },

  priceSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },

  priceLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 3,
  },

  priceValue: {
    color: theme.colors.primary,
    fontSize: 25,
    fontWeight: '800',
  },

  priceUnit: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  actionsRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },

  editButton: {
    backgroundColor:
      'rgba(217,119,6,0.10)',
    borderColor:
      'rgba(217,119,6,0.25)',
  },

  deleteButton: {
    backgroundColor:
      'rgba(231,76,60,0.08)',
    borderColor:
      'rgba(231,76,60,0.20)',
  },

  editButtonText: {
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 7,
  },

  deleteButtonText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 7,
  },

  pressed: {
    opacity: 0.7,
  },

  // --------------------------------------------------
  // EMPTY
  // --------------------------------------------------

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor:
      'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 310,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    height: 46,
    borderRadius: theme.radius.md,
    marginTop: 20,
  },

  emptyButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 7,
  },

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlayDark,
  },

  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '92%',
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
    borderRadius: 19,
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
    paddingBottom: 25,
  },

  inputGroup: {
    marginBottom: 18,
  },

  inputLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  inputWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    marginLeft: 9,
    paddingVertical: 0,
  },

  inputUnit: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },

  currency: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginRight: 5,
  },

  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginTop: 3,
  },

  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor:
      'rgba(0,216,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  switchInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  switchTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  switchDescription: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  previewCard: {
    marginTop: 18,
    backgroundColor:
      'rgba(0,216,255,0.06)',
    borderWidth: 1,
    borderColor:
      'rgba(0,216,255,0.14)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 7,
  },

  previewText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },

  previewPrice: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1.4,
    height: 48,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 7,
  },
})

export default WeightPricingScreen
