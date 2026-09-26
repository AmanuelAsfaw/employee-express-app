// src/screens/DashboardScreen.js

import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import { fetchEmployeeDashboardAPI } from '../../utils/employe_api_utils';
import { fetchEmployeeDashboardOffline } from '../../utils/bills/bills_hybrid_utils';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
  navy: '#03152E',
  navy2: '#061D3B',
  blue: '#082B52',
  blue2: '#0A3768',

  cyan: '#00D8FF',
  cyanLight: '#73E4FF',

  white: '#FFFFFF',
  text: '#F5FAFF',
  textSecondary: '#91A4BA',
  textMuted: '#647891',

  green: '#35D07F',
  yellow: '#FFC857',
  purple: '#7867FF',
  red: '#FF5D6C',
  orange: '#FF9F43',
  sky: '#4CA8FF',

  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.055)',
  glassStrong: 'rgba(255,255,255,0.08)',
};

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    todayBills: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    inTransit: 0,
    deliveredToday: 0,
  });

  const [recentBills, setRecentBills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue'],
    data: [0, 0],
  });

  const [isConnected, setIsConnected] = useState(true);

  // --------------------------------------------------
  // NETWORK
  // --------------------------------------------------

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(Boolean(state.isConnected));
    });

    return unsubscribe;
  }, []);

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const loadData = useCallback(
    (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      }

      const finish = () => {
        setRefreshing(false);
        setLoading(false);
      };

      if (isConnected) {
        fetchEmployeeDashboardAPI(
          setStats,
          setRecentBills,
          setChartData,
          finish
        );
      } else {
        fetchEmployeeDashboardOffline(
          setStats,
          setRecentBills,
          setChartData,
          finish,
          () => {}
        );
      }
    },
    [isConnected]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshDashboardData = () => {
    loadData(true);
  };

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  const getStatusStyle = status => {
    const map = {
      CREATED: COLORS.textMuted,
      IN_TRANSIT: COLORS.orange,
      ARRIVED: COLORS.sky,
      DELIVERED: COLORS.green,
      RETURNED: COLORS.red,
    };

    return {
      backgroundColor: map[status] || COLORS.textMuted,
    };
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.navy, COLORS.blue, COLORS.blue2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <View style={styles.loaderLogo}>
          <MaterialCommunityIcons
            name="truck-fast"
            size={30}
            color={COLORS.cyan}
          />
        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.cyan}
          style={{ marginTop: 20 }}
        />

        <Text style={styles.loadingText}>
          Preparing your dashboard...
        </Text>
      </LinearGradient>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <LinearGradient
      colors={[COLORS.navy, COLORS.blue, COLORS.blue2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshDashboardData}
              tintColor={COLORS.cyan}
              colors={[COLORS.cyan]}
              progressBackgroundColor={COLORS.navy2}
            />
          }
        >

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <View style={styles.header}>

            <View style={styles.headerLeft}>
              <View style={styles.welcomeIcon}>
                <MaterialCommunityIcons
                  name="view-dashboard-outline"
                  size={21}
                  color={COLORS.cyan}
                />
              </View>

              <View>
                <Text style={styles.eyebrow}>
                  OVERVIEW
                </Text>

                <Text style={styles.dashboardTitle}>
                  Dashboard
                </Text>

                <Text style={styles.dashboardSubtitle}>
                  Your operations at a glance
                </Text>
              </View>
            </View>

            <View style={styles.connectionBadge}>
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: isConnected
                      ? COLORS.green
                      : COLORS.red,
                  },
                ]}
              />

              <Text style={styles.connectionText}>
                {isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>

          </View>

          {/* ================================================= */}
          {/* OFFLINE BANNER */}
          {/* ================================================= */}

          {!isConnected && (
            <View style={styles.offlineBanner}>
              <View style={styles.offlineIcon}>
                <MaterialCommunityIcons
                  name="wifi-off"
                  size={17}
                  color={COLORS.red}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.offlineTitle}>
                  You're offline
                </Text>

                <Text style={styles.offlineText}>
                  Showing your saved data. Changes will sync when you're back online.
                </Text>
              </View>
            </View>
          )}

          {/* ================================================= */}
          {/* QUICK ACTIONS */}
          {/* ================================================= */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Quick Actions
              </Text>

              <Text style={styles.sectionSubtitle}>
                Get things done faster
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsContainer}
          >
            <ActionButton
              title="New Bill"
              subtitle="Create shipment"
              icon="truck-plus"
              color={COLORS.purple}
              onPress={() =>
                navigation.navigate('CreateBill')
              }
            />

            <ActionButton
              title="History"
              subtitle="View all bills"
              icon="history"
              color={COLORS.sky}
              onPress={() =>
                navigation.navigate('BillHistory')
              }
            />

            <ActionButton
              title="Received"
              subtitle="Received bills"
              icon="package-check"
              color={COLORS.green}
              onPress={() =>
                navigation.navigate('ReceivedBills')
              }
            />
          </ScrollView>

          {/* ================================================= */}
          {/* STATS */}
          {/* ================================================= */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Today's Overview
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your activity for today
              </Text>
            </View>

            <View style={styles.todayBadge}>
              <MaterialCommunityIcons
                name="calendar-today"
                size={13}
                color={COLORS.cyan}
              />

              <Text style={styles.todayBadgeText}>
                Today
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>

            <StatCard
              color={COLORS.purple}
              title="Bills Today"
              value={stats.todayBills}
              icon="file-document-plus-outline"
              onPress={() =>
                navigation.navigate('CreateBill')
              }
            />

            <StatCard
              color={COLORS.green}
              title="Today Revenue"
              value={`ETB ${Number(
                stats.todayRevenue || 0
              ).toFixed(1)}`}
              icon="cash-multiple"
            />

            <StatCard
              color={COLORS.orange}
              title="In Transit"
              value={stats.inTransit}
              icon="truck-delivery-outline"
            />

            <StatCard
              color={COLORS.sky}
              title="Delivered"
              value={stats.deliveredToday}
              icon="check-decagram-outline"
            />

          </View>

          {/* ================================================= */}
          {/* WEEKLY ANALYTICS */}
          {/* ================================================= */}

          <View style={styles.analyticsCard}>

            <View style={styles.analyticsHeader}>

              <View>
                <View style={styles.titleWithDot}>
                  <View style={styles.liveDot} />

                  <Text style={styles.analyticsTitle}>
                    Weekly Activity
                  </Text>
                </View>

                <Text style={styles.analyticsSubtitle}>
                  Bills created throughout the week
                </Text>
              </View>

              <View style={styles.analyticsBadge}>
                <Text style={styles.analyticsBadgeText}>
                  7 DAYS
                </Text>
              </View>

            </View>

            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels:
                    chartData.labels?.length > 0
                      ? chartData.labels
                      : [' '],

                  datasets: [
                    {
                      data:
                        chartData.data?.length > 0
                          ? chartData.data
                          : [0],
                    },
                  ],
                }}
                width={screenWidth - 50}
                height={225}
                chartConfig={chartConfig}
                bezier
                fromZero
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLabels
                segments={3}
                style={styles.chart}
              />
            </View>

          </View>

          {/* ================================================= */}
          {/* RECENT BILLS */}
          {/* ================================================= */}

          <View style={styles.recentCard}>

            <View style={styles.recentHeader}>

              <View>
                <Text style={styles.sectionTitle}>
                  Recent Bills
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Your latest transactions
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.viewAllButton}
                onPress={() =>
                  navigation.navigate('BillHistory')
                }
              >
                <Text style={styles.viewAllText}>
                  View All
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={15}
                  color={COLORS.cyan}
                />
              </TouchableOpacity>

            </View>

            {recentBills.length === 0 ? (
              <View style={styles.emptyState}>

                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={35}
                    color={COLORS.cyan}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No recent bills
                </Text>

                <Text style={styles.emptyText}>
                  Your latest transactions will appear here.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.emptyButton}
                  onPress={() =>
                    navigation.navigate('CreateBill')
                  }
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={17}
                    color="#fff"
                  />

                  <Text style={styles.emptyButtonText}>
                    Create First Bill
                  </Text>
                </TouchableOpacity>

              </View>
            ) : (
              recentBills.map((bill, index) => (
                <BillItem
                  key={bill.id || index}
                  bill={bill}
                  getStatusStyle={getStatusStyle}
                />
              ))
            )}

          </View>

          {/* Bottom spacing */}
          <View style={{ height: 20 }} />

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};


// ======================================================
// STAT CARD
// ======================================================

const StatCard = ({
  color,
  title,
  value,
  icon,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.statCard}
    onPress={onPress}
  >
    <View
      style={[
        styles.statGlow,
        {
          backgroundColor: color,
        },
      ]}
    />

    <View style={styles.statTopRow}>

      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${color}22`,
            borderColor: `${color}44`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={color}
        />
      </View>

      {onPress && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={COLORS.textMuted}
        />
      )}

    </View>

    <Text style={styles.statTitle}>
      {title}
    </Text>

    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={styles.statValue}
    >
      {value}
    </Text>

    <View
      style={[
        styles.statAccent,
        {
          backgroundColor: color,
        },
      ]}
    />
  </TouchableOpacity>
);


// ======================================================
// ACTION BUTTON
// ======================================================

const ActionButton = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.actionBtn}
    onPress={onPress}
  >
    <LinearGradient
      colors={[`${color}DD`, `${color}99`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.actionGradient}
    >

      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: 'rgba(255,255,255,0.14)',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color="#fff"
        />
      </View>

      <View style={styles.actionTextContainer}>
        <Text style={styles.actionBtnText}>
          {title}
        </Text>

        <Text style={styles.actionBtnSubtitle}>
          {subtitle}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="arrow-top-right"
        size={17}
        color="rgba(255,255,255,0.7)"
      />

    </LinearGradient>
  </TouchableOpacity>
);


// ======================================================
// BILL ITEM
// ======================================================

const BillItem = ({
  bill,
  getStatusStyle,
}) => {
  const senderName = bill.sender_name || 'Walk-in';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.billItem}
    >

      <View style={styles.billAvatarContainer}>

        <View style={styles.billAvatar}>
          <Text style={styles.billAvatarText}>
            {senderName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={[
            styles.billStatusDot,
            getStatusStyle(bill.status),
          ]}
        />
      </View>

      <View style={styles.billInfo}>

        <Text
          numberOfLines={1}
          style={styles.billName}
        >
          {senderName}
        </Text>

        <View style={styles.trackingRow}>

          <MaterialCommunityIcons
            name="barcode"
            size={12}
            color={COLORS.textMuted}
          />

          <Text
            numberOfLines={1}
            style={styles.billTracking}
          >
            {bill.tracking_no || 'Pending tracking'}
          </Text>

        </View>

      </View>

      <View style={styles.billRight}>

        <Text style={styles.billPrice}>
          ETB{' '}
          {parseFloat(
            bill.amount_received || 0
          ).toFixed(2)}
        </Text>

        <View
          style={[
            styles.statusPill,
            getStatusStyle(bill.status),
          ]}
        >
          <Text style={styles.statusText}>
            {bill.status || 'CREATED'}
          </Text>
        </View>

      </View>

    </TouchableOpacity>
  );
};


// ======================================================
// CHART CONFIG
// ======================================================

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',

  decimalPlaces: 0,

  color: (opacity = 1) =>
    `rgba(0, 216, 255, ${opacity})`,

  labelColor: (opacity = 1) =>
    `rgba(255,255,255,${opacity * 0.55})`,

  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: COLORS.navy,
    fill: COLORS.cyan,
  },

  propsForBackgroundLines: {
    strokeDasharray: '5 8',
    stroke: 'rgba(255,255,255,0.06)',
    strokeWidth: 1,
  },

  fillShadowGradient: COLORS.cyan,
  fillShadowGradientOpacity: 0.13,
};


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ==================================================
  // GENERAL
  // ==================================================

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
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 30,
  },

  // ==================================================
  // LOADING
  // ==================================================

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderLogo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.18)',
  },

  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },

  // ==================================================
  // HEADER
  // ==================================================

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 18,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  welcomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(0,216,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.15)',

    marginRight: 11,
  },

  eyebrow: {
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 1,
  },

  dashboardTitle: {
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  dashboardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.055)',

    borderWidth: 1,
    borderColor: COLORS.border,

    paddingHorizontal: 9,
    paddingVertical: 7,

    borderRadius: 30,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },

  connectionText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
  },

  // ==================================================
  // OFFLINE
  // ==================================================

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,93,108,0.09)',

    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,93,108,0.2)',

    padding: 11,
    marginBottom: 18,
  },

  offlineIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255,93,108,0.13)',
    marginRight: 10,
  },

  offlineTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },

  offlineText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  // ==================================================
  // SECTION
  // ==================================================

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    marginTop: 2,
    marginBottom: 11,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    marginTop: 3,
  },

  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor: 'rgba(0,216,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.12)',
  },

  todayBadgeText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 5,
  },

  // ==================================================
  // ACTIONS
  // ==================================================

  actionsContainer: {
    paddingBottom: 19,
    paddingRight: 8,
  },

  actionBtn: {
    width: 185,
    height: 76,

    borderRadius: 18,

    marginRight: 10,

    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  actionGradient: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 12,
  },

  actionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  actionTextContainer: {
    flex: 1,
  },

  actionBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  actionBtnSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 9.5,
    marginTop: 3,
  },

  // ==================================================
  // STATS
  // ==================================================

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

    marginBottom: 17,
  },

  statCard: {
    width: '48.5%',
    height: 142,

    backgroundColor: 'rgba(3,21,46,0.88)',

    borderRadius: 18,

    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 14,

    marginBottom: 10,

    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  statGlow: {
    position: 'absolute',

    width: 75,
    height: 75,

    borderRadius: 75,

    right: -35,
    top: -35,

    opacity: 0.07,
  },

  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statIcon: {
    width: 39,
    height: 39,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
  },

  statTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',

    marginTop: 12,
    marginBottom: 4,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  statAccent: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 0,

    height: 2,
    opacity: 0.8,
  },

  // ==================================================
  // ANALYTICS
  // ==================================================

  analyticsCard: {
    backgroundColor: 'rgba(3,21,46,0.9)',

    borderRadius: 21,

    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.11)',

    padding: 15,

    marginBottom: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },

  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  titleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 7,

    backgroundColor: COLORS.cyan,

    marginRight: 7,
  },

  analyticsTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  analyticsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  analyticsBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor: 'rgba(0,216,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.11)',
  },

  analyticsBadgeText: {
    color: COLORS.cyan,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },

  chart: {
    marginVertical: 4,
    marginLeft: -17,
  },

  // ==================================================
  // RECENT BILLS
  // ==================================================

  recentCard: {
    backgroundColor: 'rgba(3,21,46,0.9)',

    borderRadius: 21,

    borderWidth: 1,
    borderColor: COLORS.border,

    padding: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },

  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 13,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 6,
    paddingLeft: 8,
  },

  viewAllText: {
    color: COLORS.cyan,
    fontSize: 10.5,
    fontWeight: '800',
    marginRight: 4,
  },

  // ==================================================
  // BILL ITEM
  // ==================================================

  billItem: {
    flexDirection: 'row',
    alignItems: 'center',

    minHeight: 68,

    backgroundColor: 'rgba(255,255,255,0.035)',

    borderRadius: 15,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.045)',

    paddingHorizontal: 10,
    paddingVertical: 9,

    marginBottom: 8,
  },

  billAvatarContainer: {
    position: 'relative',

    width: 38,
    height: 38,

    marginRight: 10,
  },

  billAvatar: {
    width: 38,
    height: 38,

    borderRadius: 13,

    backgroundColor: 'rgba(120,103,255,0.17)',

    borderWidth: 1,
    borderColor: 'rgba(120,103,255,0.25)',

    alignItems: 'center',
    justifyContent: 'center',
  },

  billAvatarText: {
    color: '#A69CFF',
    fontSize: 13,
    fontWeight: '800',
  },

  billStatusDot: {
    position: 'absolute',

    right: -1,
    bottom: -1,

    width: 10,
    height: 10,

    borderRadius: 10,

    borderWidth: 2,
    borderColor: COLORS.navy,
  },

  billInfo: {
    flex: 1,
    minWidth: 0,
  },

  billName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 5,
  },

  billTracking: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '600',
    marginLeft: 4,
    flexShrink: 1,
  },

  billRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  billPrice: {
    color: COLORS.cyanLight,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
  },

  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 7,
  },

  statusText: {
    color: '#fff',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ==================================================
  // EMPTY STATE
  // ==================================================

  emptyState: {
    alignItems: 'center',

    paddingVertical: 30,
  },

  emptyIcon: {
    width: 68,
    height: 68,

    borderRadius: 22,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(0,216,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.12)',
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 230,
    lineHeight: 16,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.purple,

    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 11,

    marginTop: 15,
  },

  emptyButtonText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '700',
    marginLeft: 5,
  },
});

export default DashboardScreen;
