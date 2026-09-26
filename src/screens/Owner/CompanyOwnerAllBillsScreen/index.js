// src/screens/Owner/CompanyOwnerAllBillsScreen/index.js
// src/screens/Owner/CompanyOwnerAllBillsScreen/index.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { format } from 'date-fns';

import { theme } from '../../../theme/theme';

import api from '../../../utils/axioServices';
import { END_POINT } from '../../../constants/urls';
import DateInput from '../../../components/DateInput';

// If these are needed by your mobile print implementation,
// import your mobile-compatible versions here.
// import RedirectToPrintModal from '../../../views/bills/AllBillPrintPages/RedirectToPrintModal';
// import SelectedBillsPrintPage from '../../../views/bills/AllBillPrintPages/SelectedBillsPrintPage';


const STATUS_CONFIG = {
  CREATED: {
    color: theme.colors.textSecondary,
    background: 'rgba(255,255,255,0.08)',
    icon: 'document-text-outline',
  },

  IN_TRANSIT: {
    color: theme.colors.warningLight,
    background: 'rgba(217,119,6,0.18)',
    icon: 'paper-plane-outline',
  },

  ARRIVED: {
    color: theme.colors.infoLight,
    background: 'rgba(8,145,178,0.18)',
    icon: 'location-outline',
  },

  DELIVERED: {
    color: theme.colors.successLight,
    background: 'rgba(22,163,74,0.18)',
    icon: 'checkmark-circle-outline',
  },

  RETURNED: {
    color: theme.colors.dangerLight,
    background: 'rgba(231,76,60,0.18)',
    icon: 'return-up-back-outline',
  },
};


const getStatusConfig = (status) => {
  return (
    STATUS_CONFIG[status] || {
      color: theme.colors.textSecondary,
      background: theme.colors.overlayMedium,
      icon: 'help-circle-outline',
    }
  );
};


const formatCurrency = (value) => {
  return `ETB ${Number(value || 0).toFixed(2)}`;
};


const getToday = () => {
  return format(new Date(), 'yyyy-MM-dd');
};


const getBillTracking = (bill) => {
  return bill?.tracking_no || bill?.uuid || '-';
};


const getSenderName = (bill) => {
  return (
    bill?.sender_name ||
    bill?.sender?.name ||
    'Walk-in Customer'
  );
};


const getConsigneeName = (bill) => {
  return (
    bill?.consignee_name ||
    bill?.consignee?.name ||
    '-'
  );
};


/* -------------------------------------------------------------------------- */
/* Filter Select                                                              */
/* -------------------------------------------------------------------------- */

const FilterSelect = ({
  label,
  value,
  placeholder,
  options,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(
    (item) => String(item.value) === String(value)
  );

  return (
    <>
      <View style={styles.filterWrapper}>
        <Text style={styles.filterLabel}>
          {label}
        </Text>

        <Pressable
          onPress={() => setVisible(true)}
          style={({ pressed }) => [
            styles.selectButton,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.selectText,
              !selectedOption && styles.selectPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </Text>

          <Ionicons
            name="chevron-down"
            size={17}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
          />

          <View style={styles.filterModal}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label}
              </Text>

              <Pressable
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.colors.text}
                />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item, index) =>
                `${item.value}-${index}`
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected =
                  String(item.value) === String(value);

                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setVisible(false);
                    }}
                    style={[
                      styles.optionItem,
                      selected &&
                        styles.optionItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};


/* -------------------------------------------------------------------------- */
/* Summary Card                                                               */
/* -------------------------------------------------------------------------- */

const SummaryCard = ({
  title,
  value,
  icon,
  colors,
}) => {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={colors.icon}
        />
      </View>

      <Text style={styles.summaryTitle}>
        {title}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
};


/* -------------------------------------------------------------------------- */
/* Bill Card                                                                  */
/* -------------------------------------------------------------------------- */

const BillCard = ({
  bill,
  isSelected,
  onSelect,
  onPrint,
  onFingerprint,
  onQr,
}) => {
  const status = getStatusConfig(bill.status);

  const tracking = getBillTracking(bill);

  const sender = getSenderName(bill);

  const consignee = getConsigneeName(bill);

  const branch =
    bill?.branch?.name || '-';

  const destiny =
    bill?.destiny_branch?.name || '-';

  const cashier =
    bill?.created_by_name || '-';

  const date = bill?.created_at
    ? new Date(
        bill.created_at
      ).toLocaleDateString()
    : '-';

  return (
    <View
      style={[
        styles.billCard,
        isSelected && styles.billCardSelected,
      ]}
    >
      {/* Top */}
      <View style={styles.billTop}>
        <Pressable
          onPress={() => onSelect(bill)}
          style={styles.checkboxButton}
        >
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
            ]}
          >
            {isSelected && (
              <Ionicons
                name="checkmark"
                size={15}
                color={theme.colors.background}
              />
            )}
          </View>
        </Pressable>

        <View style={styles.trackingContainer}>
          <Text style={styles.trackingLabel}>
            TRACKING
          </Text>

          <Text
            style={styles.trackingNumber}
            numberOfLines={1}
          >
            {tracking}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                status.background,
            },
          ]}
        >
          <Ionicons
            name={status.icon}
            size={12}
            color={status.color}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: status.color,
              },
            ]}
          >
            {String(
              bill.status || 'UNKNOWN'
            ).replaceAll('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Sender / Consignee */}
      <View style={styles.routeRow}>
        <View style={styles.personBlock}>
          <View style={styles.personIcon}>
            <Ionicons
              name="person-outline"
              size={16}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.personInfo}>
            <Text style={styles.fieldLabel}>
              SENDER
            </Text>

            <Text
              style={styles.fieldValue}
              numberOfLines={1}
            >
              {sender}
            </Text>
          </View>
        </View>

        <Ionicons
          name="arrow-forward"
          size={18}
          color={theme.colors.textMuted}
        />

        <View
          style={[
            styles.personBlock,
            {
              justifyContent: 'flex-end',
            },
          ]}
        >
          <View style={styles.personInfo}>
            <Text
              style={[
                styles.fieldLabel,
                {
                  textAlign: 'right',
                },
              ]}
            >
              CONSIGNEE
            </Text>

            <Text
              style={[
                styles.fieldValue,
                {
                  textAlign: 'right',
                },
              ]}
              numberOfLines={1}
            >
              {consignee}
            </Text>
          </View>

          <View style={styles.personIcon}>
            <Ionicons
              name="person-outline"
              size={16}
              color={theme.colors.purpleLight}
            />
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsGrid}>
        <DetailItem
          icon="business-outline"
          label="Branch"
          value={branch}
        />

        <DetailItem
          icon="location-outline"
          label="Destiny"
          value={destiny}
        />

        <DetailItem
          icon="cash-outline"
          label="Amount"
          value={formatCurrency(
            bill.amount_received
          )}
          highlight
        />

        <DetailItem
          icon="calendar-outline"
          label="Date"
          value={date}
        />

        <DetailItem
          icon="person-circle-outline"
          label="Cashier"
          value={cashier}
        />
      </View>

      {/* Actions */}
      <View style={styles.billActions}>
        <Pressable
          onPress={() => onPrint(bill)}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="print-outline"
            size={18}
            color={theme.colors.primary}
          />

          <Text style={styles.actionText}>
            Print
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFingerprint(bill)}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="finger-print-outline"
            size={18}
            color={theme.colors.purpleLight}
          />

          <Text
            style={[
              styles.actionText,
              {
                color: theme.colors.purpleLight,
              },
            ]}
          >
            Fingerprint
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onQr(bill)}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={theme.colors.cyanLight}
          />

          <Text
            style={[
              styles.actionText,
              {
                color: theme.colors.cyanLight,
              },
            ]}
          >
            QR
          </Text>
        </Pressable>
      </View>
    </View>
  );
};


/* -------------------------------------------------------------------------- */
/* Detail Item                                                                */
/* -------------------------------------------------------------------------- */

const DetailItem = ({
  icon,
  label,
  value,
  highlight,
}) => {
  return (
    <View style={styles.detailItem}>
      <Ionicons
        name={icon}
        size={14}
        color={
          highlight
            ? theme.colors.success
            : theme.colors.textMuted
        }
      />

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.detailValue,
            highlight && {
              color: theme.colors.successLight,
            },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};


/* -------------------------------------------------------------------------- */
/* Main Screen                                                                */
/* -------------------------------------------------------------------------- */

const CompanyOwnerAllBillsScreen = ({
  navigation,
}) => {
  const today = useMemo(
    () => getToday(),
    []
  );

  const [bills, setBills] = useState([]);
  const [summary, setSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [destinyFilter, setDestinyFilter] =
    useState('');

  const [
    originatedBranchFilter,
    setOriginatedBranchFilter,
  ] = useState('');

  const [senderFilter, setSenderFilter] =
    useState('');

  const [
    consigneeFilter,
    setConsigneeFilter,
  ] = useState('');

  const [destinyList, setDestinyList] =
    useState([]);

  const [
    originatedBranchList,
    setOriginatedBranchList,
  ] = useState([]);

  const [senderList, setSenderList] =
    useState([]);

  const [consigneeList, setConsigneeList] =
    useState([]);

  const [startDate, setStartDate] =
    useState(today);

  const [endDate, setEndDate] =
    useState(today);

  const [selectedBills, setSelectedBills] =
    useState([]);

  const [companyData, setCompanyData] =
    useState(null);

  const [isConnected, setIsConnected] =
    useState(true);

  const [qrModalVisible, setQrModalVisible] =
    useState(false);

  const [trackingNo, setTrackingNo] =
    useState(null);

  const [trackingUrl, setTrackingUrl] =
    useState('');

  const [selectedBillForPrint, setSelectedBillForPrint] =
    useState(null);

  const [printModalVisible, setPrintModalVisible] =
    useState(false);

  const [selectedBillsModalVisible, setSelectedBillsModalVisible] =
    useState(false);

  const [filtersVisible, setFiltersVisible] =
    useState(false);


  /* ---------------------------------------------------------------------- */
  /* Filtered bills                                                         */
  /* ---------------------------------------------------------------------- */

  const filteredBills = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return bills.filter((bill) => {
      const tracking =
        getBillTracking(bill).toLowerCase();

      const sender =
        getSenderName(bill).toLowerCase();

      const consignee =
        getConsigneeName(bill).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        tracking.includes(
          normalizedSearch
        ) ||
        sender.includes(
          normalizedSearch
        ) ||
        consignee.includes(
          normalizedSearch
        );

      const matchesStatus =
        !statusFilter ||
        bill.status === statusFilter;

      const matchesDestiny =
        !destinyFilter ||
        String(
          bill?.destiny_branch?.id
        ) === String(destinyFilter);

      const matchesOrigin =
        !originatedBranchFilter ||
        String(
          bill?.branch?.id
        ) === String(
          originatedBranchFilter
        );

      const matchesSender =
        !senderFilter ||
        String(
          bill?.sender?.id
        ) === String(senderFilter);

      const matchesConsignee =
        !consigneeFilter ||
        String(
          bill?.consignee?.id
        ) === String(consigneeFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDestiny &&
        matchesOrigin &&
        matchesSender &&
        matchesConsignee
      );
    });
  }, [
    bills,
    search,
    statusFilter,
    destinyFilter,
    originatedBranchFilter,
    senderFilter,
    consigneeFilter,
  ]);


  /* ---------------------------------------------------------------------- */
  /* Summary                                                                */
  /* ---------------------------------------------------------------------- */

  const calculatedSummary = useMemo(() => {
    const result = {
      created: 0,
      delivered: 0,
      in_transit: 0,
      arrived: 0,
      returned: 0,
      total_bills: filteredBills.length,
      total_revenue: 0,
    };

    filteredBills.forEach((bill) => {
      const status =
        bill?.status?.toLowerCase();

      if (status in result) {
        result[status] += 1;
      }

      result.total_revenue +=
        Number(
          bill?.amount_received
        ) || 0;
    });

    return result;
  }, [filteredBills]);


  /* ---------------------------------------------------------------------- */
  /* Load bills                                                             */
  /* ---------------------------------------------------------------------- */

  const loadBills = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        if (!isConnected) {
          /*
           * Add your offline database implementation here.
           *
           * Example:
           *
           * const offlineBills =
           *   await fetchEmployeeBillsData();
           *
           * setBills(offlineBills);
           */

          setLoading(false);
          setRefreshing(false);
          return;
        }

        const params =
          new URLSearchParams();

        if (search) {
          params.append(
            'search',
            search
          );
        }

        if (statusFilter) {
          params.append(
            'status',
            statusFilter
          );
        }

        if (startDate) {
          params.append(
            'start_date',
            startDate
          );
        }

        if (endDate) {
          params.append(
            'end_date',
            endDate
          );
        }

        const res = await api.get(
          `${END_POINT}/express-api/api/bills/report/?${params.toString()}`
        );

        const results =
          res.data?.results ||
          res.data ||
          [];

        setBills(results);

        setSummary(
          res.data?.summary || null
        );

        setCompanyData(
          res.data?.company || null
        );
      } catch (error) {
        console.error(
          'Failed to load bills',
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      isConnected,
      search,
      statusFilter,
      startDate,
      endDate,
    ]
  );


  /* ---------------------------------------------------------------------- */
  /* Load filters                                                           */
  /* ---------------------------------------------------------------------- */

  const loadFilters = useCallback(
    async () => {
      if (!isConnected) return;

      try {
        /*
         * We only need the reference APIs if you
         * want independent global sender/consignee
         * lists. The actual filter UI below uses
         * values extracted from the loaded bills,
         * just like your current filtering logic.
         */

        // Keep this here if other screens depend
        // on these reference datasets.

        await Promise.all([
          api.get(
            `${END_POINT}/express-api/api/senders/`
          ),
          api.get(
            `${END_POINT}/express-api/api/consignees/`
          ),
          api.get(
            `${END_POINT}/express-api/api/service-types/`
          ),
        ]);
      } catch (error) {
        console.error(
          'Failed to load filters',
          error
        );
      }
    },
    [isConnected]
  );


  /* ---------------------------------------------------------------------- */
  /* Extract filter lists                                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!bills.length) {
      setDestinyList([]);
      setOriginatedBranchList([]);
      setSenderList([]);
      setConsigneeList([]);
      return;
    }

    const destinations = Array.from(
      new Map(
        bills
          .filter(
            (bill) =>
              bill?.destiny_branch
          )
          .map((bill) => [
            bill.destiny_branch.id,
            bill.destiny_branch,
          ])
      ).values()
    );

    const branches = Array.from(
      new Map(
        bills
          .filter(
            (bill) => bill?.branch
          )
          .map((bill) => [
            bill.branch.id,
            bill.branch,
          ])
      ).values()
    );

    const senders = Array.from(
      new Map(
        bills
          .filter(
            (bill) => bill?.sender
          )
          .map((bill) => [
            bill.sender.id,
            bill.sender,
          ])
      ).values()
    );

    const consignees = Array.from(
      new Map(
        bills
          .filter(
            (bill) => bill?.consignee
          )
          .map((bill) => [
            bill.consignee.id,
            bill.consignee,
          ])
      ).values()
    );

    setDestinyList(
      destinations
    );

    setOriginatedBranchList(
      branches
    );

    setSenderList(
      senders
    );

    setConsigneeList(
      consignees
    );
  }, [bills]);


  /* ---------------------------------------------------------------------- */
  /* Initial loading                                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    loadBills();
    loadFilters();
  }, [isConnected]);


  /* ---------------------------------------------------------------------- */
  /* Reload when filters change                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBills();
    }, 400);

    return () =>
      clearTimeout(timer);
  }, [
    search,
    statusFilter,
    startDate,
    endDate,
  ]);


  /* ---------------------------------------------------------------------- */
  /* Selection                                                              */
  /* ---------------------------------------------------------------------- */

  const toggleBillSelection = (
    bill
  ) => {
    setSelectedBills((previous) => {
      const exists = previous.some(
        (item) =>
          item.id === bill.id
      );

      if (exists) {
        return previous.filter(
          (item) =>
            item.id !== bill.id
        );
      }

      return [
        ...previous,
        bill,
      ];
    });
  };


  const toggleSelectAll = () => {
    if (
      selectedBills.length ===
      filteredBills.length
    ) {
      setSelectedBills([]);
      return;
    }

    setSelectedBills([
      ...filteredBills,
    ]);
  };


  /* ---------------------------------------------------------------------- */
  /* Print                                                                  */
  /* ---------------------------------------------------------------------- */

  const printBill = (bill) => {
    const tracking =
      getBillTracking(bill);
      navigation.navigate('OwnerBillDetail', {
        trackingNo: bill.tracking_no,
        mode: 'print',
      })
    return
    setTrackingNo(tracking);

    /*
     * On web this was:
     *
     * window.open(`/bill-detail/${tracking}`)
     *
     * React Native does not have window.open.
     *
     * The mobile equivalent should navigate to
     * a BillDetail/Print screen or open a native
     * print flow.
     */

    setSelectedBillForPrint(
      bill
    );

    setPrintModalVisible(true);
  };


  const fingerprintPrint = (
    bill
  ) => {
    const tracking =
      getBillTracking(bill);

    setTrackingNo(tracking);

    setSelectedBillForPrint(
      bill
    );

    setPrintModalVisible(true);
  };


  /* ---------------------------------------------------------------------- */
  /* QR                                                                    */
  /* ---------------------------------------------------------------------- */

  const openQr = (bill) => {
    const tracking =
      getBillTracking(bill);

    /*
     * window.location.origin does not exist
     * in React Native.
     *
     * Replace this with the public URL of your
     * tracking application/API.
     */

    const baseUrl =
      END_POINT ||
      'https://your-domain.com';

    const url =
      `${baseUrl}/bills/print/${tracking}`;

    setTrackingNo(tracking);
    setTrackingUrl(url);
    setQrModalVisible(true);
  };


  /* ---------------------------------------------------------------------- */
  /* Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  const createNewBill = () => {
    navigation?.navigate?.(
      'CreateBill'
    );
  };


  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loadingContainer}
        >
          <View
            style={styles.loadingIcon}
          >
            <Ionicons
              name="receipt-outline"
              size={35}
              color={
                theme.colors.primary
              }
            />
          </View>

          <ActivityIndicator
            size="large"
            color={
              theme.colors.primary
            }
            style={{
              marginTop: 20,
            }}
          />

          <Text
            style={styles.loadingText}
          >
            Loading bills...
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  /* ---------------------------------------------------------------------- */
  /* Filter options                                                         */
  /* ---------------------------------------------------------------------- */

  const statusOptions = [
    {
      value: '',
      label: 'All Status',
    },
    {
      value: 'CREATED',
      label: 'Created',
    },
    {
      value: 'IN_TRANSIT',
      label: 'In Transit',
    },
    {
      value: 'ARRIVED',
      label: 'Arrived',
    },
    {
      value: 'DELIVERED',
      label: 'Delivered',
    },
    {
      value: 'RETURNED',
      label: 'Returned',
    },
  ];

  const destinyOptions = [
    {
      value: '',
      label: `All ${destinyList.length} Destinations`,
    },
    ...destinyList.map(
      (item) => ({
        value: item.id,
        label: item.name,
      })
    ),
  ];

  const branchOptions = [
    {
      value: '',
      label: `All ${originatedBranchList.length} Branches`,
    },
    ...originatedBranchList.map(
      (item) => ({
        value: item.id,
        label: item.name,
      })
    ),
  ];

  const senderOptions = [
    {
      value: '',
      label: `All ${senderList.length} Senders`,
    },
    ...senderList.map(
      (item) => ({
        value: item.id,
        label: item.name,
      })
    ),
  ];

  const consigneeOptions = [
    {
      value: '',
      label: `All ${consigneeList.length} Consignees`,
    },
    ...consigneeList.map(
      (item) => ({
        value: item.id,
        label: item.name,
      })
    ),
  ];


  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <FlatList
        data={filteredBills}
        keyExtractor={(item, index) =>
          String(
            item.id ||
              item.uuid ||
              index
          )
        }
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadBills(true)
            }
            tintColor={
              theme.colors.primary
            }
            colors={[
              theme.colors.primary,
            ]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ---------------------------------------------------------- */}
            {/* Header                                                     */}
            {/* ---------------------------------------------------------- */}

            <View
              style={styles.header}
            >
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.pageTitle
                  }
                >
                  All Bills
                </Text>

                <Text
                  style={
                    styles.pageSubtitle
                  }
                >
                  Manage and track all
                  shipments
                </Text>
              </View>

              <View
                style={[
                  styles.connectionBadge,
                  {
                    backgroundColor:
                      isConnected
                        ? 'rgba(22,163,74,0.15)'
                        : 'rgba(231,76,60,0.15)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.connectionDot,
                    {
                      backgroundColor:
                        isConnected
                          ? theme
                              .colors
                              .success
                          : theme
                              .colors
                              .danger,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.connectionText,
                    {
                      color:
                        isConnected
                          ? theme
                              .colors
                              .successLight
                          : theme
                              .colors
                              .dangerLight,
                    },
                  ]}
                >
                  {isConnected
                    ? 'Online'
                    : 'Offline'}
                </Text>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* Summary                                                     */}
            {/* ---------------------------------------------------------- */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.summaryScroll
              }
            >
              <SummaryCard
                title="Total Bills"
                value={
                  calculatedSummary.total_bills
                }
                icon="cube-outline"
                colors={{
                  border:
                    'rgba(0,216,255,0.25)',
                  background:
                    'rgba(0,216,255,0.10)',
                  icon:
                    theme.colors.primary,
                }}
              />

              <SummaryCard
                title="Total Revenue"
                value={formatCurrency(
                  calculatedSummary.total_revenue
                )}
                icon="cash-outline"
                colors={{
                  border:
                    'rgba(22,163,74,0.25)',
                  background:
                    'rgba(22,163,74,0.10)',
                  icon:
                    theme.colors.success,
                }}
              />

              <SummaryCard
                title="In Transit"
                value={
                  calculatedSummary.in_transit
                }
                icon="paper-plane-outline"
                colors={{
                  border:
                    'rgba(217,119,6,0.25)',
                  background:
                    'rgba(217,119,6,0.10)',
                  icon:
                    theme.colors.warning,
                }}
              />

              <SummaryCard
                title="Delivered"
                value={
                  calculatedSummary.delivered
                }
                icon="checkmark-circle-outline"
                colors={{
                  border:
                    'rgba(8,145,178,0.25)',
                  background:
                    'rgba(8,145,178,0.10)',
                  icon:
                    theme.colors.info,
                }}
              />
            </ScrollView>

            {/* ---------------------------------------------------------- */}
            {/* Report Header                                               */}
            {/* ---------------------------------------------------------- */}

            <View
              style={styles.reportHeader}
            >
              <View>
                <Text
                  style={
                    styles.reportTitle
                  }
                >
                  Bills Report
                </Text>

                <Text
                  style={
                    styles.reportSubtitle
                  }
                >
                  {filteredBills.length}{' '}
                  bills found
                </Text>
              </View>

            </View>

            {/* ---------------------------------------------------------- */}
            {/* Search                                                       */}
            {/* ---------------------------------------------------------- */}

            <View
              style={styles.searchContainer}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={
                  theme.colors
                    .textSecondary
                }
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search tracking, sender..."
                placeholderTextColor={
                  theme.colors
                    .textMuted
                }
                style={
                  styles.searchInput
                }
              />

              {search.length > 0 && (
                <Pressable
                  onPress={() =>
                    setSearch('')
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={
                      theme.colors
                        .textMuted
                    }
                  />
                </Pressable>
              )}
            </View>

            {/* ---------------------------------------------------------- */}
            {/* Filter Toggle                                               */}
            {/* ---------------------------------------------------------- */}

            <Pressable
              onPress={() =>
                setFiltersVisible(
                  (value) => !value
                )
              }
              style={({ pressed }) => [
                styles.filterToggle,
                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.filterToggleLeft
                }
              >
                <Ionicons
                  name="options-outline"
                  size={19}
                  color={
                    theme.colors
                      .primary
                  }
                />

                <Text
                  style={
                    styles.filterToggleText
                  }
                >
                  Filters
                </Text>

                {(statusFilter ||
                  destinyFilter ||
                  originatedBranchFilter ||
                  senderFilter ||
                  consigneeFilter) && (
                  <View
                    style={
                      styles.filterCount
                    }
                  >
                    <Text
                      style={
                        styles.filterCountText
                      }
                    >
                      Active
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons
                name={
                  filtersVisible
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={18}
                color={
                  theme.colors
                    .textSecondary
                }
              />
            </Pressable>

            {/* ---------------------------------------------------------- */}
            {/* Filters                                                      */}
            {/* ---------------------------------------------------------- */}

            {filtersVisible && (
              <View
                style={
                  styles.filtersCard
                }
              >
                <View style={styles.dateRow}>
                    <View style={{ flex: 1 }}>
                        <DateInput
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="YYYY-MM-DD"
                        containerStyle={styles.dateInputOverride}
                        />
                    </View>

                    <View style={{ flex: 1 }}>
                        <DateInput
                        label="End Date"
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="YYYY-MM-DD"
                        containerStyle={styles.dateInputOverride}
                        />
                    </View>
                    </View>


                <FilterSelect
                  label="Status"
                  value={statusFilter}
                  placeholder="All Status"
                  options={
                    statusOptions
                  }
                  onChange={
                    setStatusFilter
                  }
                />

                <FilterSelect
                  label="Destination"
                  value={
                    destinyFilter
                  }
                  placeholder="All Destinations"
                  options={
                    destinyOptions
                  }
                  onChange={
                    setDestinyFilter
                  }
                />

                <FilterSelect
                  label="Originating Branch"
                  value={
                    originatedBranchFilter
                  }
                  placeholder="All Branches"
                  options={
                    branchOptions
                  }
                  onChange={
                    setOriginatedBranchFilter
                  }
                />

                <FilterSelect
                  label="Sender"
                  value={senderFilter}
                  placeholder="All Senders"
                  options={
                    senderOptions
                  }
                  onChange={
                    setSenderFilter
                  }
                />

                <FilterSelect
                  label="Consignee"
                  value={
                    consigneeFilter
                  }
                  placeholder="All Consignees"
                  options={
                    consigneeOptions
                  }
                  onChange={
                    setConsigneeFilter
                  }
                />

                <Pressable
                  onPress={() => {
                    setStatusFilter(
                      ''
                    );
                    setDestinyFilter(
                      ''
                    );
                    setOriginatedBranchFilter(
                      ''
                    );
                    setSenderFilter(
                      ''
                    );
                    setConsigneeFilter(
                      ''
                    );
                  }}
                  style={
                    styles.clearFiltersButton
                  }
                >
                  <Ionicons
                    name="refresh-outline"
                    size={17}
                    color={
                      theme.colors
                        .danger
                    }
                  />

                  <Text
                    style={
                      styles.clearFiltersText
                    }
                  >
                    Clear Filters
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Selection                                                   */}
            {/* ---------------------------------------------------------- */}

            {filteredBills.length > 0 && (
              <View
                style={
                  styles.selectionBar
                }
              >
                <Pressable
                  onPress={
                    toggleSelectAll
                  }
                  style={
                    styles.selectAllButton
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedBills.length ===
                        filteredBills.length &&
                        filteredBills.length >
                          0 &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {selectedBills.length ===
                      filteredBills.length &&
                      filteredBills.length >
                        0 && (
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color={
                            theme.colors
                              .background
                          }
                        />
                      )}
                  </View>

                  <Text
                    style={
                      styles.selectAllText
                    }
                  >
                    Select All
                  </Text>
                </Pressable>

                {selectedBills.length >
                  0 && (
                  <View
                    style={
                      styles.selectedInfo
                    }
                  >
                    <Text
                      style={
                        styles.selectedCount
                      }
                    >
                      {
                        selectedBills.length
                      }{' '}
                      selected
                    </Text>

                    <Pressable
                      onPress={() =>
                        setSelectedBillsModalVisible(
                          true
                        )
                      }
                      style={
                        styles.customPrintButton
                      }
                    >
                      <Ionicons
                        name="print-outline"
                        size={16}
                        color={
                          theme.colors
                            .background
                        }
                      />

                      <Text
                        style={
                          styles.customPrintText
                        }
                      >
                        Customs Print
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Bills title                                                 */}
            {/* ---------------------------------------------------------- */}

            <View
              style={
                styles.resultsHeader
              }
            >
              <Text
                style={
                  styles.resultsTitle
                }
              >
                Shipments
              </Text>

              <Text
                style={
                  styles.resultsCount
                }
              >
                {filteredBills.length}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <BillCard
            bill={item}
            isSelected={selectedBills.some(
              (bill) =>
                bill.id === item.id
            )}
            onSelect={
              toggleBillSelection
            }
            onPrint={printBill}
            onFingerprint={
              fingerprintPrint
            }
            onQr={openQr}
          />
        )}
        ListEmptyComponent={
          <View
            style={
              styles.emptyState
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="file-tray-outline"
                size={42}
                color={
                  theme.colors.primary
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No Bills Found
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Try changing your search
              or filters.
            </Text>

            
          </View>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* QR MODAL                                                         */}
      {/* ---------------------------------------------------------------- */}

      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setQrModalVisible(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.qrModal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Bill QR Code
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Scan to view shipment
                  details
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setQrModalVisible(
                    false
                  )
                }
                style={
                  styles.closeButton
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={
                    theme.colors.text
                  }
                />
              </Pressable>
            </View>

            <View
              style={
                styles.qrContent
              }
            >
              <View
                style={
                  styles.qrContainer
                }
              >
                <QRCode
                  value={
                    trackingUrl ||
                    trackingNo ||
                    'N/A'
                  }
                  size={230}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  ecl="H"
                />
              </View>

              <Text
                style={
                  styles.qrTracking
                }
              >
                {trackingNo}
              </Text>

              <Text
                style={
                  styles.qrUrl
                }
                numberOfLines={3}
              >
                {trackingUrl}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setQrModalVisible(
                  false
                )
              }
              style={
                styles.modalCloseButton
              }
            >
              <Text
                style={
                  styles.modalCloseText
                }
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>


      {/* ---------------------------------------------------------------- */}
      {/* PRINT MODAL                                                      */}
      {/* ---------------------------------------------------------------- */}

      <Modal
        visible={
          printModalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPrintModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.printModal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Print Bill
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {trackingNo}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setPrintModalVisible(
                    false
                  )
                }
                style={
                  styles.closeButton
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={
                    theme.colors.text
                  }
                />
              </Pressable>
            </View>

            <View
              style={
                styles.printPlaceholder
              }
            >
              <Ionicons
                name="print-outline"
                size={50}
                color={
                  theme.colors.primary
                }
              />

              <Text
                style={
                  styles.printTitle
                }
              >
                Bill Ready
              </Text>

              <Text
                style={
                  styles.printDescription
                }
              >
                Connect this modal to
                your native printing
                implementation.
              </Text>

              {selectedBillForPrint && (
                <View
                  style={
                    styles.printBillInfo
                  }
                >
                  <Text
                    style={
                      styles.printTracking
                    }
                  >
                    {
                      getBillTracking(
                        selectedBillForPrint
                      )
                    }
                  </Text>

                  <Text
                    style={
                      styles.printAmount
                    }
                  >
                    {formatCurrency(
                      selectedBillForPrint.amount_received
                    )}
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() =>
                setPrintModalVisible(
                  false
                )
              }
              style={
                styles.modalCloseButton
              }
            >
              <Text
                style={
                  styles.modalCloseText
                }
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>


      {/* ---------------------------------------------------------------- */}
      {/* SELECTED BILLS MODAL                                             */}
      {/* ---------------------------------------------------------------- */}

      <Modal
        visible={
          selectedBillsModalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedBillsModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.selectedBillsModal
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Selected Bills
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {
                    selectedBills.length
                  }{' '}
                  bills selected
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSelectedBillsModalVisible(
                    false
                  )
                }
                style={
                  styles.closeButton
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={
                    theme.colors.text
                  }
                />
              </Pressable>
            </View>

            <FlatList
              data={selectedBills}
              keyExtractor={(
                item,
                index
              ) =>
                String(
                  item.id ||
                    item.uuid ||
                    index
                )
              }
              showsVerticalScrollIndicator={
                false
              }
              renderItem={({
                item,
              }) => (
                <View
                  style={
                    styles.selectedBillRow
                  }
                >
                  <View
                    style={
                      styles.selectedBillIcon
                    }
                  >
                    <Ionicons
                      name="cube-outline"
                      size={19}
                      color={
                        theme.colors
                          .primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.selectedBillInfo
                    }
                  >
                    <Text
                      style={
                        styles.selectedBillTracking
                      }
                    >
                      {
                        getBillTracking(
                          item
                        )
                      }
                    </Text>

                    <Text
                      style={
                        styles.selectedBillSender
                      }
                    >
                      {getSenderName(
                        item
                      )}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.selectedBillAmount
                    }
                  >
                    {formatCurrency(
                      item.amount_received
                    )}
                  </Text>
                </View>
              )}
            />

            <View
              style={
                styles.selectedBillsFooter
              }
            >
              <Pressable
                onPress={() =>
                  setSelectedBillsModalVisible(
                    false
                  )
                }
                style={
                  styles.modalCloseButton
                }
              >
                <Text
                  style={
                    styles.modalCloseText
                  }
                >
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  contentContainer: {
    paddingHorizontal:
      theme.spacing.xl,
    paddingBottom: 45,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop:
      theme.spacing.xl,
    paddingBottom:
      theme.spacing.xxl,
  },

  pageTitle: {
    color: theme.colors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  pageSubtitle: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius:
      theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 8,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },

  connectionText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Summary */

  summaryScroll: {
    paddingBottom: 8,
    gap: 10,
  },

  summaryCard: {
    width: 145,
    minHeight: 135,
    borderRadius:
      theme.radius.xl,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    padding: 15,
    ...theme.shadows.card,
  },

  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  summaryTitle: {
    color:
      theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  summaryValue: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 4,
  },

  /* Report */

  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 13,
  },

  reportTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
  },

  reportSubtitle: {
    color:
      theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  newBillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.primary,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius:
      theme.radius.md,
    gap: 5,
    ...theme.shadows.button,
  },

  newBillText: {
    color:
      theme.colors.background,
    fontSize: 12,
    fontWeight: '900',
  },

  /* Search */

  searchContainer: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surface,
    borderRadius:
      theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    paddingHorizontal: 13,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    marginLeft: 9,
    paddingVertical: 0,
  },

  /* Filters */

  filterToggle: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor:
      theme.colors.surface,
    borderRadius:
      theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  filterToggleText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  filterCount: {
    backgroundColor:
      'rgba(0,216,255,0.12)',
    borderRadius:
      theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  filterCountText: {
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '900',
  },

  filtersCard: {
    backgroundColor:
      theme.colors.surface,
    borderRadius:
      theme.radius.lg,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    padding: 13,
    marginBottom: 13,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 9,
  },

  filterWrapper: {
    marginBottom: 11,
  },

  filterLabel: {
    color:
      theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },

  dateInput: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.sm,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    paddingHorizontal: 10,
  },

  dateTextInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 12,
    marginLeft: 7,
    paddingVertical: 0,
  },

  selectButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.sm,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    paddingHorizontal: 11,
  },

  selectText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },

  selectPlaceholder: {
    color:
      theme.colors.textSecondary,
    fontWeight: '500',
  },

  clearFiltersButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:
      theme.radius.sm,
    backgroundColor:
      'rgba(231,76,60,0.08)',
    gap: 6,
    marginTop: 2,
  },

  clearFiltersText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },

  /* Selection */

  selectionBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    paddingHorizontal: 11,
    marginBottom: 13,
  },

  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor:
      theme.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor:
      theme.colors.primary,
    borderColor:
      theme.colors.primary,
  },

  selectAllText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  selectedCount: {
    color:
      theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  customPrintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.purple,
    borderRadius:
      theme.radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 4,
  },

  customPrintText: {
    color:
      theme.colors.white,
    fontSize: 9,
    fontWeight: '800',
  },

  /* Results */

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  resultsTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  resultsCount: {
    color: theme.colors.primary,
    backgroundColor:
      'rgba(0,216,255,0.10)',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius:
      theme.radius.round,
    marginLeft: 7,
  },

  /* Bill */

  billCard: {
    backgroundColor:
      theme.colors.surface,
    borderRadius:
      theme.radius.lg,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    padding: 13,
    marginBottom: 10,
    ...theme.shadows.card,
  },

  billCardSelected: {
    borderColor:
      theme.colors.primary,
    backgroundColor:
      'rgba(0,216,255,0.035)',
  },

  billTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor:
      theme.colors.divider,
  },

  checkboxButton: {
    padding: 2,
    marginRight: 9,
  },

  trackingContainer: {
    flex: 1,
    minWidth: 0,
  },

  trackingLabel: {
    color:
      theme.colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  trackingNumber: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius:
      theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginLeft: 6,
    gap: 4,
  },

  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  /* Route */

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 13,
  },

  personBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },

  personIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor:
      'rgba(0,216,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  personInfo: {
    flex: 1,
    minWidth: 0,
  },

  fieldLabel: {
    color:
      theme.colors.textMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  fieldValue: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  /* Details */

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.sm,
    padding: 8,
    gap: 8,
  },

  detailItem: {
    width: '30%',
    minWidth: 85,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  detailText: {
    flex: 1,
    minWidth: 0,
  },

  detailLabel: {
    color:
      theme.colors.textMuted,
    fontSize: 7,
    fontWeight: '700',
  },

  detailValue: {
    color:
      theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },

  /* Actions */

  billActions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 11,
  },

  actionButton: {
    flex: 1,
    height: 37,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.sm,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    gap: 5,
  },

  actionText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },

  /* Empty */

  emptyState: {
    alignItems: 'center',
    paddingVertical: 55,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor:
      'rgba(0,216,255,0.07)',
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },

  emptyDescription: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.primary,
    borderRadius:
      theme.radius.md,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 17,
    gap: 5,
  },

  emptyButtonText: {
    color:
      theme.colors.background,
    fontSize: 12,
    fontWeight: '900',
  },

  /* Loading */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.background,
  },

  loadingIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor:
      'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },

  /* Modals */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.70)',
    justifyContent: 'flex-end',
  },

  filterModal: {
    maxHeight: '75%',
    backgroundColor:
      theme.colors.surface,
    borderTopLeftRadius:
      theme.radius.xxl,
    borderTopRightRadius:
      theme.radius.xxl,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderColor:
      theme.colors.border,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor:
      theme.colors.textMuted,
    alignSelf: 'center',
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },

  modalSubtitle: {
    color:
      theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor:
      theme.colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius:
      theme.radius.md,
    marginBottom: 4,
  },

  optionItemSelected: {
    backgroundColor:
      'rgba(0,216,255,0.08)',
  },

  optionText: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '800',
  },

  /* QR */

  qrModal: {
    backgroundColor:
      theme.colors.surface,
    borderRadius:
      theme.radius.xxl,
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    ...theme.shadows.elevated,
  },

  qrContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },

  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 13,
    ...theme.shadows.card,
  },

  qrTracking: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 15,
  },

  qrUrl: {
    color:
      theme.colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 14,
  },

  /* Print */

  printModal: {
    backgroundColor:
      theme.colors.surface,
    minHeight: '55%',
    borderTopLeftRadius:
      theme.radius.xxl,
    borderTopRightRadius:
      theme.radius.xxl,
    padding: 20,
    borderTopWidth: 1,
    borderColor:
      theme.colors.border,
  },

  printPlaceholder: {
    flex: 1,
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  printTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 15,
  },

  printDescription: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },

  printBillInfo: {
    width: '100%',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    padding: 14,
    marginTop: 18,
  },

  printTracking: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },

  printAmount: {
    color:
      theme.colors.successLight,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },

  /* Selected Bills */

  selectedBillsModal: {
    backgroundColor:
      theme.colors.surface,
    maxHeight: '85%',
    minHeight: '50%',
    borderTopLeftRadius:
      theme.radius.xxl,
    borderTopRightRadius:
      theme.radius.xxl,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor:
      theme.colors.border,
  },

  selectedBillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    padding: 10,
    marginBottom: 7,
  },

  selectedBillIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      'rgba(0,216,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedBillInfo: {
    flex: 1,
    marginLeft: 10,
  },

  selectedBillTracking: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },

  selectedBillSender: {
    color:
      theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  selectedBillAmount: {
    color:
      theme.colors.successLight,
    fontSize: 11,
    fontWeight: '800',
  },

  selectedBillsFooter: {
    paddingTop: 10,
  },

  modalCloseButton: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.surfaceSecondary,
    borderRadius:
      theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    marginTop: 10,
  },

  modalCloseText: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});


export default CompanyOwnerAllBillsScreen;
