// src/screens/ReceivedBillsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
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
import { Ionicons } from '@expo/vector-icons'

import { END_POINT } from '../../constants/urls'
import api from '../../utils/axioServices'
import { updateReceivedBillByEmployeeAPI } from '../../utils/employe_api_utils'
import { theme } from '../../theme/theme'
import DateInput from '../../components/DateInput'

const STATUS_LIST = [
  'CREATED',
  'IN_TRANSIT',
  'ARRIVED',
  'DELIVERED',
  'RETURNED',
]

const STATUS_LABELS = {
  CREATED: 'Created',
  IN_TRANSIT: 'In Transit',
  ARRIVED: 'Arrived',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
}

const STATUS_COLORS = {
  CREATED: {
    color: '#A7B0C0',
    background: 'rgba(167,176,192,0.12)',
  },
  IN_TRANSIT: {
    color: theme.colors.warning,
    background: 'rgba(217,119,6,0.14)',
  },
  ARRIVED: {
    color: theme.colors.info,
    background: 'rgba(8,145,178,0.14)',
  },
  DELIVERED: {
    color: theme.colors.success,
    background: 'rgba(22,163,74,0.14)',
  },
  RETURNED: {
    color: theme.colors.danger,
    background: 'rgba(231,76,60,0.14)',
  },
}

const getToday = () => {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const formatDate = (dateString) => {
  if (!dateString) return '-'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatAmount = (amount) => {
  const value = Number(amount || 0)

  return `ETB ${value.toFixed(2)}`
}

const ReceivedBillsScreen = ({ navigation }) => {
  const today = useMemo(() => getToday(), [])

  const [bills, setBills] = useState([])
  const [summary, setSummary] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingBillId, setUpdatingBillId] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [dateModalVisible, setDateModalVisible] = useState(false)

  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedDateType, setSelectedDateType] = useState('start')

  /**
   * ---------------------------------------------------------
   * Fetch bills + summary
   * ---------------------------------------------------------
   */
  const fetchReportAndSummary = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true)
        }

        const params = new URLSearchParams()

        if (search.trim()) {
          params.append('search', search.trim())
        }

        if (statusFilter) {
          params.append('status', statusFilter)
        }

        if (startDate) {
          params.append('start_date', startDate)
        }

        if (endDate) {
          params.append('end_date', endDate)
        }

        const res = await api.get(
          `${END_POINT}/express-api/api/bills/received_bills/?${params.toString()}`,
        )

        setBills(res.data?.results || res.data || [])
        setSummary(res.data?.summary || null)
      } catch (error) {
        console.error('Failed to load received bills:', error)

        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(
            'Failed to load received bills',
            'danger',
            'Error',
          )
        }
      } finally {
        if (showLoader) {
          setLoading(false)
        }
      }
    },
    [search, statusFilter, startDate, endDate],
  )

  /**
   * Initial load
   */
  useEffect(() => {
    fetchReportAndSummary()
  }, [fetchReportAndSummary])

  /**
   * Search/filter debounce
   *
   * This avoids making an API request for every character
   * typed into the search field.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReportAndSummary()
    }, 400)

    return () => clearTimeout(timer)
  }, [search, statusFilter, startDate, endDate])

  /**
   * Pull to refresh
   */
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchReportAndSummary(false)
    } finally {
      setRefreshing(false)
    }
  }

  /**
   * ---------------------------------------------------------
   * Update status
   * ---------------------------------------------------------
   */
  const updateBillStatus = async (bill, status) => {
    if (!bill?.id || updatingBillId === bill.id) {
      return
    }

    try {
      setUpdatingBillId(bill.id)
      setStatusModalVisible(false)

      const data = {
        status,
        from_type: 'receiver',
      }

      const response = await updateReceivedBillByEmployeeAPI(
        bill.id,
        data,
        'receiver',
      )

      if (response?.status === 200) {
        setBills((previousBills) =>
          previousBills.map((item) =>
            item.id === bill.id
              ? {
                  ...item,
                  status,
                }
              : item,
          ),
        )

        // Refresh summary because status counts can change.
        await fetchReportAndSummary(false)

        if (
          typeof window !== 'undefined' &&
          window.showToast
        ) {
          window.showToast(
            `${bill.tracking_no} status updated to ${STATUS_LABELS[status]}`,
            'success',
            'Success',
          )
        }
      } else {
        if (
          typeof window !== 'undefined' &&
          window.showToast
        ) {
          window.showToast(
            `${bill.tracking_no} status update failed`,
            'danger',
            'Error',
          )
        }
      }
    } catch (error) {
      console.error('Failed to update bill status:', error)

      if (
        typeof window !== 'undefined' &&
        window.showToast
      ) {
        window.showToast(
          'Failed to update bill status',
          'danger',
          'Error',
        )
      }
    } finally {
      setUpdatingBillId(null)
    }
  }

  /**
   * ---------------------------------------------------------
   * Filters
   * ---------------------------------------------------------
   */
  const filteredBills = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return bills.filter((bill) => {
      const trackingNo = String(
        bill?.tracking_no || '',
      ).toLowerCase()

      const matchesSearch =
        !searchValue ||
        trackingNo.includes(searchValue)

      const matchesStatus =
        !statusFilter ||
        bill?.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bills, search, statusFilter])

  /**
   * ---------------------------------------------------------
   * Print / fingerprint
   * ---------------------------------------------------------
   *
   * React Native does not have window.open().
   *
   * If your app has a bill-detail screen, navigate there.
   * Otherwise you can replace these handlers with your
   * Expo printer/PDF implementation.
   */
  const handlePrint = (bill) => {
    if (!bill?.tracking_no) return

    if (navigation) {
      navigation.navigate('DetailBill', {
        trackingNo: bill.tracking_no,
        mode: 'print',
      })
    }
  }

  const handleFingerprint = (bill) => {
    if (!bill?.tracking_no) return

    if (navigation) {
      navigation.navigate('DetailBill', {
        trackingNo: bill.tracking_no,
        mode: 'fingerprint',
      })
    }
  }

  /**
   * ---------------------------------------------------------
   * Date picker
   * ---------------------------------------------------------
   *
   * This implementation uses a simple native text date input
   * inside the modal so you don't need another dependency.
   *
   * You can replace it with @react-native-community/datetimepicker
   * later if desired.
   */
  const openDatePicker = (type) => {
    setSelectedDateType(type)
    setDateModalVisible(true)
  }

  const setDateValue = (value) => {
    if (selectedDateType === 'start') {
      setStartDate(value)
    } else {
      setEndDate(value)
    }

    setDateModalVisible(false)
  }

  /**
   * ---------------------------------------------------------
   * Summary cards
   * ---------------------------------------------------------
   */
  const renderSummaryCard = ({
    title,
    value,
    icon,
    color,
  }) => (
    <View
      style={[
        styles.summaryCard,
        {
          borderColor: `${color}45`,
        },
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: `${color}18`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
        />
      </View>

      <Text style={styles.summaryTitle}>
        {title}
      </Text>

      <Text
        style={[
          styles.summaryValue,
          {
            color,
          },
        ]}
      >
        {loading
          ? '—'
          : value}
      </Text>
    </View>
  )

  /**
   * ---------------------------------------------------------
   * Status selector
   * ---------------------------------------------------------
   */
  const openStatusSelector = (bill) => {
    setSelectedBill(bill)
    setStatusModalVisible(true)
  }

  /**
   * ---------------------------------------------------------
   * Bill card
   * ---------------------------------------------------------
   */
  const renderBill = ({ item }) => {
    const statusStyle =
      STATUS_COLORS[item.status] ||
      STATUS_COLORS.CREATED

    const isUpdating =
      updatingBillId === item.id

    return (
      <View style={styles.billCard}>
        {/* Header */}
        <View style={styles.billHeader}>
          <View style={styles.trackingContainer}>
            <View style={styles.trackingIcon}>
              <Ionicons
                name="cube-outline"
                size={18}
                color={theme.colors.primary}
              />
            </View>

            <View>
              <Text style={styles.trackingLabel}>
                Tracking Number
              </Text>

              <Text
                style={styles.trackingNumber}
                numberOfLines={1}
              >
                {item.tracking_no || '-'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              openStatusSelector(item)
            }
            disabled={isUpdating}
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusStyle.background,
                borderColor:
                  `${statusStyle.color}40`,
              },
            ]}
          >
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color={statusStyle.color}
              />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        statusStyle.color,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    {
                      color: statusStyle.color,
                    },
                  ]}
                >
                  {STATUS_LABELS[item.status] ||
                    item.status}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={13}
                  color={statusStyle.color}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Sender / Consignee */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Sender
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {item.sender_name || 'Walk-in'}
            </Text>
          </View>

          <View
            style={[
              styles.infoItem,
              styles.infoItemRight,
            ]}
          >
            <Text style={styles.infoLabel}>
              Consignee
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {item.consignee_name || '-'}
            </Text>
          </View>
        </View>

        {/* Amount / Date */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Amount
            </Text>

            <Text
              style={[
                styles.amountValue,
                {
                  color: theme.colors.success,
                },
              ]}
            >
              {formatAmount(
                item.amount_received,
              )}
            </Text>
          </View>

          <View
            style={[
              styles.infoItem,
              styles.infoItemRight,
            ]}
          >
            <Text style={styles.infoLabel}>
              Date
            </Text>

            <View style={styles.dateValueRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={theme.colors.textSecondary}
              />

              <Text style={styles.infoValue}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              styles.printButton,
            ]}
            onPress={() => handlePrint(item)}
          >
            <Ionicons
              name="print-outline"
              size={18}
              color={theme.colors.warning}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: theme.colors.warning,
                },
              ]}
            >
              Print
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              styles.fingerprintButton,
            ]}
            onPress={() =>
              handleFingerprint(item)
            }
          >
            <Ionicons
              name="finger-print-outline"
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
              Fingerprint
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /**
   * ---------------------------------------------------------
   * Empty state
   * ---------------------------------------------------------
   */
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />

          <Text style={styles.emptyTitle}>
            Loading received bills...
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="receipt-outline"
            size={38}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No Received Bills
        </Text>

        <Text style={styles.emptyDescription}>
          No bills match your current filters.
        </Text>

        {(search || statusFilter) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearch('')
              setStatusFilter('')
            }}
          >
            <Text style={styles.clearButtonText}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* -------------------------------------------------
            Header
        -------------------------------------------------- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Received Bills
            </Text>

            <Text style={styles.headerSubtitle}>
              Manage and track incoming bills
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.75}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* -------------------------------------------------
            Summary
        -------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.summaryScroll
          }
        >
          {renderSummaryCard({
            title: 'Total Bills',
            value:
              summary?.total_bills || 0,
            icon: 'cube-outline',
            color: theme.colors.primary,
          })}

          {renderSummaryCard({
            title: 'Revenue',
            value: loading
              ? '—'
              : formatAmount(
                  summary?.total_revenue || 0,
                ),
            icon: 'cash-outline',
            color: theme.colors.success,
          })}

          {renderSummaryCard({
            title: 'In Transit',
            value:
              summary?.in_transit || 0,
            icon: 'paper-plane-outline',
            color: theme.colors.warning,
          })}

          {renderSummaryCard({
            title: 'Delivered',
            value:
              summary?.delivered || 0,
            icon: 'checkmark-circle-outline',
            color: theme.colors.info,
          })}
        </ScrollView>

        {/* -------------------------------------------------
            Filters
        -------------------------------------------------- */}
        <View style={styles.filtersContainer}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={19}
              color={theme.colors.textSecondary}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tracking number..."
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.searchInput}
              autoCapitalize="characters"
              returnKeyType="search"
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Status */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.statusFilterButton}
            onPress={() => {
              setSelectedBill(null)
              setStatusModalVisible(true)
            }}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={theme.colors.primary}
            />

            <Text
              style={styles.filterButtonText}
              numberOfLines={1}
            >
              {statusFilter
                ? STATUS_LABELS[statusFilter]
                : 'All Status'}
            </Text>

            <Ionicons
              name="chevron-down"
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Dates */}
          <View style={styles.dateFilterRow}>
            <View style={styles.dateFilterItem}>
              <Text style={styles.dateFilterLabel}>
                Start Date
              </Text>

              <DateInput
                value={startDate}
                onChange={setStartDate}
                placeholder="Start"
                containerStyle={styles.dateInput}
              />
            </View>

            <View style={styles.dateFilterItem}>
              <Text style={styles.dateFilterLabel}>
                End Date
              </Text>

              <DateInput
                value={endDate}
                onChange={setEndDate}
                placeholder="End"
                containerStyle={styles.dateInput}
              />
            </View>
          </View>

        </View>


        {/* -------------------------------------------------
            Results
        -------------------------------------------------- */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Bills
          </Text>

          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {filteredBills.length}
            </Text>
          </View>
        </View>

        <FlatList
          data={filteredBills}
          keyExtractor={(item, index) =>
            String(
              item?.id ||
                item?.tracking_no ||
                index,
            )
          }
          renderItem={renderBill}
          contentContainerStyle={[
            styles.listContent,
            filteredBills.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />

        {/* -------------------------------------------------
            Status Modal
        -------------------------------------------------- */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setStatusModalVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedBill
                      ? 'Update Status'
                      : 'Filter by Status'}
                  </Text>

                  {selectedBill && (
                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {selectedBill.tracking_no}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() =>
                    setStatusModalVisible(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              {!selectedBill && (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    !statusFilter &&
                      styles.statusOptionSelected,
                  ]}
                  onPress={() => {
                    setStatusFilter('')
                    setStatusModalVisible(false)
                  }}
                >
                  <View
                    style={[
                      styles.statusOptionIcon,
                      {
                        backgroundColor:
                          theme.colors.overlayLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name="apps-outline"
                      size={19}
                      color={
                        theme.colors.primary
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.statusOptionText
                    }
                  >
                    All Status
                  </Text>

                  {!statusFilter && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={
                        theme.colors.primary
                      }
                    />
                  )}
                </TouchableOpacity>
              )}

              {STATUS_LIST.map((status) => {
                const color =
                  STATUS_COLORS[status]

                const isSelected = selectedBill
                  ? selectedBill.status ===
                    status
                  : statusFilter === status

                return (
                  <TouchableOpacity
                    key={status}
                    activeOpacity={0.75}
                    style={[
                      styles.statusOption,
                      isSelected &&
                        styles.statusOptionSelected,
                    ]}
                    onPress={() => {
                      if (selectedBill) {
                        updateBillStatus(
                          selectedBill,
                          status,
                        )
                        setSelectedBill(null)
                      } else {
                        setStatusFilter(status)
                        setStatusModalVisible(
                          false,
                        )
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.statusOptionIcon,
                        {
                          backgroundColor:
                            color.background,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.largeStatusDot,
                          {
                            backgroundColor:
                              color.color,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.statusOptionText,
                        {
                          color:
                            isSelected
                              ? color.color
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {STATUS_LABELS[status]}
                    </Text>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color={color.color}
                      />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </Modal>

        {/* -------------------------------------------------
            Date Modal
        -------------------------------------------------- */}
        <Modal
          visible={dateModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setDateModalVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedDateType === 'start'
                      ? 'Start Date'
                      : 'End Date'}
                  </Text>

                  <Text
                    style={styles.modalSubtitle}
                  >
                    Select the date for the report
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() =>
                    setDateModalVisible(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={styles.dateInputContainer}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.primary}
                />

                <TextInput
                  value={
                    selectedDateType === 'start'
                      ? startDate
                      : endDate
                  }
                  onChangeText={(value) =>
                    setDateValue(value)
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={
                    theme.colors.textSecondary
                  }
                  style={styles.dateInput}
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <Text
                style={styles.dateHint}
              >
                Format: YYYY-MM-DD
              </Text>

              <TouchableOpacity
                style={styles.applyDateButton}
                onPress={() =>
                  setDateModalVisible(false)
                }
              >
                <Text
                  style={styles.applyDateText}
                >
                  Apply Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
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

  /* -------------------------------------------------------
     Header
  ------------------------------------------------------- */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 15,
  },

  headerTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* -------------------------------------------------------
     Summary
  ------------------------------------------------------- */

  summaryScroll: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: 16,
    gap: 10,
  },

  summaryCard: {
    width: 145,
    minHeight: 132,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 13,
    ...theme.shadows.card,
  },

  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  summaryTitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },

  /* -------------------------------------------------------
     Filters
  ------------------------------------------------------- */

  filtersContainer: {
    paddingHorizontal: theme.spacing.xxl,
    marginBottom: 5,
  },

  searchContainer: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: 9,
    paddingVertical: 0,
  },

  statusFilterButton: {
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginTop: 9,
    gap: 8,
  },

  filterButtonText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  dateFilterRow: {
    flexDirection: 'row',
    gap: 19,
    marginTop: 9,
  },

  dateFilterItem: {
    flex: 1,
    minWidth: 0
  },
  dateInput: {
    width: '100%',
    flex: 0,
  },
  dateFilterLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 5,
  },


  /* -------------------------------------------------------
     Results
  ------------------------------------------------------- */

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    marginTop: 16,
    marginBottom: 8,
  },

  resultsTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  resultsCount: {
    marginLeft: 8,
    minWidth: 25,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: theme.radius.round,
    backgroundColor: 'rgba(0,216,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultsCountText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  listContent: {
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  /* -------------------------------------------------------
     Bill Card
  ------------------------------------------------------- */

  billCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    padding: 15,
    ...theme.shadows.card,
  },

  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  trackingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  trackingIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(0,216,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  trackingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginBottom: 3,
  },

  trackingNumber: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 155,
  },

  statusBadge: {
    minHeight: 30,
    maxWidth: 125,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 13,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  infoItem: {
    flex: 1,
  },

  infoItemRight: {
    paddingLeft: 12,
  },

  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },

  infoValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  amountValue: {
    fontSize: 13,
    fontWeight: '800',
  },

  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  /* -------------------------------------------------------
     Actions
  ------------------------------------------------------- */

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
  },

  printButton: {
    backgroundColor: 'rgba(217,119,6,0.08)',
    borderColor: 'rgba(217,119,6,0.25)',
  },

  fingerprintButton: {
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderColor: 'rgba(0,216,255,0.25)',
  },

  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* -------------------------------------------------------
     Empty
  ------------------------------------------------------- */

  emptyContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 22,
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },

  clearButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: '800',
  },

  /* -------------------------------------------------------
     Modal
  ------------------------------------------------------- */

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },

  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusOption: {
    minHeight: 55,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 6,
  },

  statusOptionSelected: {
    backgroundColor: 'rgba(0,216,255,0.07)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  statusOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  largeStatusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  statusOptionText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  /* -------------------------------------------------------
     Date Modal
  ------------------------------------------------------- */

  dateInputContainer: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
  },

  dateInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    marginLeft: 10,
  },

  dateHint: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 7,
  },

  applyDateButton: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  applyDateText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
})

export default ReceivedBillsScreen
