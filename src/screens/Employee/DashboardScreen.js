// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

import { fetchEmployeeDashboardAPI } from '../../utils/employe_api_utils';
import { fetchEmployeeDashboardOffline } from '../../utils/bills/bills_hybrid_utils';

const screenWidth = Dimensions.get('window').width;

// Your web dashboard colors
const COLORS = {
  navy: '#02152E',
  blue: '#062A54',
  lightBlue: '#0B4279',
  cyan: '#00D8FF',
  cyanLight: '#66D9FF',
  white: '#FFFFFF',
  muted: '#8C8C8C',
  mutedLight: '#999999',

  green: '#2eb85c',
  yellow: '#f9b115',
  purple: '#4f46e5',
  red: '#e74c3c',
  gray: '#636f83',
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

  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue'],
    data: [0, 0],
  });

  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = () => {
      if (isConnected) {
        fetchEmployeeDashboardAPI(
          setStats,
          setRecentBills,
          setChartData,
          setLoading
        );
      } else {
        fetchEmployeeDashboardOffline(
          setStats,
          setRecentBills,
          setChartData,
          setLoading,
          () => {}
        );
      }
    };

    loadData();
  }, [isConnected]);

  const getStatusStyle = status => {
    const map = {
      CREATED: '#6c757d',
      IN_TRANSIT: '#f39c12',
      ARRIVED: '#3498db',
      DELIVERED: '#27ae60',
      RETURNED: '#e74c3c',
    };

    return {
      backgroundColor: map[status] || '#6c757d',
    };
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.navy, COLORS.blue, COLORS.lightBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.navy, COLORS.blue, COLORS.lightBlue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* ================= HEADER ================= */}

          <View style={styles.header}>
            <View>
              <Text style={styles.dashboardTitle}>
                Dashboard
              </Text>

              <Text style={styles.dashboardSubtitle}>
                Overview of your daily operations
              </Text>
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

          {/* ================= OFFLINE WARNING ================= */}

          {!isConnected && (
            <View style={styles.offlineBanner}>
              <MaterialCommunityIcons
                name="wifi-off"
                size={20}
                color="#fff"
              />

              <Text style={styles.offlineText}>
                Working Offline - Data will sync when connected
              </Text>
            </View>
          )}

          {/* ================= QUICK ACTIONS ================= */}

          <View style={styles.quickActionsSection}>

            <Text style={styles.quickActionsTitle}>
              Quick Actions
            </Text>

            <ScrollView contentContainerStyle={styles.footerActions} horizontal={true} scrollEnabled>

              <ActionButton
                title="New Bill"
                icon="truck-plus"
                color={COLORS.purple}
                onPress={() =>
                  navigation.navigate('CreateBill')
                }
              />

              <ActionButton
                title="History"
                icon="history"
                color={COLORS.gray}
                onPress={() =>
                  navigation.navigate('BillHistory')
                }
              />

              <ActionButton
                title="Received"
                icon="history"
                color={COLORS.lightBlue}
                onPress={() =>
                  navigation.navigate('ReceivedBills')
                }
              />

            </ScrollView>

          </View>

          {/* ================= STATS ================= */}

          <View style={styles.statsGrid}>

            <StatCard
              color={COLORS.purple}
              title="Bills Today"
              value={stats.todayBills}
              icon="plus-box"
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
              icon="cash"
            />

            <StatCard
              color={COLORS.yellow}
              title="In Transit"
              value={stats.inTransit}
              icon="truck-delivery"
            />

            <StatCard
              color="#3399ff"
              title="Delivered"
              value={stats.deliveredToday}
              icon="check-circle"
            />

          </View>

          {/* ================= ANALYTICS ================= */}

          <View style={styles.analyticsCard}>

            <View style={styles.analyticsHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Weekly Bills Trend
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Bills created during the week
                </Text>
              </View>

              <View style={styles.analyticsBadge}>
                <Text style={styles.analyticsBadgeText}>
                  Weekly
                </Text>
              </View>
            </View>

            <View style={styles.chartWrapper}>
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
                height={240}
                chartConfig={chartConfig}
                bezier
                withInnerLines={false}
                withOuterLines={false}
                fromZero
                style={styles.chart}
              />
            </View>

          </View>

          {/* ================= RECENT BILLS ================= */}

          <View style={styles.recentCard}>

            <View style={styles.recentHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Recent Bills
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Latest transactions
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BillHistory')
                }
              >
                <Text style={styles.linkText}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentBills.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={50}
                  color={COLORS.cyan}
                />

                <Text style={styles.emptyTitle}>
                  No recent bills
                </Text>

                <Text style={styles.emptyText}>
                  Your recent bills will appear here.
                </Text>
              </View>
            ) : (
              recentBills.map((bill, index) => (
                <View
                  key={bill.id || index}
                  style={styles.billItem}
                >

                  <View style={styles.billAvatar}>
                    <Text style={styles.billAvatarText}>
                      {(bill.sender_name || 'W')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.billInfo}>
                    <Text style={styles.billName}>
                      {bill.sender_name || 'Walk-in'}
                    </Text>

                    <Text style={styles.billTracking}>
                      {bill.tracking_no || 'Pending...'}
                    </Text>
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

                </View>
              ))
            )}

          </View>

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
    activeOpacity={0.8}
    style={styles.statCard}
    onPress={onPress}
  >

    <View
      style={[
        styles.statIcon,
        {
          backgroundColor: color,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color="#fff"
      />
    </View>

    <Text style={styles.statTitle}>
      {title}
    </Text>

    <Text style={styles.statValue}>
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
  icon,
  color,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    style={[
      styles.actionBtn,
      {
        backgroundColor: color,
      },
    ]}
    onPress={onPress}
  >

    <MaterialCommunityIcons
      name={icon}
      size={21}
      color="#fff"
    />

    <Text style={styles.actionBtnText}>
      {title}
    </Text>

  </TouchableOpacity>
);


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
    `rgba(255, 255, 255, ${opacity * 0.75})`,

  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: COLORS.navy,
    fill: COLORS.cyan,
  },

  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: 'rgba(255,255,255,0.08)',
  },
};


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ---------------- Background ----------------

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
    paddingBottom: 35,
  },

  // ---------------- Loader ----------------

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: COLORS.cyanLight,
    marginTop: 12,
    fontSize: 14,
  },

  // ---------------- Header ----------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 5,
  },

  dashboardTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.white,
  },

  dashboardSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 2,
  },

  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },

  connectionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },

  // ---------------- Offline ----------------

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 5,
    marginBottom: 10,
  },

  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // ---------------- Stats ----------------

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  statCard: {
    width: '48.5%',
    backgroundColor: COLORS.navy,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 5,

    overflow: 'hidden',
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  statTitle: {
    color: '#8c8c8c',
    fontSize: 13,
    marginBottom: 3,
  },

  statValue: {
    color: COLORS.cyan,
    fontSize: 23,
    fontWeight: '700',
  },

  statAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  // ---------------- Analytics ----------------

  analyticsCard: {
    backgroundColor: 'rgba(2,21,46,0.94)',
    borderRadius: 20,
    marginTop: 5,
    marginBottom: 10,
    padding: 15,

    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.12)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,

    elevation: 5,
  },

  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#777',
    fontSize: 11,
    marginTop: 3,
  },

  analyticsBadge: {
    backgroundColor: 'rgba(79,70,229,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  analyticsBadgeText: {
    color: '#8f8cff',
    fontSize: 11,
    fontWeight: '600',
  },

  chartWrapper: {
    alignItems: 'center',
    marginTop: 5,
  },

  chart: {
    marginVertical: 5,
    borderRadius: 15,
    marginLeft: -15,
  },

  // ---------------- Recent Bills ----------------

  recentCard: {
    backgroundColor: 'rgba(2,21,46,0.94)',
    borderRadius: 20,
    marginTop: 5,
    marginBottom: 10,
    padding: 15,

    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.12)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,

    elevation: 5,
  },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  linkText: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: '700',
  },

  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: COLORS.navy,
  },

  billAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  billAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  billInfo: {
    flex: 1,
    marginLeft: 9,
  },

  billName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  billTracking: {
    color: COLORS.cyanLight,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  billRight: {
    alignItems: 'flex-end',
  },

  billPrice: {
    color: COLORS.cyanLight,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },

  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // ---------------- Empty State ----------------

  emptyState: {
    alignItems: 'center',
    paddingVertical: 35,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },

  emptyText: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },

  // ---------------- Quick Actions ----------------

  quickActionsSection: {
    marginTop: 5,
  },

  quickActionsTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 5,
    marginBottom: 10,
  },

  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    width: '48%',
    paddingVertical: 14,

    borderRadius: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 4,
  },

  actionBtnText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '700',
    fontSize: 13,
  },

});

export default DashboardScreen;
