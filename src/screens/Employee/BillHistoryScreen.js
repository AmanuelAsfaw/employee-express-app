import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';

import api from '../../utils/axioServices';
import { END_POINT } from '../../constants/urls';
import { fetchOfflineBillsReport } from '../../utils/offline_db_service_utils';

import {
  sendBothSmsBulkAPI,
  sendConsigneeSmsBulkAPI,
  sendSenderSmsBulkAPI,
  updateReceivedBillByEmployeeAPI,
} from '../../utils/employe_api_utils';
import { theme } from '../../theme/theme';
import DateInput from '../../components/DateInput';
import CustomCommissionPrint from '../../components/bills/CustomCommissionPrint';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../components/Alert';

// If you already export this from another mobile file,
// import it from there instead.
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


const EmployeeBillsScreen = ({navigation}) => {
  // const navigation = useNavigation();

  // ============================================================
  // DATA
  // ============================================================

  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedStatusBill, setSelectedStatusBill] = useState(null)
  const [updatingBillId, setUpdatingBillId] = useState(null)

  // ============================================================
  // NETWORK
  // ============================================================

  const [isConnected, setIsConnected] = useState(true);

  // ============================================================
  // FILTERS
  // ============================================================

  const today = format(new Date(), 'yyyy-MM-dd');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [destinyFilter, setDestinyFilter] = useState([]);
  const [destinyModalVisible, setDestinyModalVisible] = useState(false);

  // ============================================================
  // SELECTION
  // ============================================================

  // const [selectedBills, setSelectedBills] = useState([]);
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // ============================================================
  // SMS
  // ============================================================

  const [sendingMessages, setSendingMessages] = useState(false);
  const [smsType, setSmsType] = useState('');

  // ============================================================
  // MODALS
  // ============================================================

  const [selectedBillsModalVisible, setSelectedBillsModalVisible] = useState(false);
  const [customCommissionVisible, setCustomCommissionVisible] = useState(false);


  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  // ============================================================
  // DESTINY BRANCHES
  // ============================================================

  const destinyList = useMemo(() => {
    const map = new Map();

    bills.forEach((bill) => {
      const branch = bill?.destiny_branch;

      if (branch?.id) {
        map.set(String(branch.id), branch);
      }
    });

    return Array.from(map.values());
  }, [bills]);

  // ============================================================
  // NETWORK LISTENER
  // ============================================================

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected));
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // LOAD BILLS
  // ============================================================

  const loadBills = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      if (isConnected) {
        const params = new URLSearchParams();

        if (search) {
          params.append('search', search);
        }

        if (statusFilter) {
          params.append('status', statusFilter);
        }

        if (startDate) {
          params.append('start_date', startDate);
        }

        if (endDate) {
          params.append('end_date', endDate);
        }

        const res = await api.get(
          `${END_POINT}/express-api/api/bills/report/?${params.toString()}`
        );

        const results = res?.data?.results || res?.data || [];

        setBills(Array.isArray(results) ? results : []);
        setSummary(res?.data?.summary || null);
        setCompanyData(res?.data?.company || null);
      } else {
        const resOffline = await fetchOfflineBillsReport({
          page: 1,
          search,
          status: statusFilter,
          start_date: startDate,
          end_date: endDate,
        });

        setBills(resOffline?.results || []);
        setSummary(resOffline?.summary || null);
        setCompanyData(resOffline?.company || null);
      }
    } catch (error) {
      console.error('Failed to load bills:', error);

      Alert.alert(
        'Error',
        'Failed to load bills history.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [
    isConnected,
    // search,
    statusFilter,
    startDate,
    endDate,
  ]);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadBills(false);
  };

  // ============================================================
  // FILTER BILLS BY DESTINY
  // ============================================================

  const filteredBills = useMemo(() => {
    if (!destinyFilter.length) {
      return bills;
    }

    return bills.filter((bill) =>
      destinyFilter.includes(
        String(bill?.destiny_branch?.id)
      )
    );
  }, [bills, destinyFilter]);

  const selectedBills = useMemo(() => {
    return filteredBills.filter((bill) =>
      selectedBillIds.includes(
        String(bill?.id ?? bill?.uuid)
      )
    );
  }, [filteredBills, selectedBillIds]);


  // ============================================================
  // STATUS COLOR
  // ============================================================

  const getStatusColor = (status) => {
      const colors = {
        CREATED: theme.colors.textSecondary,
        IN_TRANSIT: theme.colors.warning,
        ARRIVED: theme.colors.info,
        DELIVERED: theme.colors.success,
        RETURNED: theme.colors.danger,
      };

      return colors[status] || theme.colors.textSecondary;
    };


  // ============================================================
  // TRACKING NUMBER
  // ============================================================

  const getTracking = (bill) => {
    return isConnected
      ? bill?.tracking_no
      : bill?.uuid;
  };

  // ============================================================
  // BILL SELECTION
  // ============================================================

  const toggleBillSelection = (bill) => {
    const billId = String(bill?.id ?? bill?.uuid);

    setSelectedBillIds((previous) => {
      const exists = previous.includes(billId);

      const next = exists
        ? previous.filter((id) => id !== billId)
        : [...previous, billId];

      setSelectAll(
        filteredBills.length > 0 &&
          filteredBills.every((item) =>
            next.includes(
              String(item?.id ?? item?.uuid)
            )
          )
      );

      return next;
    });
  };


  const toggleSelectAll = () => {
    if (
      filteredBills.length > 0 &&
      filteredBills.every((bill) =>
        selectedBillIds.includes(
          String(bill?.id ?? bill?.uuid)
        )
      )
    ) {
      setSelectedBillIds([]);
      setSelectAll(false);
      return;
    }

    const ids = filteredBills
      .map((bill) =>
        String(bill?.id ?? bill?.uuid)
      )
      .filter(Boolean);

    setSelectedBillIds(ids);
    setSelectAll(ids.length > 0);
  };


  // ============================================================
  // DESTINY FILTER
  // ============================================================

  const toggleDestiny = (branchId) => {
    const id = String(branchId);

    setDestinyFilter((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  const clearDestinyFilter = () => {
    setDestinyFilter([]);
  };

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const updateBillStatus = async (bill, status) => {
    if (!bill?.id || updatingBillId === bill.id) {
      return
    }

    if (!isConnected) {
      Alert.alert(
        'Offline',
        'You must be online to update bill status.'
      )
      return
    }

    try {
      setUpdatingBillId(bill.id)
      setStatusModalVisible(false)

      const data = {
        status,
        from_type: 'sender',
      }

      const response = await updateReceivedBillByEmployeeAPI(
        bill.id,
        data,
        'sender'
      )

      if (
        response?.status === 200 ||
        response?.status === 201
      ) {
        // Update card immediately.
        setBills((previousBills) =>
          previousBills.map((item) =>
            item.id === bill.id
              ? {
                  ...item,
                  status,
                }
              : item
          )
        )

        // Refresh summary.
        await loadBills(false)

        Alert.alert(
          'Success',
          `${bill.tracking_no || getTracking(bill)} status updated to ${
            STATUS_LABELS[status]
          }`
        )
      } else {
        Alert.alert(
          'Error',
          response?.data?.message ||
            'Status update failed.'
        )
      }
    } catch (error) {
      console.error(
        'Failed to update bill status:',
        error
      )

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Status update failed.'
      )
    } finally {
      setUpdatingBillId(null)
      setSelectedStatusBill(null)
    }
  }


  // ============================================================
  // STATUS PICKER
  // ============================================================

  const openStatusPicker = (bill) => {
    if (!isConnected) {
      Alert.alert(
        'Offline',
        'You must be online to update bill status.'
      )
      return
    }

    setSelectedStatusBill(bill)
    setStatusModalVisible(true)
  }


  // ============================================================
  // OPEN BILL
  // ============================================================

  const openBill = (bill) => {
    const tracking = getTracking(bill);

    navigation.navigate('DetailBill', {
      trackingNo: tracking,
    });
  };

  // ============================================================
  // PRINT BILL
  // ============================================================

  const printBill = (bill) => {
    const tracking = getTracking(bill);

    navigation.navigate('DetailBill', {
      trackingNo: tracking,
      bill,
    });
  };

  // ============================================================
  // FINGERPRINT / PRINT
  // ============================================================

  const fingerprintPrint = (bill) => {
    const tracking = getTracking(bill);

    navigation.navigate('DetailBill', {
      trackingNo: tracking,
      bill,
    });
  };

  // ============================================================
  // QR CODE
  // ============================================================

  const showQrCode = (bill) => {
    const tracking = getTracking(bill);

    const url =
      `${END_POINT}` +
      `/bills/print/${tracking}`;

    setTrackingNo(tracking);
    setTrackingUrl(url);
    setQrModalVisible(true);
  };

  // ============================================================
  // SMS
  // ============================================================

  const sendMessagesToSelectedBills = async (
    type = 'both'
  ) => {
    if (!selectedBills.length) {
      Alert.alert(
        'Messages',
        'Please select at least one bill.'
      );
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'Offline',
        'You must be online to send SMS.'
      );
      return;
    }

    try {
      setSendingMessages(true);
      setSmsType(type);

      const billIds = selectedBills
        .map((bill) => bill?.id)
        .filter(Boolean);

      let response;

      if (type === 'sender') {
        response =
          await sendSenderSmsBulkAPI(billIds);
      } else if (type === 'consignee') {
        response =
          await sendConsigneeSmsBulkAPI(billIds);
      } else {
        response =
          await sendBothSmsBulkAPI(billIds);
      }

      const data = response?.data;

      if (
        response?.status === 200 ||
        response?.status === 201
      ) {
        Alert.alert(
          'Messages',
          data?.message ||
            `Messages processed for ${billIds.length} selected bill(s).`
        );

        setSelectedBillIds([]);
        setSelectAll(false);

      } else {
        Alert.alert(
          'Messages',
          data?.message ||
            'Failed to send messages.'
        );
      }
    } catch (error) {
      console.error(
        'Failed to send messages:',
        error
      );

      Alert.alert(
        'Messages',
        error?.response?.data?.message ||
          'Failed to send messages.'
      );
    } finally {
      setSendingMessages(false);
      setSmsType('');
    }
  };

  // ============================================================
  // SELECTED BILLS PRINT
  // ============================================================

  const openSelectedBillsPrint = () => {
    if (!selectedBills.length) {
      Alert.alert(
        'Print',
        'Please select at least one bill.'
      );
      return;
    }

    navigation.navigate(
      'SelectedBillsPrint',
      {
        bills: selectedBills,
        company: companyData,
      }
    );
  };

  // ============================================================
  // BILL CARD
  // ============================================================

  const renderBillItem = ({ item }) => {
  const tracking = getTracking(item);

  const isSelected = selectedBillIds.includes(
    String(item?.id ?? item?.uuid)
  );

  const sender = isConnected
    ? item?.sender_name
    : item?.sender?.name;

  const consignee = isConnected
    ? item?.consignee_name
    : item?.consignee?.name;

  const statusStyle =
    STATUS_COLORS[item?.status] || STATUS_COLORS.CREATED;

  const statusLabel =
    STATUS_LABELS[item?.status] ||
    item?.status ||
    'Created';

  const amount = Number(
    item?.amount_received || 0
  ).toFixed(2);

  const createdDate = item?.created_at
    ? format(
        new Date(item.created_at),
        'MMM dd, yyyy'
      )
    : '-';

  return (
    <View
      style={[
        styles.billCard,
        isSelected && styles.selectedBillCard,
      ]}
    >
      {/* TOP ACCENT */}
      <View
        style={[
          styles.cardAccent,
          {
            backgroundColor: statusStyle.color,
          },
        ]}
      />

      {/* HEADER */}
      <View style={styles.modernCardHeader}>
        <View style={styles.trackingSection}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.modernCheckbox,
              isSelected && styles.modernCheckboxSelected,
            ]}
            onPress={() => toggleBillSelection(item)}
          >
            {isSelected && (
              <Ionicons
                name="checkmark"
                size={14}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openBill(item)}
            style={styles.trackingInfo}
          >
            <Text style={styles.trackingCaption}>
              TRACKING NUMBER
            </Text>

            <Text
              style={styles.modernTrackingNo}
              numberOfLines={1}
            >
              {tracking}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          disabled={updatingBillId === item.id}
          style={[
            styles.modernStatusBadge,
            {
              backgroundColor: statusStyle.background,
              borderColor: `${statusStyle.color}35`,
            },
          ]}
          onPress={() => openStatusPicker(item)}
        >
          {updatingBillId === item.id ? (
            <ActivityIndicator
              size="small"
              color={statusStyle.color}
            />
          ) : (
            <>
              <View
                style={[
                  styles.modernStatusDot,
                  {
                    backgroundColor: statusStyle.color,
                  },
                ]}
              />

              <Text
                style={[
                  styles.modernStatusText,
                  {
                    color: statusStyle.color,
                  },
                ]}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>

              <Ionicons
                name="chevron-down"
                size={12}
                color={statusStyle.color}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ROUTE */}
      <View style={styles.routeSection}>
        <View style={styles.routeTimeline}>
          <View
            style={[
              styles.routeDot,
              {
                backgroundColor:
                  theme.colors.primary,
              },
            ]}
          />

          <View style={styles.routeLine} />

          <View
            style={[
              styles.routeDot,
              {
                backgroundColor:
                  statusStyle.color,
              },
            ]}
          />
        </View>

        <View style={styles.routeContent}>
          {/* SENDER */}
          <View style={styles.routeRow}>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>
                SENDER
              </Text>

              <Text
                style={styles.routeName}
                numberOfLines={1}
              >
                {sender || '-'}
              </Text>
            </View>

            <Ionicons
              name="person-outline"
              size={17}
              color={theme.colors.textMuted}
            />
          </View>

          {/* DESTINATION */}
          <View style={styles.destinationRow}>
            <View style={styles.destinationBadge}>
              <Ionicons
                name="location-outline"
                size={13}
                color={theme.colors.primary}
              />

              <Text
                style={styles.destinationText}
                numberOfLines={1}
              >
                {item?.destiny_branch?.name ||
                  'Destination'}
              </Text>
            </View>
          </View>

          {/* CONSIGNEE */}
          <View style={styles.routeRow}>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>
                CONSIGNEE
              </Text>

              <Text
                style={styles.routeName}
                numberOfLines={1}
              >
                {consignee || '-'}
              </Text>
            </View>

            <Ionicons
              name="person-outline"
              size={17}
              color={theme.colors.textMuted}
            />
          </View>
        </View>
      </View>

      {/* FINANCIAL INFO */}
      <View style={styles.financialSection}>
        <View>
          <Text style={styles.amountLabel}>
            AMOUNT RECEIVED
          </Text>

          <Text style={styles.modernAmount}>
            ETB {amount}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateIconContainer}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={theme.colors.textSecondary}
            />
          </View>

          <View>
            <Text style={styles.amountLabel}>
              CREATED
            </Text>

            <Text style={styles.modernDate}>
              {createdDate}
            </Text>
          </View>
        </View>
      </View>

      {/* ACTION BAR */}
      <View style={styles.modernActionRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.modernActionButton}
          onPress={() => printBill(item)}
        >
          <Ionicons
            name="print-outline"
            size={18}
            color={theme.colors.textSecondary}
          />

          <Text style={styles.modernActionText}>
            Print
          </Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.modernActionButton}
          onPress={() => fingerprintPrint(item)}
        >
          <Ionicons
            name="finger-print-outline"
            size={18}
            color={theme.colors.textSecondary}
          />

          <Text style={styles.modernActionText}>
            Fingerprint
          </Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.modernActionButton}
          onPress={() => showQrCode(item)}
        >
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={theme.colors.textSecondary}
          />

          <Text style={styles.modernActionText}>
            QR
          </Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.modernActionButton}
          onPress={() => openBill(item)}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={theme.colors.primary}
          />

          <Text
            style={[
              styles.modernActionText,
              {
                color: theme.colors.primary,
              },
            ]}
          >
            View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};



  // ============================================================
  // HEADER
  // ============================================================

  const ListHeader = () => (
    <>
      {/* NETWORK */}
      <View
        style={[
          styles.networkBanner,
          {
            backgroundColor: isConnected
              ? '#e8f5e9'
              : '#ffebee',
          },
        ]}
      >
        <View
          style={[
            styles.networkDot,
            {
              backgroundColor: isConnected
                ? '#28a745'
                : '#dc3545',
            },
          ]}
        />

        <Text
          style={[
            styles.networkText,
            {
              color: isConnected
                ? '#218838'
                : '#c82333',
            },
          ]}
        >
          {isConnected
            ? 'Online'
            : 'Offline mode'}
        </Text>
      </View>

      {/* SUMMARY */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryScroll}
        contentContainerStyle={
          styles.summaryContainer
        }
      >
        <View
          style={[
            styles.summaryCard,
            {
              borderLeftColor: '#007bff',
            },
          ]}
        >
          <Text style={styles.summaryIcon}>
            🚚
          </Text>

          <Text style={styles.summaryVal}>
            {summary?.total_bills || 0}
          </Text>

          <Text style={styles.summaryLabel}>
            Total Bills
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              borderLeftColor: '#28a745',
            },
          ]}
        >
          <Text style={styles.summaryIcon}>
            💰
          </Text>

          <Text style={styles.summaryVal}>
            ETB{' '}
            {Number(
              summary?.total_revenue || 0
            ).toFixed(2)}
          </Text>

          <Text style={styles.summaryLabel}>
            Total Revenue
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              borderLeftColor: '#ffc107',
            },
          ]}
        >
          <Text style={styles.summaryIcon}>
            ✈️
          </Text>

          <Text style={styles.summaryVal}>
            {summary?.in_transit || 0}
          </Text>

          <Text style={styles.summaryLabel}>
            In Transit
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              borderLeftColor: '#17a2b8',
            },
          ]}
        >
          <Text style={styles.summaryIcon}>
            ✓
          </Text>

          <Text style={styles.summaryVal}>
            {summary?.delivered || 0}
          </Text>

          <Text style={styles.summaryLabel}>
            Delivered
          </Text>
        </View>
      </ScrollView>

      {/* FILTERS */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>
          Bills Report
        </Text>

        {/* SEARCH */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search tracking, sender, consignee..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={()=>{
            loadBills(true)
          }}
        />

        {/* DATE FILTERS */}
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

        {/* STATUS */}
        <Text style={styles.filterLabel}>
          Status
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statusFilterButton}
          onPress={() => {
            setSelectedStatusBill(null)
            setStatusModalVisible(true)
          }}
        >
          <View style={styles.statusFilterLeft}>
            <Ionicons
              name="funnel-outline"
              size={18}
              color={theme.colors.primary}
            />

            <Text
              style={styles.statusFilterText}
              numberOfLines={1}
            >
              {statusFilter
                ? STATUS_LABELS[statusFilter]
                : 'All Status'}
            </Text>
          </View>

          <Ionicons
            name="chevron-down"
            size={17}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>


        {/* DESTINY */}
        <Text style={styles.filterLabel}>
          Destiny Branch
        </Text>

        <TouchableOpacity
          style={styles.destinySelector}
          onPress={() =>
            setDestinyModalVisible(true)
          }
        >
          <Text style={styles.destinySelectorText}>
            {destinyFilter.length
              ? `${destinyFilter.length} branch${
                  destinyFilter.length > 1
                    ? 'es'
                    : ''
                } selected`
              : `All ${destinyList.length} Destiny`}
          </Text>

          <Text style={styles.dropdownArrow}>
            ▼
          </Text>
        </TouchableOpacity>

        {/* SELECT ALL */}
        {filteredBills.length > 0 && (
          <TouchableOpacity
            style={styles.selectAllRow}
            onPress={toggleSelectAll}
          >
            <View
              style={[
                styles.checkbox,
                selectAll &&
                  styles.checkboxSelected,
              ]}
            >
              {selectAll && (
                <Text style={styles.checkMark}>
                  ✓
                </Text>
              )}
            </View>

            <Text style={styles.selectAllText}>
              Select All ({filteredBills.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SELECTED ACTIONS */}
      {selectedBills.length > 0 && (
        <View style={styles.selectedActions}>
          <Text style={styles.selectedTitle}>
            {selectedBills.length} bill
            {selectedBills.length > 1
              ? 's'
              : ''}{' '}
            selected
          </Text>

          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.printButton,
            ]}
            onPress={() => {
              if (!selectedBills.length) {
                Alert.alert(
                  'Print',
                  'Please select at least one bill.'
                );
                return;
              }

              setCustomCommissionVisible(true);
            }}
          >
            <Text style={styles.bulkButtonText}>
              🖨 Customs Commission Print
            </Text>
          </TouchableOpacity>


          <View style={styles.smsRow}>
            <TouchableOpacity
              style={[
                styles.bulkButton,
                styles.senderButton,
              ]}
              disabled={
                sendingMessages ||
                !isConnected
              }
              onPress={() =>
                sendMessagesToSelectedBills(
                  'sender'
                )
              }
            >
              <Text style={styles.bulkButtonText}>
                {sendingMessages &&
                smsType === 'sender'
                  ? 'Sending...'
                  : '📤 Sender SMS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bulkButton,
                styles.consigneeButton,
              ]}
              disabled={
                sendingMessages ||
                !isConnected
              }
              onPress={() =>
                sendMessagesToSelectedBills(
                  'consignee'
                )
              }
            >
              <Text style={styles.bulkButtonText}>
                {sendingMessages &&
                smsType === 'consignee'
                  ? 'Sending...'
                  : '📤 Consignee SMS'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.bothButton,
            ]}
            disabled={
              sendingMessages ||
              !isConnected
            }
            onPress={() =>
              sendMessagesToSelectedBills(
                'both'
              )
            }
          >
            <Text style={styles.bulkButtonText}>
              {sendingMessages &&
              smsType === 'both'
                ? 'Sending...'
                : '📤 Sender + Consignee'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBills}
        extraData={selectedBillIds}
        keyExtractor={(item, index) =>
          item?.id
            ? item.id.toString()
            : item?.uuid || index.toString()
        }
        renderItem={renderBillItem}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color="#007bff"
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>

              <Text style={styles.emptyText}>
                No bills found
              </Text>

              <Text style={styles.emptySubText}>
                Try changing your filters or date range.
              </Text>
            </View>
          )
        }
      />


      {/* NEW BILL */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('CreateBill')
        }
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ====================================================== */}
      {/* DESTINY MODAL */}
      {/* ====================================================== */}

      <Modal
        visible={destinyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setDestinyModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Destiny Branch
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setDestinyModalVisible(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearDestinyFilter}
            >
              <Text
                style={styles.clearButtonText}
              >
                Clear Selection
              </Text>
            </TouchableOpacity>

            <ScrollView>
              {destinyList.map((branch) => {
                const selected =
                  destinyFilter.includes(
                    String(branch.id)
                  );

                return (
                  <TouchableOpacity
                    key={branch.id}
                    style={styles.branchRow}
                    onPress={() =>
                      toggleDestiny(branch.id)
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
                        <Text
                          style={
                            styles.checkMark
                          }
                        >
                          ✓
                        </Text>
                      )}
                    </View>

                    <Text
                      style={styles.branchName}
                    >
                      {branch.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() =>
                setDestinyModalVisible(false)
              }
            >
              <Text style={styles.doneButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====================================================== */}
      {/* SELECTED BILLS MODAL */}
      {/* ====================================================== */}

      <Modal
        visible={selectedBillsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedBillsModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              styles.largeModal,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Selected Bills
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSelectedBillsModalVisible(
                    false
                  )
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedBills.map(
                (bill, index) => (
                  <View
                    key={
                      bill?.id ||
                      bill?.uuid ||
                      index
                    }
                    style={styles.printBillRow}
                  >
                    <Text
                      style={
                        styles.printTracking
                      }
                    >
                      {getTracking(bill)}
                    </Text>

                    <Text>
                      {isConnected
                        ? bill?.sender_name
                        : bill?.sender?.name}
                    </Text>

                    <Text>
                      ETB{' '}
                      {Number(
                        bill?.amount_received ||
                          0
                      ).toFixed(2)}
                    </Text>
                  </View>
                )
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setSelectedBillsModalVisible(
                  false
                );

                openSelectedBillsPrint();
              }}
            >
              <Text style={styles.doneButtonText}>
                Open Print Page
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====================================================== */}
      {/* QR MODAL */}
      {/* ====================================================== */}

      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setQrModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bill QR Code
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setQrModalVisible(false)
                }
              >
                <Text style={styles.closeText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <QRCode
                value={trackingUrl}
                size={260}
                backgroundColor="white"
                color="black"
              />

              <Text
                style={styles.qrTracking}
              >
                {trackingNo}
              </Text>

              <Text
                style={styles.qrUrl}
                numberOfLines={3}
              >
                {trackingUrl}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() =>
                setQrModalVisible(false)
              }
            >
              <Text style={styles.doneButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CUSTOMS COMMISSION PRINT */}

      <Modal
        visible={customCommissionVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCustomCommissionVisible(false)
        }
      >
        <CustomCommissionPrint
          // visible={customCommissionVisible}
          // onClose={() => setCustomCommissionVisible(false)}
          loading={false}
          error={null}
          bills={selectedBills}
          company={companyData}
          dayInput={format(new Date(), 'dd/MM/yyyy')}
        />

      </Modal>

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setStatusModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusBottomSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedStatusBill
                    ? 'Update Status'
                    : 'Filter by Status'}
                </Text>

                {selectedStatusBill && (
                  <Text style={styles.modalSubtitle}>
                    {getTracking(selectedStatusBill)}
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

            {/* ALL STATUS - FILTER ONLY */}
            {!selectedStatusBill && (
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
                        'rgba(0,216,255,0.10)',
                    },
                  ]}
                >
                  <Ionicons
                    name="apps-outline"
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.statusOptionText}>
                  All Status
                </Text>

                {!statusFilter && (
                  <Ionicons
                    name="checkmark-circle"
                    size={21}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}

            {STATUS_LIST.map((status) => {
              const statusStyle =
                STATUS_COLORS[status]

              const isSelected =
                selectedStatusBill
                  ? selectedStatusBill.status === status
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
                    if (selectedStatusBill) {
                      updateBillStatus(
                        selectedStatusBill,
                        status
                      )
                    } else {
                      setStatusFilter(status)
                      setStatusModalVisible(false)
                    }
                  }}
                >
                  <View
                    style={[
                      styles.statusOptionIcon,
                      {
                        backgroundColor:
                          statusStyle.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.largeStatusDot,
                        {
                          backgroundColor:
                            statusStyle.color,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color: isSelected
                          ? statusStyle.color
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
                      color={statusStyle.color}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </Modal>


    </View>
  );
};

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  listContent: {
    paddingBottom: 110,
  },

  // ============================================================
  // NETWORK
  // ============================================================

  networkBanner: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  networkDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  networkText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ============================================================
  // SUMMARY
  // ============================================================

  summaryScroll: {
    marginTop: theme.spacing.md,
  },

  summaryContainer: {
    paddingHorizontal: theme.spacing.md,
  },

  summaryCard: {
    backgroundColor: theme.colors.surface,
    width: 155,
    minHeight: 112,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  summaryIcon: {
    fontSize: 20,
    marginBottom: 5,
  },

  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },

  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },

  // ============================================================
  // FILTERS
  // ============================================================

  filterSection: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  filterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },

  searchInput: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 46,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },

  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  dateBox: {
    flex: 1,
  },

  dateInput: {
    height: 46,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
  },

  pickerWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },

  picker: {
    height: 50,
    color: theme.colors.text,
  },

  destinySelector: {
    height: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  destinySelectorText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },

  dropdownArrow: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  // ============================================================
  // CHECKBOX
  // ============================================================

  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },

  selectAllText: {
    marginLeft: 9,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },

  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  checkMark: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  // ============================================================
  // BULK ACTIONS
  // ============================================================

  selectedActions: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  selectedTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },

  smsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  bulkButton: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  bulkButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 12,
  },

  printButton: {
    backgroundColor: theme.colors.primary,
  },

  senderButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
  },

  consigneeButton: {
    flex: 1,
    backgroundColor: theme.colors.info,
  },

  bothButton: {
    backgroundColor: theme.colors.primaryDark,
  },

  // ============================================================
  // BILL CARD
  // ============================================================

  billCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    borderWidth: .5,
    borderColor: theme.colors.border,
  },

  selectedBillCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  cardHeader: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  trackingNo: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
    marginLeft: 9,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.round,
    maxWidth: 120,
  },

  statusText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  cardBody: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },

  cardLabel: {
    width: 85,
    fontSize: 13,
    color: theme.colors.textMuted,
  },

  cardValue: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },

  amount: {
    color: theme.colors.success,
    fontWeight: '800',
    fontSize: 14,
  },

  date: {
    color: theme.colors.textMuted,
    fontSize: 12,
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

  // ============================================================
  // CARD ACTIONS
  // ============================================================

  actionRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.divider,
  },

  actionIcon: {
    fontSize: 17,
    marginBottom: 3,
  },

  actionText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },

  // ============================================================
  // LOADING / EMPTY
  // ============================================================

  loader: {
    marginTop: 50,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.xl,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },

  emptySubText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 5,
    textAlign: 'center',
  },

  // ============================================================
  // FAB
  // ============================================================

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 6,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  fabText: {
    color: theme.colors.white,
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '300',
  },

  // ============================================================
  // MODALS
  // ============================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
    padding: theme.spacing.lg,
  },

  largeModal: {
    height: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.text,
  },

  closeText: {
    fontSize: 21,
    color: theme.colors.textSecondary,
    padding: 5,
  },

  clearButton: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.md,
    padding: 11,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  clearButtonText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },

  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  branchName: {
    marginLeft: 10,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },

  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },

  doneButtonText: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 15,
  },

  printBillRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  printTracking: {
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: 4,
  },

  // ============================================================
  // QR
  // ============================================================

  qrModal: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },

  qrContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },

  qrTracking: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },

  qrUrl: {
    marginTop: 7,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  statusFilterButton: {
  height: 46,
  borderRadius: theme.radius.md,
  backgroundColor: theme.colors.surfaceSecondary,
  borderWidth: 1,
  borderColor: theme.colors.border,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 13,
  marginBottom: theme.spacing.md,
},

statusFilterLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},

statusFilterText: {
  color: theme.colors.text,
  fontSize: 13,
  fontWeight: '600',
  marginLeft: 9,
},

statusBadge: {
  minHeight: 31,
  maxWidth: 130,
  borderRadius: theme.radius.round,
  borderWidth: 1,
  paddingHorizontal: 9,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},

statusDot: {
  width: 7,
  height: 7,
  borderRadius: 4,
},

statusText: {
  fontSize: 10,
  fontWeight: '700',
  flexShrink: 1,
},

statusBottomSheet: {
  backgroundColor: theme.colors.surface,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingHorizontal: 20,
  paddingTop: 10,
  paddingBottom: 25,
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
// ============================================================
// MODERN BILL CARD
// ============================================================

billCard: {
  backgroundColor: theme.colors.surface,
  marginHorizontal: theme.spacing.md,
  marginTop: 14,
  borderRadius: 20,
  overflow: 'hidden',

  borderWidth: 1,
  borderColor: 'rgba(148, 163, 184, 0.18)',

  elevation: 3,

  shadowColor: '#0F172A',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },
},

selectedBillCard: {
  borderWidth: 1.5,
  borderColor: theme.colors.primary,
  shadowColor: theme.colors.primary,
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 5,
},

cardAccent: {
  height: 3,
  width: '100%',
},

// ============================================================
// HEADER
// ============================================================

modernCardHeader: {
  paddingHorizontal: 16,
  paddingTop: 15,
  paddingBottom: 13,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

trackingSection: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginRight: 10,
},

modernCheckbox: {
  width: 22,
  height: 22,
  borderRadius: 7,

  borderWidth: 1.5,
  borderColor: '#CBD5E1',

  alignItems: 'center',
  justifyContent: 'center',

  backgroundColor: theme.colors.surface,
},

modernCheckboxSelected: {
  backgroundColor: theme.colors.primary,
  borderColor: theme.colors.primary,
},

trackingInfo: {
  marginLeft: 10,
  flex: 1,
},

trackingCaption: {
  fontSize: 8,
  fontWeight: '800',
  letterSpacing: 0.8,
  color: theme.colors.textMuted,
  marginBottom: 2,
},

modernTrackingNo: {
  fontSize: 16,
  fontWeight: '900',
  color: theme.colors.primary,
  letterSpacing: 0.2,
},

modernStatusBadge: {
  minHeight: 31,
  maxWidth: 125,

  borderRadius: 20,
  borderWidth: 1,

  paddingHorizontal: 9,

  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},

modernStatusDot: {
  width: 7,
  height: 7,
  borderRadius: 4,
},

modernStatusText: {
  fontSize: 10,
  fontWeight: '800',
  flexShrink: 1,
},

// ============================================================
// ROUTE
// ============================================================

routeSection: {
  paddingHorizontal: 16,
  paddingBottom: 15,

  flexDirection: 'row',
},

routeTimeline: {
  width: 20,
  alignItems: 'center',
  paddingTop: 5,
},

routeDot: {
  width: 9,
  height: 9,
  borderRadius: 5,

  borderWidth: 2,
  borderColor: theme.colors.surface,
},

routeLine: {
  width: 1.5,
  flex: 1,
  minHeight: 32,

  backgroundColor: '#CBD5E1',
  marginVertical: 2,
},

routeContent: {
  flex: 1,
  marginLeft: 8,
},

routeRow: {
  minHeight: 36,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

routeTextContainer: {
  flex: 1,
  marginRight: 10,
},

routeLabel: {
  fontSize: 8,
  fontWeight: '800',
  letterSpacing: 0.8,
  color: theme.colors.textMuted,
  marginBottom: 2,
},

routeName: {
  fontSize: 13,
  fontWeight: '700',
  color: theme.colors.text,
},

destinationRow: {
  paddingVertical: 4,
},

destinationBadge: {
  alignSelf: 'flex-start',

  flexDirection: 'row',
  alignItems: 'center',

  backgroundColor: 'rgba(0, 216, 255, 0.08)',

  paddingHorizontal: 9,
  paddingVertical: 5,

  borderRadius: 10,
},

destinationText: {
  marginLeft: 4,

  fontSize: 10,
  fontWeight: '800',

  color: theme.colors.primary,
},

// ============================================================
// FINANCIAL SECTION
// ============================================================

financialSection: {
  marginHorizontal: 16,

  borderTopWidth: 1,
  borderTopColor: theme.colors.divider,

  paddingVertical: 13,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

amountLabel: {
  fontSize: 8,
  fontWeight: '800',
  letterSpacing: 0.7,
  color: theme.colors.textMuted,
  marginBottom: 3,
},

modernAmount: {
  fontSize: 17,
  fontWeight: '900',
  color: theme.colors.success,
},

dateContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},

dateIconContainer: {
  width: 30,
  height: 30,

  borderRadius: 9,

  backgroundColor:
    theme.colors.surfaceSecondary,

  alignItems: 'center',
  justifyContent: 'center',

  marginRight: 8,
},

modernDate: {
  fontSize: 11,
  fontWeight: '700',
  color: theme.colors.text,
},

// ============================================================
// ACTION BAR
// ============================================================

modernActionRow: {
  minHeight: 49,

  borderTopWidth: 1,
  borderTopColor: theme.colors.divider,

  backgroundColor:
    theme.colors.surfaceSecondary,

  flexDirection: 'row',
  alignItems: 'stretch',
},

modernActionButton: {
  flex: 1,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  gap: 5,
},

modernActionText: {
  fontSize: 10,
  fontWeight: '800',
  color: theme.colors.textSecondary,
},

actionDivider: {
  width: 1,
  marginVertical: 10,
  backgroundColor: theme.colors.divider,
},

});


export default EmployeeBillsScreen;
