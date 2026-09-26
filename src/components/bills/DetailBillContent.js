// src/components/DetailBillContent.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Share,
  Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { END_POINT, FrontEndURL } from '../../constants/urls';
import EposPrinter from './EposPrinter';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Alert } from '../Alert';
import api from '../../utils/axioServices';
// import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

const DetailBillContent = ({ bill, loading, error, onSearch, navigation }) => {
  const [commonTrackingNo, setCommonTrackingNo] = useState('');
  const [searchText, setSearchText] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [downloadingPNG, setDownloadingPNG] = useState(false);
  const [sharingPNG, setSharingPNG] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsModalVisible, setSmsModalVisible] = useState(false);

  // Reference for hidden EposPrinter thermal card
  const printRef = useRef(null);

  useEffect(() => {
    const tracking = bill?.tracking_no || bill?.uuid || '';

    setCommonTrackingNo(tracking);

    if (tracking) {
      setTrackingUrl(`${FrontEndURL}/bills/print/${tracking}`);
    } else {
      setTrackingUrl('');
    }
  }, [bill]);

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (error || !bill) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={styles.errorText}>
          {error || 'Bill not found'}
        </Text>
      </View>
    );
  }

  /**
   * Share tracking link
   */
  const handleShareLink = async () => {
    if (!trackingUrl) {
      Alert.alert('Error', 'Tracking link is not available.');
      return;
    }

    try {
      await Share.share({
        message: `View Air Waybill tracking details here:\n${trackingUrl}`,
      });
    } catch (err) {
      console.error('Error sharing tracking link:', err);
    }
  };

  /**
   * Generate the PNG from EposPrinter.
   *
   * Returns the final custom-named PNG URI.
   */
  const generatePNG = async () => {
    if (!printRef.current) {
      throw new Error('Thermal print template reference not ready.');
    }

    const tempUri = await captureRef(printRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    const rawCompanyName =
      bill?.company?.name || 'Z-EXPRESS';

    const safeCompanyName = rawCompanyName
      .toString()
      .replace(/[^a-zA-Z0-9]/g, '_');

    const safeTrackingNo = (commonTrackingNo || 'BILL')
      .toString()
      .replace(/[^a-zA-Z0-9]/g, '_');

    const fileName = `${safeCompanyName}_${safeTrackingNo}.png`;

    const destinationFile = new File(
      Paths.cache,
      fileName
    );

    if (destinationFile.exists) {
      destinationFile.delete();
    }

    const sourceFile = new File(tempUri);

    sourceFile.copy(destinationFile);

    return {
      uri: destinationFile.uri,
      fileName,
    };
  };

  const sendSMS = async (type) => {
    let endpoint = '';

    switch (type) {
      case 'sender':
        endpoint = 'send_sender_sms';
        break;

      case 'consignee':
        endpoint = 'send_consignee_sms';
        break;

      case 'both':
        endpoint = 'send_both_sms';
        break;

      default:
        return;
    }

    if (!bill?.id) {
      Alert.alert('SMS', 'Bill ID is not available.');
      return;
    }

    if (sendingSMS) return;

    setSendingSMS(true);

    try {
      const response = await api.post(
        `${END_POINT}/express-api/api/bills/${bill.id}/${endpoint}/`
      );

      Alert.alert(
        'SMS',
        response?.data?.message || 'SMS sent successfully.'
      );
    } catch (err) {
      console.error('SMS failed:', err);

      Alert.alert(
        'SMS Failed',
        err?.response?.data?.message || 'Could not send SMS.'
      );
    } finally {
      setSendingSMS(false);
    }
  };



  /**
   * Download / save PNG
   */
  // const handleDownloadPNG = async () => {
  //   if (downloadingPNG || sharingPNG) return;

  //   setDownloadingPNG(true);

  //   try {
  //     const { uri, fileName } = await generatePNG();

  //     const permission =
  //       await MediaLibrary.requestPermissionsAsync();

  //     if (!permission.granted) {
  //       Alert.alert(
  //         'Permission Required',
  //         'Please allow photo/media access so the PNG can be saved to your device.'
  //       );
  //       return;
  //     }

  //     const asset = await MediaLibrary.createAssetAsync(uri);

  //     // Put it into a "Z-EXPRESS" album
  //     const albumName = 'Z-EXPRESS';

  //     const album =
  //       await MediaLibrary.getAlbumAsync(albumName);

  //     if (album) {
  //       await MediaLibrary.addAssetsToAlbumAsync(
  //         [asset],
  //         album,
  //         false
  //       );
  //     } else {
  //       await MediaLibrary.createAlbumAsync(
  //         albumName,
  //         asset,
  //         false
  //       );
  //     }

  //     Alert.alert(
  //       'Download Complete',
  //       `${fileName} has been saved to your device.`
  //     );
  //   } catch (err) {
  //     console.error(
  //       'Failed to download PNG:',
  //       err
  //     );

  //     Alert.alert(
  //       'Error',
  //       'Could not save bill as PNG.'
  //     );
  //   } finally {
  //     setDownloadingPNG(false);
  //   }
  // };



  /**
   * Share PNG
   */
  const handleSharePNG = async () => {
    if (downloadingPNG || sharingPNG) return;

    setSharingPNG(true);

    try {
      const { uri, fileName } = await generatePNG();

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          'Error',
          'Image sharing is not supported on this device.'
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: `Share ${fileName}`,
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch (err) {
      console.error(
        'Failed to share PNG:',
        err
      );

      Alert.alert(
        'Error',
        'Could not share bill as PNG image.'
      );
    } finally {
      setSharingPNG(false);
    }
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Search Header Group */}
      {/* <View style={styles.searchGroup}>
        {navigation && (
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons
              name="home"
              size={20}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.input}
          placeholder="Tracking No / Phone / Bill ID"
          placeholderTextColor={theme.colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          editable={false}
        />

        <TouchableOpacity
          style={styles.searchButton}
          disabled
        >
          <Text style={styles.buttonText}>
            Search
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Action Buttons */}
      <View style={styles.toolbar}>

        {/* QR CODE */}
        <TouchableOpacity
          style={[
            styles.toolButton,
            { backgroundColor: theme.colors.info },
          ]}
          onPress={() => setQrModalVisible(true)}
          disabled={downloadingPNG || sharingPNG}
        >
          <Ionicons
            name="qr-code"
            size={18}
            color={theme.colors.white}
          />

          <Text style={styles.buttonText}>
            QR Code
          </Text>
        </TouchableOpacity>


        {/* DOWNLOAD PNG */}
        {/* <TouchableOpacity
          style={[
            styles.toolButton,
            { backgroundColor: theme.colors.success },
          ]}
          onPress={handleDownloadPNG}
          disabled={downloadingPNG || sharingPNG}
        >
          {downloadingPNG ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.white}
            />
          ) : (
            <Ionicons
              name="download-outline"
              size={18}
              color={theme.colors.white}
            />
          )}

          <Text style={styles.buttonText}>
            {downloadingPNG
              ? ' Saving...'
              : ' Download PNG'}
          </Text>
        </TouchableOpacity> */}


        {/* SHARE PNG */}
        <TouchableOpacity
          style={[
            styles.toolButton,
            { backgroundColor: '#7C3AED' },
          ]}
          onPress={handleSharePNG}
          disabled={downloadingPNG || sharingPNG}
        >
          {sharingPNG ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.white}
            />
          ) : (
            <Ionicons
              name="image-outline"
              size={18}
              color={theme.colors.white}
            />
          )}

          <Text style={styles.buttonText}>
            {sharingPNG
              ? ' Preparing...'
              : ' Share PNG'}
          </Text>
        </TouchableOpacity>


        {/* SHARE LINK */}
        <TouchableOpacity
          style={[
            styles.toolButton,
            {
              backgroundColor:
                theme.colors.primaryDark || '#333',
            },
          ]}
          onPress={handleShareLink}
          disabled={
            !trackingUrl ||
            downloadingPNG ||
            sharingPNG
          }
        >
          <Ionicons
            name="link-outline"
            size={18}
            color={theme.colors.white}
          />

          <Text style={styles.buttonText}>
            Share Link
          </Text>
        </TouchableOpacity>
        
        {/* SEND SMS */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={[
            styles.smsToolbarButton,
            (sendingSMS || downloadingPNG || sharingPNG) &&
              styles.disabledButton,
          ]}
          onPress={() => setSmsModalVisible(true)}
          disabled={
            sendingSMS ||
            downloadingPNG ||
            sharingPNG
          }
        >
          <View style={styles.smsIconContainer}>
            {sendingSMS ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="chatbubbles"
                size={24}
                color={theme.colors.primaryDark}
              />

            )}
          </View>

          <View style={styles.smsButtonContent}>
            <Text style={styles.smsButtonTitle}>
              {sendingSMS ? 'Sending...' : 'Send SMS'}
            </Text>

            <Text style={styles.smsButtonSubtitle}>
              Notify customers
            </Text>
          </View>

          {!sendingSMS && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#BAE6FD"
            />
          )}
        </TouchableOpacity>


      </View>

      {/* Bill Details Card */}
      {/* EPOS STYLE BILL DETAILS */}
      <View style={styles.eposCard}>
        {/* HEADER */}
        <View style={styles.eposHeader}>
          <Text style={styles.eposCompany}>
            {bill?.company?.name || 'Z-EXPRESS'}
          </Text>

          {bill?.company?.phone ? (
            <Text style={styles.eposItalic}>
              {bill.company.phone}
            </Text>
          ) : null}

          <Text style={styles.eposItalic}>
            Fast . Reliable . Worldwide
          </Text>
        </View>

        <View style={styles.eposDivider} />

        {/* SHIPMENT INFORMATION */}
        <Text style={styles.eposSectionTitle}>
          SHIPMENT INFORMATION
        </Text>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>Tracking:</Text>
          <Text style={styles.eposValue}>
            {bill?.tracking_no || bill?.uuid || '-'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>Date:</Text>
          <Text style={styles.eposValue}>
            {bill?.created_at
              ? new Date(bill.created_at).toLocaleDateString()
              : '-'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>Description:</Text>
          <Text style={styles.eposValue}>
            {bill?.description_of_goods || '-'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>Originated:</Text>
          <Text style={styles.eposValue}>
            {bill?.branch?.name || '-'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>Destiny:</Text>
          <Text style={styles.eposValue}>
            {bill?.destiny_branch?.name || '-'}
          </Text>
        </View>

        <View style={styles.eposDivider} />

        {/* SENDER */}
        <View style={styles.eposPersonRow}>
          <Text style={styles.eposBold}>
            SENDER:
          </Text>

          <Text style={styles.eposPersonValue}>
            {bill?.sender?.name ||
              bill?.sender_name ||
              '-'}
            {bill?.sender?.phone
              ? `, ${bill.sender.phone}`
              : ''}
          </Text>
        </View>

        {/* RECEIVER */}
        <View style={styles.eposPersonRow}>
          <Text style={styles.eposBold}>
            RECEIVER:
          </Text>

          <Text style={styles.eposPersonValue}>
            {bill?.consignee?.name ||
              bill?.consignee_name ||
              '-'}
            {bill?.consignee?.phone
              ? `, ${bill.consignee.phone}`
              : ''}
          </Text>
        </View>

        <View style={styles.eposDivider} />

        {/* ITEMS */}
        <Text style={styles.eposSectionTitle}>
          ITEM DETAILS
        </Text>

        {bill?.items?.length ? (
          bill.items.map((item, index) => {
            const description =
              item?.description || 'Item';

            return (
              <View
                key={item?.id || index}
                style={styles.eposItem}
              >
                <Text style={styles.eposItemTitle}>
                  {index + 1}. {description}
                </Text>

                <View style={styles.eposRow}>
                  <Text style={styles.eposLabel}>
                    Qty:
                  </Text>
                  <Text style={styles.eposValue}>
                    {item?.quantity || 1}
                  </Text>
                </View>

                <View style={styles.eposRow}>
                  <Text style={styles.eposLabel}>
                    Weight:
                  </Text>
                  <Text style={styles.eposValue}>
                    {item?.weight || 0} KG
                  </Text>
                </View>

                <View style={styles.eposRow}>
                  <Text style={styles.eposLabel}>
                    Type:
                  </Text>
                  <Text style={styles.eposValue}>
                    {item?.item_type || '-'}
                  </Text>
                </View>

                <View style={styles.eposRow}>
                  <Text style={styles.eposLabel}>
                    Price:
                  </Text>
                  <Text style={styles.eposValue}>
                    {Number(item?.price || 0).toFixed(2)} ETB
                  </Text>
                </View>

                <View style={styles.eposRow}>
                  <Text style={styles.eposLabel}>
                    Amount:
                  </Text>
                  <Text style={styles.eposValue}>
                    {(
                      Number(item?.quantity || 1) *
                      Number(item?.price || 0)
                    ).toFixed(2)} ETB
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.eposEmpty}>
            No items
          </Text>
        )}

        <View style={styles.eposDivider} />

        {/* PAYMENT */}
        <Text style={styles.eposSectionTitle}>
          PAYMENT SUMMARY
        </Text>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>
            Payment:
          </Text>

          <Text style={styles.eposValue}>
            {bill?.payment_method
              ? `${bill.payment_method.toUpperCase()} / ${
                  bill?.is_paid ? 'Paid' : 'Not Paid'
                }`
              : '-'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>
            Status:
          </Text>

          <Text
            style={[
              styles.eposValue,
              {
                color:
                  bill?.status?.toLowerCase() === 'delivered'
                    ? '#16A34A'
                    : '#000000',
              },
            ]}
          >
            {bill?.status || 'Pending'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>
            Weight:
          </Text>

          <Text style={styles.eposValue}>
            {bill?.item_kilo
              ? `${bill.item_kilo} KG`
              : '-'}
          </Text>
        </View>

        <View style={styles.eposRow}>
          <Text style={styles.eposLabel}>
            Pieces:
          </Text>

          <Text style={styles.eposValue}>
            {bill?.item_piece || '-'}
          </Text>
        </View>

        <View style={styles.eposDivider} />

        {/* TOTAL */}
        <View style={styles.eposTotalRow}>
          <Text style={styles.eposTotal}>
            TOTAL
          </Text>

          <Text style={styles.eposTotal}>
            {bill?.amount_received
              ? Number(bill.amount_received).toFixed(2)
              : '0.00'} ETB
          </Text>
        </View>

        <View style={styles.eposDivider} />

        {/* FOOTER */}
        <View style={styles.eposFooter}>
          <Text style={styles.eposBold}>
            Track Shipment
          </Text>

          <Text style={styles.eposValue}>
            {bill?.tracking_no || bill?.uuid || '-'}
          </Text>

          <Text style={styles.eposThankYou}>
            Thank You!
          </Text>

          <Text style={styles.eposBold}>
            Z-Prime
          </Text>

          <Text style={styles.eposItalic}>
            The Soul of Modern Logistics
          </Text>

          <View style={styles.eposPowered}>
            <Text style={styles.eposSmall}>
              Powered by
            </Text>

            <Text style={styles.eposPoweredBold}>
              Zeal Technologies
            </Text>
          </View>
        </View>
      </View>


      {/* Hidden Thermal Printer View */}
      <View style={styles.hiddenPrinterContainer}>
        <EposPrinter
          ref={printRef}
          data={bill}
        />
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setQrModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>
              Bill QR Code
            </Text>

            <View style={styles.qrContainer}>
              {trackingUrl ? (
                <QRCode
                  value={trackingUrl}
                  size={220}
                />
              ) : (
                <Text>
                  Tracking link unavailable
                </Text>
              )}

              <Text style={styles.qrText}>
                {commonTrackingNo}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.toolButton,
                {
                  backgroundColor:
                    theme.colors.dangerLight,
                  marginTop: 15,
                },
              ]}
              onPress={() =>
                setQrModalVisible(false)
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: theme.colors.danger,
                  },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* SMS Send Modal */}

      <Modal
        visible={smsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSmsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smsModalContent}>

            {/* Header */}
            <View style={styles.smsModalHeader}>
              <View style={styles.smsModalIcon}>
                <Ionicons
                  name="chatbubbles"
                  size={24}
                  color="#0284C7"
                />
              </View>

              <View style={styles.smsModalHeaderText}>
                <Text style={styles.smsModalTitle}>
                  Send SMS
                </Text>

                <Text style={styles.smsModalSubtitle}>
                  Choose who should receive the notification
                </Text>
              </View>

              <TouchableOpacity
                style={styles.smsCloseButton}
                onPress={() => setSmsModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* Sender */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.smsOptionCard,
                { borderColor: '#BFDBFE' },
              ]}
              onPress={() => {
                setSmsModalVisible(false);
                sendSMS('sender');
              }}
              disabled={sendingSMS}
            >
              <View
                style={[
                  styles.smsOptionIcon,
                  { backgroundColor: '#DBEAFE' },
                ]}
              >
                <Ionicons
                  name="arrow-up"
                  size={21}
                  color="#2563EB"
                />
              </View>

              <View style={styles.smsOptionContent}>
                <Text style={styles.smsOptionTitle}>
                  Sender
                </Text>

                <Text style={styles.smsOptionDescription}>
                  Send notification to the sender
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {/* Consignee */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.smsOptionCard,
                { borderColor: '#BBF7D0' },
              ]}
              onPress={() => {
                setSmsModalVisible(false);
                sendSMS('consignee');
              }}
              disabled={sendingSMS}
            >
              <View
                style={[
                  styles.smsOptionIcon,
                  { backgroundColor: '#DCFCE7' },
                ]}
              >
                <Ionicons
                  name="arrow-down"
                  size={21}
                  color="#16A34A"
                />
              </View>

              <View style={styles.smsOptionContent}>
                <Text style={styles.smsOptionTitle}>
                  Consignee
                </Text>

                <Text style={styles.smsOptionDescription}>
                  Send notification to the receiver
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {/* Both */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.smsOptionCard,
                { borderColor: '#DDD6FE' },
              ]}
              onPress={() => {
                setSmsModalVisible(false);
                sendSMS('both');
              }}
              disabled={sendingSMS}
            >
              <View
                style={[
                  styles.smsOptionIcon,
                  { backgroundColor: '#EDE9FE' },
                ]}
              >
                <Ionicons
                  name="people"
                  size={21}
                  color="#7C3AED"
                />
              </View>

              <View style={styles.smsOptionContent}>
                <Text style={styles.smsOptionTitle}>
                  Sender & Consignee
                </Text>

                <Text style={styles.smsOptionDescription}>
                  Notify both customers at once
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.smsCancelButton}
              onPress={() => setSmsModalVisible(false)}
            >
              <Text style={styles.smsCancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    color: theme.colors.danger,
    fontSize: 16,
  },

  searchGroup: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: theme.spacing.xs,
  },

  homeButton: {
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },

  input: {
    flex: 1,
    backgroundColor:
      theme.colors.surfaceSecondary,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  searchButton: {
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },

  /*
   * Four action buttons:
   * QR Code
   * Download PNG
   * Share PNG
   * Share Link
   */
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    width: '100%',
  },

  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    ...theme.shadows.button,
  },

  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: 6,
  },

  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  cardTitle: {
    color: theme.colors.cyan,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  label: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  value: {
    color: theme.colors.text,
    fontWeight: '600',
  },

  hiddenPrinterContainer: {
    position: 'absolute',
    left: -1000,
    top: -1000,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      theme.colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: width * 0.85,
    backgroundColor:
      theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },

  qrContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },

  qrText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  eposCard: {
  width: '100%',
  maxWidth: 450,
  backgroundColor: '#FFFFFF',
  padding: 16,
  borderRadius: theme.radius.md,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  ...theme.shadows.card,
},

  eposHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },

  eposCompany: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },

  eposItalic: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333333',
    textAlign: 'center',
  },

  eposDivider: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderStyle: 'dashed',
    marginVertical: 10,
  },

  eposSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 7,
    fontFamily: 'monospace',
  },

  eposRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 10,
  },

  eposLabel: {
    flex: 1,
    fontSize: 12,
    color: '#333333',
    fontFamily: 'monospace',
  },

  eposValue: {
    flex: 1.5,
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'right',
    fontFamily: 'monospace',
  },

  eposBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },

  eposPersonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },

  eposPersonValue: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: '#000000',
    fontFamily: 'monospace',
  },

  eposItem: {
    paddingVertical: 6,
    marginBottom: 4,
  },

  eposItemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'monospace',
  },

  eposEmpty: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 10,
  },

  eposTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },

  eposTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'monospace',
  },

  eposFooter: {
    alignItems: 'center',
    marginTop: 8,
  },

  eposThankYou: {
    fontSize: 13,
    color: '#000000',
    marginVertical: 8,
  },

  eposPowered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  eposSmall: {
    fontSize: 10,
    color: '#555555',
  },

  eposPoweredBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111111',
    marginLeft: 3,
  },
  smsToolbarButton: {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 58,
  paddingVertical: 8,
  paddingHorizontal: 10,
  paddingRight: 14,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.primaryDark,
  borderWidth: 1,
  borderColor: theme.colors.primary,
  shadowColor: theme.colors.primaryDark,
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.22,
  shadowRadius: 8,
  elevation: 5,
},

smsIconContainer: {
  width: 40,
  height: 40,
  borderRadius: theme.radius.md,
  backgroundColor: theme.colors.backgroundSecondary,
  justifyContent: 'center',
  alignItems: 'center',
},

smsButtonContent: {
  marginLeft: 10,
  marginRight: 10,
  justifyContent: 'center',
},

smsButtonTitle: {
  color: theme.colors.white,
  fontSize: 14,
  fontWeight: '800',
  letterSpacing: 0.2,
},

smsButtonSubtitle: {
  color: theme.colors.primaryLight,
  fontSize: 10,
  fontWeight: '500',
  marginTop: 2,
},

disabledButton: {
  opacity: 0.65,
},

smsModalContent: {
  width: width * 0.90,
  maxWidth: 440,
  backgroundColor: theme.colors.surfaceElevated,
  borderRadius: theme.radius.xxl,
  padding: theme.spacing.xxl,
  borderWidth: 1,
  borderColor: theme.colors.border,
  ...theme.shadows.elevated,
},

smsModalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: theme.spacing.xxl,
},

smsModalIcon: {
  width: 48,
  height: 48,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.infoLight,
  justifyContent: 'center',
  alignItems: 'center',
},

smsModalHeaderText: {
  flex: 1,
  marginLeft: theme.spacing.lg,
},

smsModalTitle: {
  fontSize: 19,
  fontWeight: '800',
  color: theme.colors.text,
},

smsModalSubtitle: {
  fontSize: 11,
  color: theme.colors.textSecondary,
  marginTop: 3,
  lineHeight: 16,
},

smsCloseButton: {
  width: 36,
  height: 36,
  borderRadius: theme.radius.round,
  backgroundColor: theme.colors.overlayLight,
  justifyContent: 'center',
  alignItems: 'center',
},

smsOptionCard: {
  width: '100%',
  minHeight: 72,
  borderRadius: theme.radius.lg,
  borderWidth: 1,
  backgroundColor: theme.colors.surfaceSecondary,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: theme.spacing.lg,
  marginBottom: theme.spacing.sm,
},

smsOptionIcon: {
  width: 44,
  height: 44,
  borderRadius: theme.radius.md,
  justifyContent: 'center',
  alignItems: 'center',
},

smsOptionContent: {
  flex: 1,
  marginLeft: theme.spacing.lg,
  marginRight: theme.spacing.sm,
},

smsOptionTitle: {
  fontSize: 14,
  fontWeight: '800',
  color: theme.colors.text,
},

smsOptionDescription: {
  fontSize: 11,
  color: theme.colors.textSecondary,
  marginTop: 3,
},

smsCancelButton: {
  height: 48,
  borderRadius: theme.radius.md,
  backgroundColor: theme.colors.overlayLight,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: theme.spacing.sm,
  borderWidth: 1,
  borderColor: theme.colors.borderLight,
},

smsCancelText: {
  fontSize: 14,
  fontWeight: '700',
  color: theme.colors.textSecondary,
},


});

export default DetailBillContent;
