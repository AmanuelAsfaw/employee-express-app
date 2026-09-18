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
  Alert,
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

// If you already export this from another mobile file,
// import it from there instead.
const status_list = [
  'CREATED',
  'IN_TRANSIT',
  'ARRIVED',
  'DELIVERED',
  'RETURNED',
];

const EmployeeBillsScreen = () => {
  const navigation = useNavigation();

  // ============================================================
  // DATA
  // ============================================================

  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const [selectedBills, setSelectedBills] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // ============================================================
  // SMS
  // ============================================================

  const [sendingMessages, setSendingMessages] = useState(false);
  const [smsType, setSmsType] = useState('');

  // ============================================================
  // MODALS
  // ============================================================

  const [selectedBillsModalVisible, setSelectedBillsModalVisible] =
    useState(false);

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
    search,
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
    setSelectedBills((previous) => {
      const exists = previous.some(
        (item) => item?.id === bill?.id
      );

      const next = exists
        ? previous.filter(
            (item) => item?.id !== bill?.id
          )
        : [...previous, bill];

      setSelectAll(
        filteredBills.length > 0 &&
          next.length === filteredBills.length
      );

      return next;
    });
  };

  const toggleSelectAll = () => {
    if (
      selectedBills.length === filteredBills.length &&
      filteredBills.length > 0
    ) {
      setSelectedBills([]);
      setSelectAll(false);
    } else {
      setSelectedBills(filteredBills);
      setSelectAll(true);
    }
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

  const updateBillStatus = async (id, status) => {
    if (!isConnected) {
      Alert.alert(
        'Offline',
        'You must be online to update bill status.'
      );
      return;
    }

    try {
      const data = {
        status,
        from_type: 'sender',
      };

      const response =
        await updateReceivedBillByEmployeeAPI(
          id,
          data,
          'sender'
        );

      if (
        response?.status === 200 ||
        response?.status === 201
      ) {
        Alert.alert(
          'Success',
          `${
            response?.data?.tracking_no || ''
          } status updated to ${status.replace(
            '_',
            ' '
          )}`
        );

        loadBills(false);
      } else {
        Alert.alert(
          'Error',
          response?.data?.message ||
            'Status update failed.'
        );
      }
    } catch (error) {
      console.error(
        'Failed to update bill status:',
        error
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Status update failed.'
      );
    }
  };

  // ============================================================
  // STATUS PICKER
  // ============================================================

  const openStatusPicker = (bill) => {
    if (!isConnected) {
      Alert.alert(
        'Offline',
        'You must be online to update bill status.'
      );
      return;
    }

    Alert.alert(
      'Update Status',
      getTracking(bill),
      [
        ...status_list.map((status) => ({
          text: status.replace('_', ' '),
          onPress: () =>
            updateBillStatus(
              bill.id,
              status
            ),
        })),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

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

    navigation.navigate('BillPrint', {
      trackingNo: tracking,
      bill,
    });
  };

  // ============================================================
  // FINGERPRINT / PRINT
  // ============================================================

  const fingerprintPrint = (bill) => {
    const tracking = getTracking(bill);

    navigation.navigate('BillFingerprintPrint', {
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

        setSelectedBills([]);
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

  const renderBillItem = ({
    item,
  }) => {
    const tracking = getTracking(item);

    const isSelected = selectedBills.some(
      (bill) => bill?.id === item?.id
    );

    const sender = isConnected
      ? item?.sender_name
      : item?.sender?.name;

    const consignee = isConnected
      ? item?.consignee_name
      : item?.consignee?.name;

    return (
      <View
        style={[
          styles.billCard,
          isSelected && styles.selectedBillCard,
        ]}
      >
        {/* CARD HEADER */}
        <View style={styles.cardHeader}>
          <View style={styles.trackingContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                isSelected &&
                  styles.checkboxSelected,
              ]}
              onPress={() =>
                toggleBillSelection(item)
              }
            >
              {isSelected && (
                <Text style={styles.checkMark}>
                  ✓
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openBill(item)}
            >
              <Text style={styles.trackingNo}>
                {tracking}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  getStatusColor(item.status),
              },
            ]}
            onPress={() =>
              openStatusPicker(item)
            }
          >
            <Text style={styles.statusText}>
              {item?.status?.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BODY */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.cardLabel}>
              Sender
            </Text>
            <Text
              style={styles.cardValue}
              numberOfLines={1}
            >
              {sender || '-'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.cardLabel}>
              Consignee
            </Text>
            <Text
              style={styles.cardValue}
              numberOfLines={1}
            >
              {consignee || '-'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.cardLabel}>
              Destiny
            </Text>
            <Text
              style={styles.cardValue}
              numberOfLines={1}
            >
              {item?.destiny_branch?.name || '-'}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.amount}>
              ETB{' '}
              {Number(
                item?.amount_received || 0
              ).toFixed(2)}
            </Text>

            <Text style={styles.date}>
              {item?.created_at
                ? format(
                    new Date(item.created_at),
                    'MMM dd, yyyy'
                  )
                : '-'}
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => printBill(item)}
          >
            <Text style={styles.actionIcon}>
              🖨
            </Text>
            <Text style={styles.actionText}>
              Print
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              fingerprintPrint(item)
            }
          >
            <Text style={styles.actionIcon}>
              ☝
            </Text>
            <Text style={styles.actionText}>
              Fingerprint
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showQrCode(item)}
          >
            <Text style={styles.actionIcon}>
              ▣
            </Text>
            <Text style={styles.actionText}>
              QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openBill(item)}
          >
            <Text style={styles.actionIcon}>
              👁
            </Text>
            <Text style={styles.actionText}>
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

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value)
            }
            style={styles.picker}
          >
            <Picker.Item
              label="All Status"
              value=""
            />

            <Picker.Item
              label="Created"
              value="CREATED"
            />

            <Picker.Item
              label="In Transit"
              value="IN_TRANSIT"
            />

            <Picker.Item
              label="Arrived"
              value="ARRIVED"
            />

            <Picker.Item
              label="Delivered"
              value="DELIVERED"
            />

            <Picker.Item
              label="Returned"
              value="RETURNED"
            />
          </Picker>
        </View>

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
            onPress={openSelectedBillsPrint}
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
        keyExtractor={(item, index) =>
          item?.id
            ? item.id.toString()
            : item?.uuid || index.toString()
        }
        renderItem={renderBillItem}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={
          styles.listContent
        }
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
              <Text style={styles.emptyIcon}>
                📦
              </Text>

              <Text style={styles.emptyText}>
                No bills found
              </Text>

              <Text
                style={styles.emptySubText}
              >
                Try changing your filters or
                date range.
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
});


export default EmployeeBillsScreen;
