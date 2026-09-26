// src/screens/Owner/CompanyOwnerDashboardScreen/index.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { theme } from '../../../theme/theme';
import { fetchEmployeeDashboardOffline } from '../../../utils/bills/bills_hybrid_utils';
import { fetchEmployeeDashboardAPI } from '../../../utils/employe_api_utils';

// Keep your existing dashboard functions.
// Adjust these imports if your Expo project has different relative paths.
// import { fetchEmployeeDashboardOffline } from '../../../views/bills/bills_hybrid_utils';
// import { fetchEmployeeDashboardAPI } from '../../../utils/employe_api_utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_CONFIG = {
  CREATED: {
    label: 'CREATED',
    color: theme.colors.textSecondary,
    background: theme.colors.overlayMedium,
  },
  IN_TRANSIT: {
    label: 'IN TRANSIT',
    color: theme.colors.warningLight,
    background: 'rgba(217,119,6,0.18)',
  },
  ARRIVED: {
    label: 'ARRIVED',
    color: theme.colors.infoLight,
    background: 'rgba(8,145,178,0.18)',
  },
  DELIVERED: {
    label: 'DELIVERED',
    color: theme.colors.successLight,
    background: 'rgba(22,163,74,0.18)',
  },
  RETURNED: {
    label: 'RETURNED',
    color: theme.colors.dangerLight,
    background: 'rgba(231,76,60,0.18)',
  },
};

const STAT_CONFIG = [
  {
    key: 'todayBills',
    title: 'Bills Today',
    subtitle: 'Created today',
    icon: 'receipt-outline',
    colors: ['#667eea', '#764ba2'],
  },
  {
    key: 'todayRevenue',
    title: 'Revenue Today',
    subtitle: "Today's collection",
    icon: 'cash-outline',
    colors: ['#00c853', '#64dd17'],
  },
  {
    key: 'inTransit',
    title: 'In Transit',
    subtitle: 'Packages moving',
    icon: 'car-outline',
    colors: ['#ff9800', '#ff5722'],
  },
  {
    key: 'deliveredToday',
    title: 'Delivered',
    subtitle: 'Completed today',
    icon: 'people-outline',
    colors: ['#03a9f4', '#00bcd4'],
  },
];

const QUICK_ACTIONS = [
  {
    title: 'Configuration',
    description: 'Setup the configuration',
    icon: 'cog-outline',
    colors: ['#4f46e5', '#6366f1'],
    route: 'Configuration',
  },
  {
    title: 'All Bills',
    description: 'Browse shipment history',
    icon: 'cube-outline',
    colors: ['#f59e0b', '#ef4444'],
    route: 'Bills',
  },
  {
    title: 'Branches',
    description: 'View and update Branches',
    icon: 'people-outline',
    colors: ['#06b6d4', '#3b82f6'],
    route: 'Branches',
  },
];

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return `ETB ${number.toFixed(2)}`;
};

const getInitial = (name) => {
  return (name || 'W').charAt(0).toUpperCase();
};

const getStatusConfig = (status) => {
  return (
    STATUS_CONFIG[status] || {
      label: String(status || 'UNKNOWN').replaceAll('_', ' '),
      color: theme.colors.textSecondary,
      background: theme.colors.overlayMedium,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Gradient helper                                                            */
/* -------------------------------------------------------------------------- */

const GradientView = ({
  colors,
  children,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors[0],
          },
        ]}
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.9,
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient
              id="gradient"
              x1={`${start.x * 100}%`}
              y1={`${start.y * 100}%`}
              x2={`${end.x * 100}%`}
              y2={`${end.y * 100}%`}
            >
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>

          <Path
            d={`M0 0 H${SCREEN_WIDTH} V1000 H0 Z`}
            fill="url(#gradient)"
          />
        </Svg>
      </View>

      {children}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

const StatCard = ({ title, value, subtitle, icon, colors }) => {
  return (
    <GradientView
      colors={colors}
      style={styles.statCard}
    >
      <View style={styles.statCardTop}>
        <View style={styles.statIconContainer}>
          <Ionicons
            name={icon}
            size={23}
            color={theme.colors.white}
          />
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color="rgba(255,255,255,0.65)"
        />
      </View>

      <Text style={styles.statTitle}>{title}</Text>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </GradientView>
  );
};

/* -------------------------------------------------------------------------- */
/* Quick Action                                                               */
/* -------------------------------------------------------------------------- */

const QuickActionCard = ({
  title,
  description,
  icon,
  colors,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        pressed && styles.pressed,
      ]}
    >
      <GradientView
        colors={colors}
        style={styles.quickActionIcon}
      >
        <Ionicons
          name={icon}
          size={25}
          color={theme.colors.white}
        />
      </GradientView>

      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>

        <Text style={styles.quickActionDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  );
};

/* -------------------------------------------------------------------------- */
/* Weekly Chart                                                               */
/* -------------------------------------------------------------------------- */

const WeeklyChart = ({ data = [], labels = [] }) => {
  const chartWidth = Math.max(SCREEN_WIDTH - 70, 280);
  const chartHeight = 190;

  const values = data.map((value) => Number(value || 0));

  const maxValue = Math.max(...values, 1);
  const minValue = 0;

  const horizontalPadding = 18;
  const verticalPadding = 20;

  const graphWidth = chartWidth - horizontalPadding * 2;
  const graphHeight = chartHeight - verticalPadding * 2;

  const points = values.map((value, index) => {
    const x =
      values.length <= 1
        ? graphWidth / 2 + horizontalPadding
        : horizontalPadding +
          (index / (values.length - 1)) * graphWidth;

    const normalized =
      (value - minValue) / (maxValue - minValue || 1);

    const y =
      verticalPadding +
      graphHeight -
      normalized * graphHeight;

    return {
      x,
      y,
      value,
    };
  });

  const linePath =
    points.length > 0
      ? points
          .map((point, index) => {
            return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
          })
          .join(' ')
      : '';

  const areaPath =
    points.length > 0
      ? `${linePath}
         L ${points[points.length - 1].x} ${
        chartHeight - verticalPadding
      }
         L ${points[0].x} ${
        chartHeight - verticalPadding
      }
         Z`
      : '';

  return (
    <View style={styles.chartContainer}>
      <Svg
        width={chartWidth}
        height={chartHeight}
      >
        <Defs>
          <LinearGradient
            id="chartFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <Stop
              offset="0%"
              stopColor={theme.colors.purple}
              stopOpacity="0.28"
            />

            <Stop
              offset="100%"
              stopColor={theme.colors.purple}
              stopOpacity="0"
            />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {[0, 1, 2, 3].map((line) => {
          const y =
            verticalPadding +
            (graphHeight / 3) * line;

          return (
            <Path
              key={line}
              d={`M ${horizontalPadding} ${y} L ${
                chartWidth - horizontalPadding
              } ${y}`}
              stroke={theme.colors.borderLight}
              strokeWidth="1"
            />
          );
        })}

        {areaPath ? (
          <Path
            d={areaPath}
            fill="url(#chartFill)"
          />
        ) : null}

        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke={theme.colors.purpleLight}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((point, index) => (
          <React.Fragment key={index}>
            <Circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill={theme.colors.background}
              stroke={theme.colors.purpleLight}
              strokeWidth="3"
            />

            <Circle
              cx={point.x}
              cy={point.y}
              r="2"
              fill={theme.colors.purpleLight}
            />
          </React.Fragment>
        ))}
      </Svg>

      <View style={styles.chartLabels}>
        {labels.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            style={styles.chartLabel}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Recent Bill                                                                */
/* -------------------------------------------------------------------------- */

const RecentBillItem = ({ bill }) => {
  const status = getStatusConfig(bill.status);

  const senderName =
    bill.sender_name || 'Walk-in Customer';

  const trackingNumber =
    bill.tracking_no || bill.uuid || 'N/A';

  return (
    <View style={styles.billItem}>
      <View style={styles.billAvatar}>
        <Text style={styles.billAvatarText}>
          {getInitial(senderName)}
        </Text>
      </View>

      <View style={styles.billInfo}>
        <Text
          style={styles.billName}
          numberOfLines={1}
        >
          {senderName}
        </Text>

        <Text
          style={styles.billTracking}
          numberOfLines={1}
        >
          #{trackingNumber}
        </Text>
      </View>

      <View style={styles.billRight}>
        <Text style={styles.billPrice}>
          {formatCurrency(bill.amount_received)}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: status.background,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: status.color,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: status.color,
              },
            ]}
          >
            {status.label}
          </Text>
        </View>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Screen                                                                */
/* -------------------------------------------------------------------------- */

const CompanyOwnerDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    todayBills: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    inTransit: 0,
    deliveredToday: 0,
  });

  const [recentBills, setRecentBills] = useState([]);

  const [chartData, setChartData] = useState({
    labels: [],
    data: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /*
   * React Native doesn't have navigator.onLine.
   *
   * This gives the screen a usable initial online state.
   * If your app already has NetInfo configured, replace this
   * with your global connectivity state.
   */
  const [isConnected, setIsConnected] = useState(true);

  const greeting = useMemo(() => getGreeting(), []);

  const totalBills = useMemo(() => {
    return (chartData.data || []).reduce(
      (total, value) => total + Number(value || 0),
      0
    );
  }, [chartData.data]);

  const averagePerDay = useMemo(() => {
    if (!chartData.data?.length) return 0;

    return (
      totalBills / chartData.data.length
    ).toFixed(1);
  }, [chartData.data, totalBills]);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const finishLoading = () => {
          setLoading(false);
          setRefreshing(false);
        };

        if (isConnected) {
          await fetchEmployeeDashboardAPI(
            setStats,
            setRecentBills,
            setChartData,
            finishLoading
          );
        } else {
          await fetchEmployeeDashboardOffline(
            setStats,
            setRecentBills,
            setChartData,
            finishLoading,
            () => {}
          );
        }
      } catch (error) {
        console.error(
          'Failed to load owner dashboard:',
          error
        );

        setLoading(false);
        setRefreshing(false);
      }
    },
    [isConnected]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleQuickAction = (route) => {
    /*
     * Change these route names to match your Expo
     * React Navigation configuration.
     */
    navigation?.navigate?.(route);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="analytics-outline"
              size={34}
              color={theme.colors.primary}
            />
          </View>

          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.loadingSpinner}
          />

          <Text style={styles.loadingText}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>
              👋 {greeting}
            </Text>

            <Text style={styles.subtitle}>
              Here's what's happening today.
            </Text>
          </View>

          <View
            style={[
              styles.connectionBadge,
              {
                backgroundColor: isConnected
                  ? 'rgba(22,163,74,0.15)'
                  : 'rgba(231,76,60,0.15)',
                borderColor: isConnected
                  ? 'rgba(22,163,74,0.35)'
                  : 'rgba(231,76,60,0.35)',
              },
            ]}
          >
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: isConnected
                    ? theme.colors.success
                    : theme.colors.danger,
                },
              ]}
            />

            <Text
              style={[
                styles.connectionText,
                {
                  color: isConnected
                    ? theme.colors.successLight
                    : theme.colors.dangerLight,
                },
              ]}
            >
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Statistics                                                        */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.section}>
          <View style={styles.statsGrid}>
            {STAT_CONFIG.map((item) => {
              let value = stats[item.key];

              if (item.key === 'todayRevenue') {
                value = formatCurrency(value);
              }

              return (
                <View
                  key={item.key}
                  style={styles.statWrapper}
                >
                  <StatCard
                    title={item.title}
                    value={value}
                    subtitle={item.subtitle}
                    icon={item.icon}
                    colors={item.colors}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Quick Actions                                                    */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Quick Actions
              </Text>

              <Text style={styles.sectionSubtitle}>
                Manage your shipments
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.title}
                title={action.title}
                description={action.description}
                icon={action.icon}
                colors={action.colors}
                onPress={() =>
                  handleQuickAction(action.route)
                }
              />
            ))}
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Analytics + Recent Bills                                         */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.analyticsSection}>
          {/* Weekly Bills */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Weekly Bills Trend
                </Text>

                <Text style={styles.cardSubtitle}>
                  Bills created during the last 7 days
                </Text>
              </View>

              <View style={styles.periodBadge}>
                <Text style={styles.periodBadgeText}>
                  7 DAYS
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>
                  Total Bills
                </Text>

                <Text style={styles.summaryValue}>
                  {totalBills}
                </Text>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>
                  Average / Day
                </Text>

                <Text style={styles.summaryValue}>
                  {averagePerDay}
                </Text>
              </View>
            </View>

            {chartData.data?.length ? (
              <WeeklyChart
                data={chartData.data}
                labels={chartData.labels}
              />
            ) : (
              <View style={styles.noChartData}>
                <Ionicons
                  name="bar-chart-outline"
                  size={35}
                  color={theme.colors.textMuted}
                />

                <Text style={styles.noChartText}>
                  No chart data available
                </Text>
              </View>
            )}
          </View>

          {/* Recent Bills */}
          <View style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Recent Bills
                </Text>

                <Text style={styles.cardSubtitle}>
                  Latest created shipments
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  handleQuickAction('Bills')
                }
                style={({ pressed }) => [
                  styles.viewAllButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.viewAllText}>
                  View All
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            {recentBills.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="cube-outline"
                    size={35}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No Bills Yet
                </Text>

                <Text style={styles.emptyDescription}>
                  Create your first shipment to get
                  started.
                </Text>

                <Pressable
                  onPress={() =>
                    handleQuickAction('CreateBill')
                  }
                  style={({ pressed }) => [
                    styles.createButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={theme.colors.background}
                  />

                  <Text style={styles.createButtonText}>
                    Create Bill
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.billList}>
                {recentBills.map((bill, index) => (
                  <React.Fragment
                    key={
                      bill.id ||
                      bill.uuid ||
                      `bill-${index}`
                    }
                  >
                    <RecentBillItem bill={bill} />
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 40,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  greeting: {
    color: theme.colors.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },

  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.round,
    borderWidth: 1,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },

  connectionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Sections */

  section: {
    marginBottom: theme.spacing.xxxl,
  },

  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  /* Stats */

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },

  statWrapper: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  statCard: {
    minHeight: 155,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },

  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  statIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  statTitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
  },

  statValue: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },

  statSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    marginTop: 5,
  },

  /* Quick Actions */

  quickActions: {
    gap: 10,
  },

  quickActionCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },

  quickActionIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  quickActionContent: {
    flex: 1,
  },

  quickActionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  quickActionDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  /* Analytics */

  analyticsSection: {
    gap: theme.spacing.xl,
  },

  analyticsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },

  recentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },

  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },

  cardTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  periodBadge: {
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: theme.radius.round,
    marginLeft: 10,
  },

  periodBadgeText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },

  summaryBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 13,
  },

  summaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  summaryValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },

  /* Chart */

  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 3,
  },

  chartLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
  },

  chartLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    maxWidth: 45,
    textAlign: 'center',
  },

  noChartData: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noChartText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },

  /* Recent */

  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,216,255,0.07)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 5,
  },

  viewAllText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  billList: {
    gap: 9,
  },

  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 11,
  },

  billAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(0,216,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,216,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  billAvatarText: {
    color: theme.colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },

  billInfo: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  billName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },

  billTracking: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  billRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  billPrice: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginRight: 4,
  },

  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  /* Empty state */

  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  emptyDescription: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 16,
    gap: 6,
    ...theme.shadows.button,
  },

  createButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '900',
  },

  /* Loading */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },

  loadingIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: 'rgba(0,216,255,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingSpinner: {
    marginTop: 22,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
});

export default CompanyOwnerDashboardScreen;
