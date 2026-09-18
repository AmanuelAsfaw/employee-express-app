// src/components/bills/EposPrinter.js
import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';

const EposPrinter = forwardRef(({ data }, ref) => {
  const money = (v) => Number(v || 0).toFixed(2);

  const LineDivider = () => <View style={styles.divider} />;

  return (
    <View ref={ref} collapsable={false} style={styles.receiptContainer}>
      {/* HEADER SECTION */}
      <View style={styles.centerContainer}>
        <Text style={styles.companyTitle}>{data?.company?.name || "Z-EXPRESS"}</Text>
        <Text style={styles.subTextItalic}>{data?.company?.phone}</Text>
        <Text style={styles.subTextItalic}>Fast . Reliable . Worldwide</Text>
      </View>

      <LineDivider />

      {/* SHIPMENT INFO SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.row}>
          <Text style={styles.text}>Tracking:</Text>
          <Text style={styles.text}>{data?.tracking_no || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Date:</Text>
          <Text style={styles.text}>{new Date(data?.created_at || Date.now()).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Description:</Text>
          <Text style={styles.text}>{data?.description_of_goods || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Originated:</Text>
          <Text style={styles.text}>{data?.branch?.name || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Destiny:</Text>
          <Text style={styles.text}>{data?.destiny_branch?.name || "-"}</Text>
        </View>
      </View>

      <LineDivider />

      {/* SENDER & RECEIVER */}
      <View style={styles.marginBottomSmall}>
        <Text style={styles.boldText}>SENDER: <Text style={styles.regularText}>{data?.sender ? `${data?.sender?.name || data?.sender_name || "-"}, ${data?.sender?.phone || "-"}` : ""}</Text></Text>
      </View>
      <View style={styles.marginBottomSmall}>
        <Text style={styles.boldText}>RECEIVER: <Text style={styles.regularText}>{data?.consignee ? `${data?.consignee?.name || "-"}, ${data?.consignee?.phone || "-"}` : ""}</Text></Text>
      </View>

      <LineDivider />

      {/* ITEM DETAILS SECTION */}
      <View>
        <Text style={[styles.boldText, styles.marginBottomSmall]}>ITEM DETAILS</Text>
        {data?.items?.map((item, i) => {
          let desc = item.description || "Item";
          if (desc.length > 30) desc = desc.substring(0, 30);

          return (
            <View key={i} style={styles.itemContainer}>
              <Text style={styles.text}>{i + 1}. {desc}</Text>
              <View style={styles.itemSubRow}>
                <Text style={styles.text}>Qty:{item.quantity || 1}</Text>
                <Text style={styles.text}>Wt:{item.weight || 0}KG</Text>
              </View>
              <View style={styles.itemSubRow}>
                <Text style={styles.text}>Type:</Text>
                <Text style={styles.text}>{item.item_type}</Text>
              </View>
              <View style={styles.itemSubRow}>
                <Text style={styles.text}>Amount:</Text>
                <Text style={styles.text}>{money(item.quantity * item.price)} ETB</Text>
              </View>
              <View style={styles.itemSubRow}>
                <Text style={styles.text}>Price:</Text>
                <Text style={styles.text}>{money(item.price)} ETB</Text>
              </View>
            </View>
          );
        })}
      </View>

      <LineDivider />

      {/* PAYMENT SUMMARY */}
      <View style={styles.row}>
        <Text style={styles.text}>Payment:</Text>
        <Text style={styles.text}>
          {data?.payment_method ? `${data?.payment_method?.toUpperCase()}/${data?.is_paid ? "Paid" : "Not Paid"}` : ""}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>Status:</Text>
        <Text style={styles.text}>{data?.status || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>Weight:</Text>
        <Text style={styles.text}>{data?.item_kilo ? `${data?.item_kilo} KG` : ""}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>Pieces:</Text>
        <Text style={styles.text}>{data?.item_piece || "-"}</Text>
      </View>

      <LineDivider />

      {/* GRAND TOTAL */}
      <View style={styles.row}>
        <Text style={styles.totalText}>TOTAL</Text>
        <Text style={styles.totalText}>{data?.amount_received ? money(data?.amount_received) : ""} ETB</Text>
      </View>

      <LineDivider />

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <Text style={styles.boldText}>Track Shipment</Text>
        <Text style={[styles.text, styles.marginBottomSmall]}>{data?.tracking_no}</Text>
        
        <Text style={styles.marginBottomSmall}>Thank You!</Text>
        
        <View style={styles.centerRow}>
          <Text style={styles.boldText}>Z-Prime</Text>
          <Text style={styles.subTextItalic}> The Soul of Modern Logistics</Text>
        </View>
        <View style={styles.centerRow}>
          <Text style={styles.poweredText}>Powered by </Text>
          <Text style={styles.poweredBold}>Zeal Technologies</Text>
        </View>
      </View>
    </View>
  );
});

EposPrinter.displayName = 'EposPrinter';

const styles = StyleSheet.create({
  receiptContainer: {
    width: 300, // Roughly maps to ~80mm thermal width profile in standard DPI context
    padding: 12,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  subTextItalic: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333333',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  sectionContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  text: {
    fontSize: 12,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  boldText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  regularText: {
    fontWeight: 'normal',
  },
  marginBottomSmall: {
    marginBottom: 4,
  },
  itemContainer: {
    marginBottom: 8,
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  poweredText: {
    fontSize: 10,
    color: '#555555',
  },
  poweredBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111111',
  },
});

export default EposPrinter;