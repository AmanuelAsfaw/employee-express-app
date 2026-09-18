// src/screens/CreateBillScreen.js

import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../utils/axioServices';
import { END_POINT } from '../../constants/urls';

import {
  fetchEmployeeBillsData_Hybrid,
  saveBillOffline,
  saveConsigneeOffline,
  saveSenderOffline,
  saveServiceTypeOffline,
} from '../../utils/bills/bills_hybrid_utils';
import { theme } from '../../theme/theme';


// ======================================================
// COLORS
// ======================================================

const COLORS = {
  navy: '#02152E',
  blue: '#062A54',
  lightBlue: '#0B4279',

  cyan: '#00D8FF',
  cyanLight: '#66D9FF',

  white: '#FFFFFF',
  muted: '#8C8C8C',
  muted2: '#999999',

  green: '#2eb85c',
  red: '#e74c3c',
  orange: '#f39c12',

  purple: '#4f46e5',

  input: '#061D3A',
  border: 'rgba(0,216,255,0.18)',
};


// ======================================================
// INITIAL FORM
// ======================================================

const INITIAL_FORM = {
  sender: '',
  consignee: '',
  service_type: '',
  description_of_goods: '',

  destiny_branch: '',

  item_kilo: 0,
  item_gram: 0,

  item_length: 0,
  item_width: 0,
  item_height: 0,
  item_volume: 0,

  item_piece: 1,

  amount_received: 0,

  payment_method: 'cash',
  is_paid: false,

  special_instructions: '',
};


// ======================================================
// INITIAL ITEM
// ======================================================

const createEmptyItem = () => ({
  description: '',
  quantity: '1',
  weight: '',
  price: '',
  item_type: 'OTHER',
  unit: 'PIECE',
});


// ======================================================
// COMPONENT
// ======================================================

const CreateBillScreen = () => {
  const navigation = useNavigation();

  // --------------------------------------------------
  // GENERAL STATE
  // --------------------------------------------------

  const [loading, setLoading] = useState(false);

  const [isConnected, setIsConnected] = useState(true);

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  const [senders, setSenders] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [branchList, setBranchList] = useState([]);

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [items, setItems] = useState([
    createEmptyItem(),
  ]);

  // --------------------------------------------------
  // PRICING
  // --------------------------------------------------

  const [companyPricingConfig, setCompanyPricingConfig] =
    useState({
      bill_pricing_by: 'manual',
      weight_pricings: [],
      volume_pricings: [],
    });

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const [senderSearch, setSenderSearch] = useState('');
  const [consigneeSearch, setConsigneeSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  // --------------------------------------------------
  // SELECTED DISPLAY
  // --------------------------------------------------

  const [senderDisplay, setSenderDisplay] = useState('');
  const [consigneeDisplay, setConsigneeDisplay] = useState('');
  const [branchDisplay, setBranchDisplay] = useState('');

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');

  const [modalForm, setModalForm] = useState({});

  // ==================================================
  // NETWORK
  // ==================================================

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(
        state.isConnected === true
      );
    });

    return () => unsubscribe();
  }, []);


  // ==================================================
  // LOAD SENDERS / CONSIGNEES / SERVICES / BRANCHES
  // ==================================================

  useEffect(() => {
    fetchEmployeeBillsData_Hybrid(
      isConnected,
      setSenders,
      setConsignees,
      setServiceTypes,
      setBranchList,
      txt => {
        Alert.alert(
          'Loading Error',
          txt || 'Failed to load required data.'
        );
      }
    );
  }, [isConnected]);


  // ==================================================
  // LOAD PRICING CONFIG
  // ==================================================

  useEffect(() => {
    const fetchPricingConfig = async () => {
      if (!isConnected) {
        return;
      }

      try {
        const res = await api.get(
          `${END_POINT}/usr-mngmnt/api/company-pricing/`
        );

        const configData = Array.isArray(res.data)
          ? res.data[0]
          : res.data;

        if (configData) {
          setCompanyPricingConfig(
            configData
          );
        }

      } catch (err) {
        console.error(
          'Failed to fetch pricing config:',
          err?.response?.data || err
        );
      }
    };

    fetchPricingConfig();

  }, [isConnected]);


  // ==================================================
  // DEFAULT SERVICE
  // ==================================================

  useEffect(() => {

    if (
      serviceTypes.length > 0 &&
      !formData.service_type
    ) {

      const firstService = serviceTypes[0];

      setFormData(prev => ({
        ...prev,
        service_type:
          isConnected
            ? firstService.id
            : firstService.uuid,
      }));
    }

  }, [
    serviceTypes,
    isConnected,
    formData.service_type,
  ]);


  // ==================================================
  // INPUT CHANGE
  // ==================================================

  const handleChange = (
    name,
    value
  ) => {

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

  };


  // ==================================================
  // ITEM CHANGE
  // ==================================================

  const handleItemChange = (
    index,
    name,
    value
  ) => {

    setItems(prev => {

      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [name]: value,
      };

      return updated;

    });

  };


  // ==================================================
  // ADD ITEM
  // ==================================================

  const addItem = () => {

    setItems(prev => [
      ...prev,
      createEmptyItem(),
    ]);

  };


  // ==================================================
  // REMOVE ITEM
  // ==================================================

  const removeItem = index => {

    if (items.length === 1) {
      Alert.alert(
        'Cannot Remove',
        'At least one bill item is required.'
      );

      return;
    }

    setItems(prev =>
      prev.filter(
        (_, i) => i !== index
      )
    );

  };


  // ==================================================
  // SELECT SENDER
  // ==================================================

  const selectSender = item => {

    const id = isConnected
      ? item.id
      : item.uuid;

    setFormData(prev => ({
      ...prev,
      sender: id,
    }));

    setSenderDisplay(
      `${item.name || ''} - ${item.phone || ''}`
    );

    setSenderSearch('');

  };


  // ==================================================
  // SELECT CONSIGNEE
  // ==================================================

  const selectConsignee = item => {

    const id = isConnected
      ? item.id
      : item.uuid;

    setFormData(prev => ({
      ...prev,
      consignee: id,
    }));

    setConsigneeDisplay(
      `${item.name || ''} - ${item.phone || ''}`
    );

    setConsigneeSearch('');

  };


  // ==================================================
  // SELECT BRANCH
  // ==================================================

  const selectBranch = item => {

    setFormData(prev => ({
      ...prev,
      destiny_branch: item.id,
    }));

    setBranchDisplay(
      `${item.name || ''} (${item.code || ''})`
    );

    setBranchSearch('');

  };


  // ==================================================
  // FILTER DATA
  // ==================================================

  const filteredSenders = useMemo(() => {

    const search =
      senderSearch
        .toLowerCase()
        .trim();

    if (!search) {
      return senders.slice(0, 10);
    }

    return senders.filter(s =>
      `${s.name || ''} ${s.phone || ''} ${
        s.tin_number || ''
      }`
        .toLowerCase()
        .includes(search)
    );

  }, [
    senders,
    senderSearch,
  ]);


  const filteredConsignees = useMemo(() => {

    const search =
      consigneeSearch
        .toLowerCase()
        .trim();

    if (!search) {
      return consignees.slice(0, 10);
    }

    return consignees.filter(c =>
      `${c.name || ''} ${c.phone || ''} ${
        c.tin_number || ''
      }`
        .toLowerCase()
        .includes(search)
    );

  }, [
    consignees,
    consigneeSearch,
  ]);


  const filteredBranches = useMemo(() => {

    const search =
      branchSearch
        .toLowerCase()
        .trim();

    if (!search) {
      return branchList.slice(0, 10);
    }

    return branchList.filter(b =>
      `${b.name || ''} ${b.code || ''}`
        .toLowerCase()
        .includes(search)
    );

  }, [
    branchList,
    branchSearch,
  ]);


  // ==================================================
  // CALCULATE TOTALS FROM ITEMS
  // ==================================================

  useEffect(() => {

    let totalAmount = 0;
    let totalWeightKg = 0;
    let totalPieces = 0;

    items.forEach(item => {

      const quantity =
        Number(item.quantity) || 0;

      const weight =
        Number(item.weight) || 0;

      const price =
        Number(item.price) || 0;


      // Amount

      totalAmount +=
        quantity * price;


      // Pieces

      totalPieces +=
        quantity;


      // Weight

      if (
        item.unit === 'KILOGRAM'
      ) {

        totalWeightKg +=
          quantity * weight;

      } else if (
        item.unit === 'GRAM'
      ) {

        totalWeightKg +=
          (quantity * weight) / 1000;

      }

    });


    setFormData(prev => ({

      ...prev,

      item_kilo:
        Number(totalWeightKg.toFixed(3)),

      item_piece:
        totalPieces,

      amount_received:
        companyPricingConfig.bill_pricing_by ===
        'manual'
          ? totalAmount
          : prev.amount_received,

    }));

  }, [
    items,
    companyPricingConfig.bill_pricing_by,
  ]);


  // ==================================================
  // CALCULATE VOLUME
  // ==================================================

  useEffect(() => {

    const length =
      Number(formData.item_length) || 0;

    const width =
      Number(formData.item_width) || 0;

    const height =
      Number(formData.item_height) || 0;


    const volume =
      length *
      width *
      height;


    setFormData(prev => ({

      ...prev,

      item_volume:
        Number(volume.toFixed(3)),

    }));

  }, [
    formData.item_length,
    formData.item_width,
    formData.item_height,
  ]);


  // ==================================================
  // PRICING CALCULATION
  // ==================================================

  useEffect(() => {

    const pricingType =
      companyPricingConfig.bill_pricing_by;


    if (
      pricingType === 'manual'
    ) {
      return;
    }


    const currentWeight =
      Number(formData.item_kilo) || 0;

    const currentVolume =
      Number(formData.item_volume) || 0;


    let weightAmount = 0;
    let volumeAmount = 0;


    // ----------------------------------------------
    // WEIGHT PRICING
    // ----------------------------------------------

    if (
      pricingType === 'weight' ||
      pricingType === 'weight-to-volume'
    ) {

      const weightTier =
        (
          companyPricingConfig
            .weight_pricings || []
        ).find(tier => {

          const min =
            Number(tier.min_weight) || 0;

          const max =
            Number(tier.max_weight) || 0;

          return (
            currentWeight >= min &&
            currentWeight <= max
          );

        });


      if (weightTier) {

        weightAmount =
          tierValue(
            weightTier.price,
            currentWeight,
            weightTier.is_per_weight
          );

      }

    }


    // ----------------------------------------------
    // VOLUME PRICING
    // ----------------------------------------------

    if (
      pricingType === 'volume' ||
      pricingType === 'weight-to-volume'
    ) {

      const volumeTier =
        (
          companyPricingConfig
            .volume_pricings || []
        ).find(tier => {

          const min =
            Number(tier.min_volume) || 0;

          const max =
            Number(tier.max_volume) || 0;

          return (
            currentVolume >= min &&
            currentVolume <= max
          );

        });


      if (volumeTier) {

        const divideBy =
          Number(
            volumeTier.divide_by || 1
          );


        const chargeableVolume =
          currentVolume /
          divideBy;


        volumeAmount =
          volumeTier.is_per_volume
            ? Number(volumeTier.price || 0) *
              chargeableVolume
            : Number(volumeTier.price || 0);

      }

    }


    // ----------------------------------------------
    // FINAL AMOUNT
    // ----------------------------------------------

    let amount = 0;


    if (
      pricingType === 'weight'
    ) {

      amount = weightAmount;

    } else if (
      pricingType === 'volume'
    ) {

      amount = volumeAmount;

    } else if (
      pricingType === 'weight-to-volume'
    ) {

      amount = Math.max(
        weightAmount,
        volumeAmount
      );

    }


    setFormData(prev => ({
      ...prev,
      amount_received:
        Number(amount.toFixed(2)),
    }));


  }, [
    formData.item_kilo,
    formData.item_volume,
    companyPricingConfig,
  ]);


  // ==================================================
  // OPEN MODAL
  // ==================================================

  const openAddModal = type => {

    setModalType(type);

    setModalForm({});

    setModalVisible(true);

  };


  // ==================================================
  // MODAL INPUT
  // ==================================================

  const handleModalChange = (
    name,
    value
  ) => {

    setModalForm(prev => ({
      ...prev,
      [name]: value,
    }));

  };


  // ==================================================
  // SAVE AND SELECT
  // ==================================================

  const saveAndSelect = async () => {

    if (!modalForm.name?.trim()) {

      Alert.alert(
        'Validation Error',
        'Name is required.'
      );

      return;
    }


    try {

      // --------------------------------------------
      // OFFLINE
      // --------------------------------------------

      if (!isConnected) {

        if (
          modalType === 'sender'
        ) {

          await saveSenderOffline(
            modalForm,
            setSenders,
            setFormData,

            txt => {
              Alert.alert(
                'Error',
                txt
              );
            },

            txt => {

              Alert.alert(
                'Success',
                txt
              );

              setModalVisible(false);

            }
          );

          return;
        }


        if (
          modalType === 'consignee'
        ) {

          await saveConsigneeOffline(
            modalForm,
            setConsignees,
            setFormData,

            txt => {
              Alert.alert(
                'Error',
                txt
              );
            },

            txt => {

              Alert.alert(
                'Success',
                txt
              );

              setModalVisible(false);

            }
          );

          return;
        }


        if (
          modalType === 'service'
        ) {

          await saveServiceTypeOffline(
            modalForm,
            setServiceTypes,
            setFormData,

            txt => {
              Alert.alert(
                'Error',
                txt
              );
            },

            txt => {

              Alert.alert(
                'Success',
                txt
              );

              setModalVisible(false);

            }
          );

          return;
        }

      }


      // --------------------------------------------
      // ONLINE
      // --------------------------------------------

      let response;


      if (
        modalType === 'sender'
      ) {

        response = await api.post(
          `${END_POINT}/express-api/api/senders/`,
          modalForm
        );

        setSenders(prev => [
          ...prev,
          response.data,
        ]);

        setFormData(prev => ({
          ...prev,
          sender:
            response.data.id,
        }));

        setSenderDisplay(
          `${response.data.name} - ${response.data.phone}`
        );

      }


      if (
        modalType === 'consignee'
      ) {

        response = await api.post(
          `${END_POINT}/express-api/api/consignees/`,
          modalForm
        );

        setConsignees(prev => [
          ...prev,
          response.data,
        ]);

        setFormData(prev => ({
          ...prev,
          consignee:
            response.data.id,
        }));

        setConsigneeDisplay(
          `${response.data.name} - ${response.data.phone}`
        );

      }


      if (
        modalType === 'service'
      ) {

        response = await api.post(
          `${END_POINT}/express-api/api/service-types/`,
          modalForm
        );

        setServiceTypes(prev => [
          ...prev,
          response.data,
        ]);

        setFormData(prev => ({
          ...prev,
          service_type:
            response.data.id,
        }));

      }


      setModalVisible(false);


      Alert.alert(
        'Success',
        `${modalType} created successfully.`
      );


    } catch (err) {

      console.error(
        'Save failed:',
        err?.response?.data || err
      );


      const message =
        extractApiError(err) ||
        'Failed to save.';


      Alert.alert(
        'Save Failed',
        message
      );

    }

  };


  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit = async () => {

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

    if (!formData.sender) {

      Alert.alert(
        'Validation Error',
        'Sender must be selected.'
      );

      return;
    }


    if (!formData.consignee) {

      Alert.alert(
        'Validation Error',
        'Consignee must be selected.'
      );

      return;
    }


    if (!formData.service_type) {

      Alert.alert(
        'Validation Error',
        'Service type must be selected.'
      );

      return;
    }


    if (!formData.destiny_branch) {

      Alert.alert(
        'Validation Error',
        'Destination branch must be selected.'
      );

      return;
    }


    if (
      Number(formData.item_kilo) <= 0
    ) {

      Alert.alert(
        'Validation Error',
        'Weight must be greater than 0.'
      );

      return;
    }


    if (
      Number(formData.item_piece) <= 0
    ) {

      Alert.alert(
        'Validation Error',
        'Piece must be greater than 0.'
      );

      return;
    }


    if (
      !formData.description_of_goods?.trim()
    ) {

      Alert.alert(
        'Validation Error',
        'Description of goods is required.'
      );

      return;
    }


    // ----------------------------------------------
    // FILTER ITEMS
    // ----------------------------------------------

    const itemsFiltered =
      items.filter(item =>
        item.description?.trim() &&
        Number(item.weight) > 0 &&
        Number(item.price) >= 0
      );


    // if (itemsFiltered.length === 0) {

    //   Alert.alert(
    //     'Validation Error',
    //     'Please add at least one valid bill item.'
    //   );

    //   return;
    // }


    // ----------------------------------------------
    // PAYLOAD
    // ----------------------------------------------

    const payload = {
      ...formData,

      items: itemsFiltered,
    };


    setLoading(true);


    try {

      // ============================================
      // OFFLINE
      // ============================================

      if (!isConnected) {

        await saveBillOffline(

          payload,

          itemsFiltered,

          txt => {

            Alert.alert(
              'Offline Bill Error',
              txt
            );

          },

          () => {

            Alert.alert(
              'Offline Mode',
              'Bill saved locally. It will sync when the device is online.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    navigation.navigate(
                      'BillsList'
                    ),
                },
              ]
            );

          }

        );

        return;
      }


      // ============================================
      // ONLINE
      // ============================================

      const response =
        await api.post(
          `${END_POINT}/express-api/api/bills/`,
          payload
        );


      const trackingNo =
        response.data?.tracking_no;


      Alert.alert(
        'Success',
        `Bill Created Successfully${
          trackingNo
            ? `\nTracking No: ${trackingNo}`
            : ''
        }`,
        [
          {
            text: 'View Bill',
            onPress: () => {

              if (trackingNo) {

                navigation.navigate(
                  'DetailBill',
                  {
                    trackingNo,
                  }
                );

              } else {

                navigation.navigate(
                  'BillsList'
                );

              }

            },
          },
        ]
      );


    } catch (err) {

      console.error(
        'Create bill failed:',
        err?.response?.status,
        err?.response?.data || err
      );


      Alert.alert(
        'Create Bill Failed',
        extractApiError(err) ||
          'Failed to create bill.'
      );


    } finally {

      setLoading(false);

    }

  };


  // ==================================================
  // RENDER
  // ==================================================

  return (

    <LinearGradient
      colors={[
        COLORS.navy,
        COLORS.blue,
        COLORS.lightBlue,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >

      <SafeAreaView style={styles.safeArea}>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <ScrollView
            style={styles.container}
            contentContainerStyle={
              styles.contentContainer
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* =====================================
                HEADER
            ====================================== */}

            <View style={styles.header}>

              <View>

                <Text style={styles.title}>
                  Create Bill
                </Text>

                <Text style={styles.subtitle}>
                  Create a new shipment
                </Text>

              </View>

              <View style={styles.networkBadge}>

                <View
                  style={[
                    styles.networkDot,
                    {
                      backgroundColor:
                        isConnected
                          ? COLORS.green
                          : COLORS.red,
                    },
                  ]}
                />

                <Text style={styles.networkText}>
                  {isConnected
                    ? 'Online'
                    : 'Offline'}
                </Text>

              </View>

            </View>


            {/* =====================================
                OFFLINE
            ====================================== */}

            {!isConnected && (

              <View style={styles.offlineBanner}>

                <MaterialCommunityIcons
                  name="wifi-off"
                  size={20}
                  color="#fff"
                />

                <Text style={styles.offlineText}>
                  Offline Mode: Bill will be
                  saved locally and synced later.
                </Text>

              </View>

            )}


            {/* =====================================
                SENDER / CONSIGNEE
            ====================================== */}

            <SectionCard
              title="Customer Information"
              icon="account-multiple"
            >

              <FieldLabel>
                Sender
              </FieldLabel>

              <SearchSelector
                value={senderDisplay}
                search={senderSearch}
                setSearch={setSenderSearch}
                placeholder="Search sender..."
                options={filteredSenders}
                onSelect={selectSender}
                displayItem={item =>
                  `${item.name || ''} - ${item.phone || ''}`
                }
              />

              <SmallButton
                title="Add Sender"
                icon="account-plus"
                onPress={() =>
                  openAddModal('sender')
                }
              />


              <FieldLabel>
                Consignee
              </FieldLabel>

              <SearchSelector
                value={consigneeDisplay}
                search={consigneeSearch}
                setSearch={setConsigneeSearch}
                placeholder="Search consignee..."
                options={filteredConsignees}
                onSelect={selectConsignee}
                displayItem={item =>
                  `${item.name || ''} - ${item.phone || ''}`
                }
              />

              <SmallButton
                title="Add Consignee"
                icon="account-plus"
                onPress={() =>
                  openAddModal('consignee')
                }
              />

            </SectionCard>


            {/* =====================================
                SERVICE / BRANCH
            ====================================== */}

            <SectionCard
              title="Shipment Information"
              icon="truck"
            >

              <FieldLabel>
                Service Type
              </FieldLabel>

              <View style={styles.pickerContainer}>

                <Picker
                  selectedValue={
                    formData.service_type
                  }
                  onValueChange={value =>
                    handleChange(
                      'service_type',
                      value
                    )
                  }
                  dropdownIconColor={
                    COLORS.cyan
                  }
                  style={styles.picker}
                >

                  <Picker.Item
                    label="Select Service"
                    value=""
                  />

                  {serviceTypes.map(service => (

                    <Picker.Item
                      key={
                        service.uuid ||
                        service.id
                      }
                      label={
                        service.name
                      }
                      value={
                        isConnected
                          ? service.id
                          : service.uuid
                      }
                    />

                  ))}

                </Picker>

              </View>


              <SmallButton
                title="New Service"
                icon="plus"
                onPress={() =>
                  openAddModal('service')
                }
              />


              <FieldLabel>
                Destination Branch
              </FieldLabel>

              <SearchSelector
                value={branchDisplay}
                search={branchSearch}
                setSearch={setBranchSearch}
                placeholder="Search destination branch..."
                options={filteredBranches}
                onSelect={selectBranch}
                displayItem={item =>
                  `${item.name || ''} (${item.code || ''})`
                }
              />


              <FieldLabel>
                Description of Goods
              </FieldLabel>

              <TextInput
                style={[
                  styles.input,
                  styles.textarea,
                ]}
                placeholder="e.g. Electronics, fragile, clothes..."
                placeholderTextColor="#6f849b"
                multiline
                value={
                  formData.description_of_goods
                }
                onChangeText={value =>
                  handleChange(
                    'description_of_goods',
                    value
                  )
                }
              />


              <FieldLabel>
                Special Instructions
              </FieldLabel>

              <TextInput
                style={[
                  styles.input,
                  styles.textareaSmall,
                ]}
                placeholder="e.g. Call before delivery..."
                placeholderTextColor="#6f849b"
                multiline
                value={
                  formData.special_instructions
                }
                onChangeText={value =>
                  handleChange(
                    'special_instructions',
                    value
                  )
                }
              />

            </SectionCard>


            {/* =====================================
                BILL ITEMS
            ====================================== */}

            <SectionCard
              title="Bill Items"
              icon="package-variant"
              rightButton={
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={addItem}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.addItemButtonText
                    }
                  >
                    Add Item
                  </Text>
                </TouchableOpacity>
              }
            >

              {items.map(
                (item, index) => (

                  <View
                    key={index}
                    style={styles.itemCard}
                  >

                    <View
                      style={
                        styles.itemHeader
                      }
                    >

                      <Text
                        style={
                          styles.itemNumber
                        }
                      >
                        Item {index + 1}
                      </Text>

                      {items.length > 1 && (

                        <TouchableOpacity
                          onPress={() =>
                            removeItem(index)
                          }
                        >
                          <MaterialCommunityIcons
                            name="delete-outline"
                            size={23}
                            color={COLORS.red}
                          />
                        </TouchableOpacity>

                      )}

                    </View>


                    <FieldLabel>
                      Description
                    </FieldLabel>

                    <TextInput
                      style={styles.input}
                      placeholder="Item description"
                      placeholderTextColor="#6f849b"
                      value={
                        item.description
                      }
                      onChangeText={value =>
                        handleItemChange(
                          index,
                          'description',
                          value
                        )
                      }
                    />


                    <View
                      style={styles.row}
                    >

                      <View
                        style={
                          styles.half
                        }
                      >

                        <FieldLabel>
                          Quantity
                        </FieldLabel>

                        <TextInput
                          style={
                            styles.input
                          }
                          placeholder="Qty"
                          placeholderTextColor="#6f849b"
                          keyboardType="numeric"
                          value={
                            String(
                              item.quantity
                            )
                          }
                          onChangeText={value =>
                            handleItemChange(
                              index,
                              'quantity',
                              value
                            )
                          }
                        />

                      </View>


                      <View
                        style={
                          styles.half
                        }
                      >

                        <FieldLabel>
                          Weight
                        </FieldLabel>

                        <TextInput
                          style={
                            styles.input
                          }
                          placeholder="Weight"
                          placeholderTextColor="#6f849b"
                          keyboardType="decimal-pad"
                          value={
                            String(
                              item.weight
                            )
                          }
                          onChangeText={value =>
                            handleItemChange(
                              index,
                              'weight',
                              value
                            )
                          }
                        />

                      </View>

                    </View>


                    <View
                      style={styles.row}
                    >

                      <View
                        style={
                          styles.half
                        }
                      >

                        <FieldLabel>
                          Price
                        </FieldLabel>

                        <TextInput
                          style={
                            styles.input
                          }
                          placeholder="Price"
                          placeholderTextColor="#6f849b"
                          keyboardType="decimal-pad"
                          value={
                            String(
                              item.price
                            )
                          }
                          onChangeText={value =>
                            handleItemChange(
                              index,
                              'price',
                              value
                            )
                          }
                        />

                      </View>


                      <View
                        style={
                          styles.half
                        }
                      >

                        <FieldLabel>
                          Unit
                        </FieldLabel>

                        <View
                          style={
                            styles.smallPicker
                          }
                        >

                          <Picker
                            selectedValue={
                              item.unit
                            }
                            onValueChange={value =>
                              handleItemChange(
                                index,
                                'unit',
                                value
                              )
                            }
                            dropdownIconColor={
                              COLORS.cyan
                            }
                            style={
                              styles.picker
                            }
                          >

                            <Picker.Item
                              label="Kilogram"
                              value="KILOGRAM"
                            />

                            <Picker.Item
                              label="Gram"
                              value="GRAM"
                            />

                            <Picker.Item
                              label="Liter"
                              value="LITER"
                            />

                            <Picker.Item
                              label="Milliliter"
                              value="MILLILITER"
                            />

                            <Picker.Item
                              label="Piece"
                              value="PIECE"
                            />

                          </Picker>

                        </View>

                      </View>

                    </View>


                    <FieldLabel>
                      Item Type
                    </FieldLabel>

                    <View
                      style={
                        styles.pickerContainer
                      }
                    >

                      <Picker
                        selectedValue={
                          item.item_type
                        }
                        onValueChange={value =>
                          handleItemChange(
                            index,
                            'item_type',
                            value
                          )
                        }
                        dropdownIconColor={
                          COLORS.cyan
                        }
                        style={
                          styles.picker
                        }
                      >

                        <Picker.Item
                          label="Document"
                          value="DOCUMENT"
                        />

                        <Picker.Item
                          label="Non-Document"
                          value="NONE-DOCUMENT"
                        />

                        <Picker.Item
                          label="Other"
                          value="OTHER"
                        />

                      </Picker>

                    </View>

                  </View>

                )
              )}

            </SectionCard>


            {/* =====================================
                WEIGHT / PIECE / DIMENSIONS
            ====================================== */}

            <SectionCard
              title="Package Details"
              icon="scale-balance"
            >

              <View
                style={styles.row}
              >

                <View
                  style={styles.half}
                >

                  <FieldLabel>
                    Weight (kg)
                  </FieldLabel>

                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={String(
                      formData.item_kilo
                    )}
                    onChangeText={value =>
                      handleChange(
                        'item_kilo',
                        value
                      )
                    }
                  />

                </View>


                <View
                  style={styles.half}
                >

                  <FieldLabel>
                    Pieces
                  </FieldLabel>

                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(
                      formData.item_piece
                    )}
                    onChangeText={value =>
                      handleChange(
                        'item_piece',
                        value
                      )
                    }
                  />

                </View>

              </View>


              <FieldLabel>
                Dimensions (cm)
              </FieldLabel>

              <View
                style={styles.dimensionsRow}
              >

                <TextInput
                  style={styles.dimensionInput}
                  placeholder="Length"
                  placeholderTextColor="#6f849b"
                  keyboardType="decimal-pad"
                  value={String(
                    formData.item_length
                  )}
                  onChangeText={value =>
                    handleChange(
                      'item_length',
                      value
                    )
                  }
                />

                <Text
                  style={styles.dimensionX}
                >
                  ×
                </Text>

                <TextInput
                  style={styles.dimensionInput}
                  placeholder="Width"
                  placeholderTextColor="#6f849b"
                  keyboardType="decimal-pad"
                  value={String(
                    formData.item_width
                  )}
                  onChangeText={value =>
                    handleChange(
                      'item_width',
                      value
                    )
                  }
                />

                <Text
                  style={styles.dimensionX}
                >
                  ×
                </Text>

                <TextInput
                  style={styles.dimensionInput}
                  placeholder="Height"
                  placeholderTextColor="#6f849b"
                  keyboardType="decimal-pad"
                  value={String(
                    formData.item_height
                  )}
                  onChangeText={value =>
                    handleChange(
                      'item_height',
                      value
                    )
                  }
                />

              </View>


              <View
                style={styles.volumeBox}
              >

                <MaterialCommunityIcons
                  name="cube-outline"
                  size={22}
                  color={COLORS.cyan}
                />

                <View>
                  <Text
                    style={
                      styles.volumeLabel
                    }
                  >
                    Calculated Volume
                  </Text>

                  <Text
                    style={
                      styles.volumeValue
                    }
                  >
                    {Number(
                      formData.item_volume || 0
                    ).toFixed(3)} cm³
                  </Text>
                </View>

              </View>

            </SectionCard>


            {/* =====================================
                PAYMENT / PRICING
            ====================================== */}

            <SectionCard
              title="Payment & Pricing"
              icon="cash"
            >

              <FieldLabel>
                Pricing Method
              </FieldLabel>

              <View
                style={
                  styles.pickerContainer
                }
              >

                <Picker
                  selectedValue={
                    companyPricingConfig.bill_pricing_by
                  }
                  onValueChange={value => {

                    setCompanyPricingConfig(
                      prev => ({
                        ...prev,
                        bill_pricing_by:
                          value,
                      })
                    );

                  }}
                  dropdownIconColor={
                    COLORS.cyan
                  }
                  style={styles.picker}
                >

                  <Picker.Item
                    label="Manual Pricing"
                    value="manual"
                  />

                  <Picker.Item
                    label="Weight Pricing"
                    value="weight"
                  />

                  <Picker.Item
                    label="Volume Pricing"
                    value="volume"
                  />

                  <Picker.Item
                    label="Weight to Volume"
                    value="weight-to-volume"
                  />

                </Picker>

              </View>


              <FieldLabel>
                Amount Received
              </FieldLabel>

              <View
                style={
                  styles.amountContainer
                }
              >

                <Text
                  style={
                    styles.currencyText
                  }
                >
                  ETB
                </Text>

                <TextInput
                  style={
                    styles.amountInput
                  }
                  keyboardType="decimal-pad"
                  value={String(
                    formData.amount_received
                  )}
                  editable={
                    companyPricingConfig
                      .bill_pricing_by ===
                    'manual'
                  }
                  onChangeText={value =>
                    handleChange(
                      'amount_received',
                      value
                    )
                  }
                />

              </View>


              {companyPricingConfig
                .bill_pricing_by !==
                'manual' && (

                <Text
                  style={
                    styles.autoPricingText
                  }
                >
                  Automatically calculated using{' '}
                  {
                    companyPricingConfig
                      .bill_pricing_by
                  } pricing configuration.
                </Text>

              )}


              <FieldLabel>
                Payment Method
              </FieldLabel>

              <View
                style={
                  styles.pickerContainer
                }
              >

                <Picker
                  selectedValue={
                    formData.payment_method
                  }
                  onValueChange={value =>
                    handleChange(
                      'payment_method',
                      value
                    )
                  }
                  dropdownIconColor={
                    COLORS.cyan
                  }
                  style={styles.picker}
                >

                  <Picker.Item
                    label="Cash"
                    value="cash"
                  />

                  <Picker.Item
                    label="Bank"
                    value="bank"
                  />

                  <Picker.Item
                    label="Mobile Banking"
                    value="mobile-bank"
                  />

                  <Picker.Item
                    label="Tele-Birr"
                    value="tele-birr"
                  />

                  <Picker.Item
                    label="M-Pesa"
                    value="m-pesa"
                  />

                  <Picker.Item
                    label="Pending"
                    value="pending"
                  />

                  <Picker.Item
                    label="Other"
                    value="other"
                  />

                  <Picker.Item
                    label="None"
                    value="none"
                  />

                </Picker>

              </View>


              <TouchableOpacity
                style={
                  styles.paidRow
                }
                onPress={() =>
                  setFormData(prev => ({
                    ...prev,
                    is_paid:
                      !prev.is_paid,
                  }))
                }
              >

                <View
                  style={[
                    styles.checkbox,
                    formData.is_paid &&
                      styles.checkboxActive,
                  ]}
                >

                  {formData.is_paid && (
                    <MaterialCommunityIcons
                      name="check"
                      size={17}
                      color="#fff"
                    />
                  )}

                </View>

                <Text
                  style={
                    styles.paidText
                  }
                >
                  Is Paid?
                </Text>

              </TouchableOpacity>

            </SectionCard>


            {/* =====================================
                TOTAL SUMMARY
            ====================================== */}

            <View
              style={styles.summaryCard}
            >

              <View>
                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  Total Amount
                </Text>

                <Text
                  style={
                    styles.summaryAmount
                  }
                >
                  ETB{' '}
                  {Number(
                    formData.amount_received ||
                      0
                  ).toFixed(2)}
                </Text>
              </View>

              <View
                style={
                  styles.summaryRight
                }
              >

                <Text
                  style={
                    styles.summarySmall
                  }
                >
                  {formData.item_piece || 0}{' '}
                  Pieces
                </Text>

                <Text
                  style={
                    styles.summarySmall
                  }
                >
                  {Number(
                    formData.item_kilo || 0
                  ).toFixed(2)}{' '}
                  kg
                </Text>

              </View>

            </View>


            {/* =====================================
                ACTIONS
            ====================================== */}

            <View
              style={styles.actions}
            >

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                disabled={loading}
                onPress={() =>
                  navigation.goBack()
                }
              >

                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.submitButton
                }
                disabled={loading}
                onPress={handleSubmit}
              >

                {loading ? (

                  <ActivityIndicator
                    color="#fff"
                  />

                ) : (

                  <>
                    <MaterialCommunityIcons
                      name="truck-check"
                      size={21}
                      color="#fff"
                    />

                    <Text
                      style={
                        styles.submitText
                      }
                    >
                      Create Bill
                    </Text>
                  </>

                )}

              </TouchableOpacity>

            </View>


            <View
              style={{ height: 30 }}
            />

          </ScrollView>

        </KeyboardAvoidingView>

      </SafeAreaView>


      {/* ============================================
          ADD MODAL
      ============================================= */}

      <AddEntityModal
        visible={modalVisible}
        type={modalType}
        form={modalForm}
        onChange={handleModalChange}
        onClose={() =>
          setModalVisible(false)
        }
        onSave={saveAndSelect}
        loading={false}
      />

    </LinearGradient>

  );

};


// ======================================================
// SECTION CARD
// ======================================================

const SectionCard = ({
  title,
  icon,
  children,
  rightButton,
}) => (

  <View style={styles.sectionCard}>

    <View
      style={styles.sectionHeader}
    >

      <View
        style={styles.sectionTitleRow}
      >

        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={COLORS.cyan}
        />

        <Text
          style={styles.sectionTitle}
        >
          {title}
        </Text>

      </View>

      {rightButton}

    </View>

    {children}

  </View>

);


// ======================================================
// FIELD LABEL
// ======================================================

const FieldLabel = ({
  children,
}) => (

  <Text style={styles.label}>
    {children}
  </Text>

);


// ======================================================
// SEARCH SELECTOR
// ======================================================

// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
// import { MaterialCommunityIcons } from '@expo/vector-icons'; // Adjust based on your icon library
// import { theme } from '../theme/theme';

const SearchSelector = ({
  value,
  search,
  setSearch,
  placeholder,
  options,
  onSelect,
  displayItem,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.searchSelector}>
      <View style={styles.searchInputContainer}>
        <MaterialCommunityIcons
          name={value ? 'check-circle' : 'magnify'}
          size={20}
          color={value ? theme.colors.success : theme.colors.cyan}
        />

        <TextInput
          style={styles.searchInput}
          placeholder={value || placeholder}
          placeholderTextColor={value ? theme.colors.cyanLight : '#6f849b'}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {value && !search && (
          <MaterialCommunityIcons
            name="check"
            size={19}
            color={theme.colors.success}
          />
        )}
      </View>

      {isFocused && search.length >= 0 && (
        <View style={styles.dropdown}>
          {/* Scrollable container with fixed/max height */}
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {options.length === 0 ? (
              <Text style={styles.noResults}>No results found</Text>
            ) : (
              options.map((item) => (
                <TouchableOpacity
                  key={item.id || item.uuid}
                  style={styles.dropdownItem}
                  onPressIn={() => {
                    onSelect(item);
                    // setIsFocused(false);
                  }}
                >
                  <View style={styles.dropdownIcon}>
                    <MaterialCommunityIcons
                      name="account"
                      size={17}
                      color={theme.colors.cyan}
                    />
                  </View>

                  <View style={styles.dropdownInfo}>
                    <Text style={styles.dropdownName}>{item.name}</Text>
                    <Text style={styles.dropdownSub}>{displayItem(item)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};


// ======================================================
// SMALL BUTTON
// ======================================================

const SmallButton = ({
  title,
  icon,
  onPress,
}) => (

  <TouchableOpacity
    style={styles.smallButton}
    onPress={onPress}
  >

    <MaterialCommunityIcons
      name={icon}
      size={16}
      color={COLORS.cyan}
    />

    <Text
      style={styles.smallButtonText}
    >
      {title}
    </Text>

  </TouchableOpacity>

);


// ======================================================
// ADD ENTITY MODAL
// ======================================================

const AddEntityModal = ({
  visible,
  type,
  form,
  onChange,
  onClose,
  onSave,
}) => {

  const title =
    type === 'sender'
      ? 'Add New Sender'
      : type === 'consignee'
        ? 'Add New Consignee'
        : 'Add New Service Type';


  return (

    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >

      <View
        style={styles.modalOverlay}
      >

        <View
          style={styles.modalCard}
        >

          <View
            style={styles.modalHeader}
          >

            <Text
              style={styles.modalTitle}
            >
              {title}
            </Text>

            <TouchableOpacity
              onPress={onClose}
            >

              <MaterialCommunityIcons
                name="close"
                size={25}
                color="#fff"
              />

            </TouchableOpacity>

          </View>


          {/* NAME */}

          <Text
            style={styles.label}
          >
            Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#6f849b"
            value={
              form.name || ''
            }
            onChangeText={value =>
              onChange(
                'name',
                value
              )
            }
          />


          {/* PHONE */}

          {type !== 'service' && (

            <>
              <Text
                style={styles.label}
              >
                Phone
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor="#6f849b"
                keyboardType="phone-pad"
                value={
                  form.phone || ''
                }
                onChangeText={value =>
                  onChange(
                    'phone',
                    value
                  )
                }
              />
            </>

          )}


          {/* TIN */}

          {type === 'sender' && (

            <>
              <Text
                style={styles.label}
              >
                TIN Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="TIN Number"
                placeholderTextColor="#6f849b"
                value={
                  form.tin_number ||
                  ''
                }
                onChangeText={value =>
                  onChange(
                    'tin_number',
                    value
                  )
                }
              />
            </>

          )}


          {/* COUNTRY */}

          {type !== 'service' && (

            <>
              <Text
                style={styles.label}
              >
                Country
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor="#6f849b"
                value={
                  form.country || ''
                }
                onChangeText={value =>
                  onChange(
                    'country',
                    value
                  )
                }
              />
            </>

          )}


          <View
            style={styles.modalActions}
          >

            <TouchableOpacity
              style={
                styles.modalCancel
              }
              onPress={onClose}
            >

              <Text
                style={
                  styles.modalCancelText
                }
              >
                Cancel
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={
                styles.modalSave
              }
              onPress={onSave}
            >

              <MaterialCommunityIcons
                name="content-save"
                size={18}
                color="#fff"
              />

              <Text
                style={
                  styles.modalSaveText
                }
              >
                Save & Select
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </View>

    </Modal>

  );

};


// ======================================================
// HELPERS
// ======================================================

const tierValue = (
  price,
  value,
  isPer
) => {

  const numericPrice =
    Number(price) || 0;

  const numericValue =
    Number(value) || 0;

  return isPer
    ? numericPrice *
        numericValue
    : numericPrice;

};


const extractApiError = err => {

  const data =
    err?.response?.data;

  if (!data) {
    return null;
  }


  if (
    typeof data === 'string'
  ) {
    return data;
  }


  if (
    data.detail
  ) {

    if (
      Array.isArray(
        data.detail
      )
    ) {
      return data.detail[0];
    }

    return data.detail;
  }


  if (
    data.non_field_errors
  ) {

    return Array.isArray(
      data.non_field_errors
    )
      ? data.non_field_errors[0]
      : data.non_field_errors;

  }


  const firstField =
    Object.values(data)[0];


  if (
    Array.isArray(
      firstField
    )
  ) {

    return firstField[0];

  }


  if (
    typeof firstField === 'string'
  ) {

    return firstField;

  }


  return 'Request failed.';

};


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  flex: {
    flex: 1,
  },

  background: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  contentContainer: {
    padding: 10,
    paddingBottom: 40,
  },


  // -----------------------------------------------
  // HEADER
  // -----------------------------------------------

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 10,
    marginBottom: 5,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },

  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },

  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  networkDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },

  networkText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },


  // -----------------------------------------------
  // OFFLINE
  // -----------------------------------------------

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },

  offlineText: {
    color: '#fff',
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },


  // -----------------------------------------------
  // SECTION
  // -----------------------------------------------

  sectionCard: {
    backgroundColor:
      'rgba(2,21,46,0.94)',

    borderRadius: 20,

    padding: 15,

    marginBottom: 10,

    borderWidth: 1,

    borderColor:
      'rgba(0,216,255,0.12)',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.25,

    shadowRadius: 12,

    elevation: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },


  // -----------------------------------------------
  // LABEL
  // -----------------------------------------------

  label: {
    color: '#8c9db1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },


  // -----------------------------------------------
  // INPUT
  // -----------------------------------------------

  input: {
    backgroundColor: COLORS.input,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 10,

    paddingHorizontal: 12,

    paddingVertical: 11,

    color: '#fff',

    fontSize: 14,
  },

  textarea: {
    height: 85,
    textAlignVertical: 'top',
  },

  textareaSmall: {
    height: 65,
    textAlignVertical: 'top',
  },


  // -----------------------------------------------
  // ROW
  // -----------------------------------------------

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  half: {
    flex: 1,
  },


  // -----------------------------------------------
  // PICKER
  // -----------------------------------------------

  pickerContainer: {
    backgroundColor:
      COLORS.input,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 10,

    overflow: 'hidden',
  },

  smallPicker: {
    backgroundColor:
      COLORS.input,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 10,

    overflow: 'hidden',
  },

  picker: {
    color: '#fff',
    height: 50,
  },


  // -----------------------------------------------
  // SEARCH
  // -----------------------------------------------

  searchSelector: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 3,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      COLORS.input,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 10,

    paddingHorizontal: 10,
  },

  searchInput: {
    flex: 1,

    color: '#fff',

    fontSize: 14,

    paddingVertical: 11,

    paddingHorizontal: 8,
  },

  dropdown: {
    backgroundColor:
      '#06213F',

    borderRadius: 10,

    marginTop: 4,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    maxHeight: 220,

    elevation: 10,
    overflow: 'hidden',
  },

  dropdownItem: {
    flexDirection: 'row',

    alignItems: 'center',

    padding: 11,

    borderBottomWidth: 1,

    borderBottomColor:
      'rgba(255,255,255,0.05)',
  },

  dropdownIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,

    backgroundColor:
      'rgba(0,216,255,0.1)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownInfo: {
    marginLeft: 9,
    flex: 1,
  },

  dropdownName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  dropdownSub: {
    color: COLORS.cyanLight,
    fontSize: 11,
    marginTop: 2,
  },

  noResults: {
    color: '#8c9db1',
    padding: 15,
    textAlign: 'center',
  },


  // -----------------------------------------------
  // SMALL BUTTON
  // -----------------------------------------------

  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderRadius: 9,

    backgroundColor:
      'rgba(0,216,255,0.08)',

    marginTop: 6,
    marginBottom: 5,
  },

  smallButtonText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  dropdownScroll: {
    maxHeight: 200, // Sets a fixed maximum height so it becomes scrollable
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
  },

  // -----------------------------------------------
  // ITEM
  // -----------------------------------------------

  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      COLORS.purple,

    borderRadius: 9,

    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  addItemButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },

  itemCard: {
    backgroundColor:
      '#041B34',

    borderWidth: 1,

    borderColor:
      'rgba(0,216,255,0.10)',

    borderRadius: 14,

    padding: 12,

    marginBottom: 10,
  },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  itemNumber: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: '700',
  },


  // -----------------------------------------------
  // DIMENSIONS
  // -----------------------------------------------

  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dimensionInput: {
    flex: 1,

    backgroundColor:
      COLORS.input,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 9,

    paddingHorizontal: 8,
    paddingVertical: 10,

    color: '#fff',

    fontSize: 13,

    textAlign: 'center',
  },

  dimensionX: {
    color: COLORS.cyan,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 6,
  },

  volumeBox: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(0,216,255,0.07)',

    borderRadius: 12,

    padding: 11,

    marginTop: 12,
  },

  volumeLabel: {
    color: '#8c9db1',
    fontSize: 10,
  },

  volumeValue: {
    color: COLORS.cyan,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },


  // -----------------------------------------------
  // PAYMENT
  // -----------------------------------------------

  amountContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      COLORS.input,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 10,
  },

  currencyText: {
    color: COLORS.cyan,

    fontWeight: '700',

    paddingLeft: 12,
  },

  amountInput: {
    flex: 1,

    color: '#fff',

    paddingHorizontal: 10,

    paddingVertical: 11,

    fontSize: 18,

    fontWeight: '700',
  },

  autoPricingText: {
    color: '#70869e',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 5,
  },

  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  checkbox: {
    width: 23,
    height: 23,

    borderRadius: 6,

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.3)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  paidText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 9,
  },


  // -----------------------------------------------
  // SUMMARY
  // -----------------------------------------------

  summaryCard: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    backgroundColor:
      COLORS.navy,

    borderWidth: 1,

    borderColor:
      'rgba(0,216,255,0.25)',

    borderRadius: 18,

    padding: 16,

    marginBottom: 12,
  },

  summaryLabel: {
    color: '#8c9db1',
    fontSize: 11,
  },

  summaryAmount: {
    color: COLORS.cyan,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 3,
  },

  summaryRight: {
    alignItems: 'flex-end',
  },

  summarySmall: {
    color: '#8c9db1',
    fontSize: 11,
    marginBottom: 3,
  },


  // -----------------------------------------------
  // ACTIONS
  // -----------------------------------------------

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,

    borderRadius: 12,

    paddingVertical: 15,

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  cancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  submitButton: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      COLORS.purple,

    borderRadius: 12,

    paddingVertical: 15,

    elevation: 4,
  },

  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 7,
  },


  // -----------------------------------------------
  // MODAL
  // -----------------------------------------------

  modalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(0,0,0,0.7)',

    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor:
      COLORS.navy,

    borderTopLeftRadius: 25,

    borderTopRightRadius: 25,

    padding: 20,

    borderWidth: 1,

    borderColor:
      'rgba(0,216,255,0.2)',
  },

  modalHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 15,
  },

  modalTitle: {
    color: '#fff',

    fontSize: 20,

    fontWeight: '700',
  },

  modalActions: {
    flexDirection: 'row',

    gap: 10,

    marginTop: 20,
  },

  modalCancel: {
    flex: 1,

    paddingVertical: 13,

    alignItems: 'center',

    borderRadius: 10,

    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  modalCancelText: {
    color: '#fff',
    fontWeight: '700',
  },

  modalSave: {
    flex: 1,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    paddingVertical: 13,

    borderRadius: 10,

    backgroundColor:
      COLORS.purple,
  },

  modalSaveText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },

});

export default CreateBillScreen;
