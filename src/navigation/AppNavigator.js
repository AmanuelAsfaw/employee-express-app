import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

import { createStackNavigator } from '@react-navigation/stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/Employee/DashboardScreen';
import CreateBillScreen from '../screens/Employee/CreateBillScreen';
import BillHistoryScreen from '../screens/Employee/BillHistoryScreen';
import ReceivedBillsScreen from '../screens/Employee/ReceivedBillsScreen';
import DetailBillScreen from '../screens/Employee/DetailBillScreen';
import UserProfileScreen from '../screens/Employee/UserProfileScreen';
import CompanyProfileScreenEmp from '../screens/Employee/CompanyProfileScreenEmp';
import ConsigneesListScreen from '../screens/Employee/ConsigneesListScreen';
import SendersListScreen from '../screens/Employee/SendersListScreen';


import CompanyOwnerDashboardScreen from '../screens/Owner/CompanyOwnerDashboardScreen';
import CompanyOwnerAllBillsScreen from '../screens/Owner/CompanyOwnerAllBillsScreen';
import CompanyConfigScreen from '../screens/Owner/CompanyConfigScreen';
import WeightPricingScreen from '../screens/Owner/WeightPricingScreen';
import VolumePricingScreen from '../screens/Owner/VolumePricingScreen';
import BranchListScreen from '../screens/Owner/BranchListScreen';
import CasherListScreen from '../screens/Owner/CasherListScreen';
import SpecialSMSScreen from '../screens/Owner/SpecialSMSScreen';

import ZPrimeFooter from '../components/Z-PrimeFooter';
import CompanyDrawerHeader from '../components/CompanyDrawerHeader';

import { theme } from '../theme/theme';
import {
  ComapnyIcon,
  CompanyName,
} from '../constants/companyInfo';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

/* =========================================================
   Custom Drawer
========================================================= */

function CustomDrawerContent(props) {
  return (
    <View style={styles.drawerContainer}>

      {/* Company Header */}
      <View style={styles.companyHeaderWrapper}>
        <CompanyDrawerHeader
          companyName={CompanyName}
          logo={ComapnyIcon}
        />
      </View>

      {/* Menu */}
      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.drawerScrollContent}
      >

        <View style={styles.menuTitleWrapper}>
          <Text style={styles.menuTitle}>
            MAIN MENU
          </Text>
        </View>

        <DrawerItemList {...props} />

      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footerWrapper}>
        <ZPrimeFooter />
      </View>

    </View>
  );
}

/* =========================================================
   Reusable Header
========================================================= */

function HeaderTitle({ title, icon }) {
  return (
    <View style={styles.headerTitleContainer}>

      <View style={styles.headerIconContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={theme.colors.cyan}
        />
      </View>

      <View>
        <Text style={styles.headerTitle}>
          {title}
        </Text>

        <Text style={styles.headerSubtitle}>
          {CompanyName} Management
        </Text>
      </View>

    </View>
  );
}

/* =========================================================
   Drawer Navigator
========================================================= */

// Defualt AppDrawer for employee
function AppDrawer({ userToken, setUserToken, setRole }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}

      screenOptions={{
        /* ---------------- HEADER ---------------- */

        headerShown: true,

        headerStyle: styles.header,

        headerTintColor: theme.colors.text,

        headerTitleAlign: 'left',

        headerTitleStyle: {
          display: 'none',
        },

        headerShadowVisible: false,

        headerLeftContainerStyle: {
          paddingLeft: 6,
        },

        /* ---------------- DRAWER ---------------- */

        drawerStyle: styles.drawer,

        drawerType: 'slide',

        overlayColor: 'rgba(0,0,0,0.35)',

        swipeEdgeWidth: 50,

        drawerActiveTintColor: theme.colors.cyan,

        drawerInactiveTintColor:
          theme.colors.textSecondary || '#7B8490',

        drawerActiveBackgroundColor:
          theme.colors.cyan + '12',

        drawerItemStyle: styles.drawerItem,

        drawerLabelStyle: styles.drawerLabel,

        drawerContentContainerStyle: {
          paddingHorizontal: 10,
        },

        sceneStyle: {
          backgroundColor:
            theme.colors.background || '#F7F9FC',
        },
      }}
    >

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          drawerLabel: 'My Dashboard',

          drawerIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={
                focused
                  ? 'view-dashboard'
                  : 'view-dashboard-outline'
              }
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="My Dashboard"
              icon="view-dashboard-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          CREATE BILL
      ===================================================== */}

      <Drawer.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{
          drawerLabel: 'Generate New Bill',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="file-plus-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Generate New Bill"
              icon="file-plus-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          BILL HISTORY
      ===================================================== */}

      <Drawer.Screen
        name="BillHistory"
        component={BillHistoryScreen}
        options={{
          drawerLabel: 'Bill History',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="history"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Bill History"
              icon="history"
            />
          ),
        }}
      />

      {/* =====================================================
          RECEIVED BILLS
      ===================================================== */}

      <Drawer.Screen
        name="ReceivedBills"
        component={ReceivedBillsScreen}
        options={{
          drawerLabel: 'Received Bills',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="inbox-arrow-down-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Received Bills"
              icon="inbox-arrow-down-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          DETAIL BILL
      ===================================================== */}

      <Drawer.Screen
        name="DetailBill"
        component={DetailBillScreen}
        options={({ route }) => ({
          drawerItemStyle: {
            display: 'none',
          },

          headerTitle: () => (
            <HeaderTitle
              title={
                route.params?.trackingNo
                  ? `Bill ${route.params.trackingNo}`
                  : 'Bill Details'
              }
              icon="file-document-outline"
            />
          ),
        })}
      />

      {/* =====================================================
          COMPANY PROFILE
      ===================================================== */}

      <Drawer.Screen
        name="CompanyProfile"
        component={CompanyProfileScreenEmp}
        options={{
          drawerLabel: 'Company Profile',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="office-building-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Company Profile"
              icon="office-building-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          USER PROFILE
      ===================================================== */}

      <Drawer.Screen
        name="User Profile"
        options={{
          drawerLabel: 'My Profile',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="My Profile"
              icon="account-circle-outline"
            />
          ),
        }}
      >
        {(props) => (
          <UserProfileScreen
            {...props}
            setUserToken={setUserToken}
            setRole={setRole}
          />
        )}
      </Drawer.Screen>

      {/* =====================================================
          CONSIGNEES
      ===================================================== */}

      <Drawer.Screen
        name="Consignees"
        component={ConsigneesListScreen}
        options={{
          drawerLabel: 'Consignees',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-multiple-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Consignees"
              icon="account-multiple-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          SENDERS
      ===================================================== */}

      <Drawer.Screen
        name="Senders"
        component={SendersListScreen}
        options={{
          drawerLabel: 'Senders',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Senders"
              icon="truck-delivery-outline"
            />
          ),
        }}
      />

    </Drawer.Navigator>
  );
}

function OwnerAppDrawer({
  userToken,
  setUserToken,
  setRole,
}) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      screenOptions={{
        /* ================= HEADER ================= */

        headerShown: true,

        headerStyle: styles.header,

        headerTintColor: theme.colors.text,

        headerTitleAlign: 'left',

        headerTitleStyle: {
          display: 'none',
        },

        headerShadowVisible: false,

        headerLeftContainerStyle: {
          paddingLeft: 6,
        },

        /* ================= DRAWER ================= */

        drawerStyle: styles.drawer,

        drawerType: 'slide',

        overlayColor: 'rgba(0,0,0,0.35)',

        swipeEdgeWidth: 50,

        drawerActiveTintColor: theme.colors.cyan,

        drawerInactiveTintColor:
          theme.colors.textSecondary || '#7B8490',

        drawerActiveBackgroundColor:
          theme.colors.cyan + '12',

        drawerItemStyle: styles.drawerItem,

        drawerLabelStyle: styles.drawerLabel,

        drawerContentContainerStyle: {
          paddingHorizontal: 10,
        },

        sceneStyle: {
          backgroundColor:
            theme.colors.background || '#F7F9FC',
        },
      }}
    >

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Drawer.Screen
        name="OwnerDashboard"
        component={CompanyOwnerDashboardScreen}
        options={{
          drawerLabel: 'Dashboard',

          drawerIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={
                focused
                  ? 'view-dashboard'
                  : 'view-dashboard-outline'
              }
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Dashboard"
              icon="view-dashboard-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          ALL BILLS
      ===================================================== */}

      <Drawer.Screen
        name="OwnerBills"
        component={CompanyOwnerAllBillsScreen}
        options={{
          drawerLabel: 'All Bills',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="file-document-multiple-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="All Bills"
              icon="file-document-multiple-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          BILL DETAIL
          /bill-detail/:trackingNo
      ===================================================== */}

      <Drawer.Screen
        name="OwnerBillDetail"
        component={DetailBillScreen}
        options={({ route }) => ({
          drawerItemStyle: {
            display: 'none',
          },

          headerTitle: () => (
            <HeaderTitle
              title={
                route.params?.trackingNo
                  ? `Bill ${route.params.trackingNo}`
                  : 'Bill Details'
              }
              icon="file-document-outline"
            />
          ),
        })}
      />

      {/* =====================================================
          BILL PRINT
          /bills/print/:trackingNo
      ===================================================== */}

      <Drawer.Screen
        name="OwnerBillPrint"
        component={DetailBillScreen}
        options={({ route }) => ({
          drawerItemStyle: {
            display: 'none',
          },

          headerTitle: () => (
            <HeaderTitle
              title={
                route.params?.trackingNo
                  ? `Print Bill ${route.params.trackingNo}`
                  : 'Print Bill'
              }
              icon="printer-outline"
            />
          ),
        })}
      />

      {/* =====================================================
          CONFIGURATION
          /config
      ===================================================== */}

      <Drawer.Screen
        name="Configuration"
        component={CompanyConfigScreen}
        options={{
          drawerLabel: 'Configuration',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Configuration"
              icon="cog-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          WEIGHT PRICING
          /Weight-pricing
      ===================================================== */}

      <Drawer.Screen
        name="WeightPricing"
        component={WeightPricingScreen}
        options={{
          drawerLabel: 'Weight Pricing',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="scale-balance"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Weight Pricing"
              icon="scale-balance"
            />
          ),
        }}
      />

      {/* =====================================================
          VOLUME PRICING
          /volume-pricing
      ===================================================== */}

      <Drawer.Screen
        name="VolumePricing"
        component={VolumePricingScreen}
        options={{
          drawerLabel: 'Volume Pricing',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="cube-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Volume Pricing"
              icon="cube-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          BRANCHES
          /branches
      ===================================================== */}

      <Drawer.Screen
        name="Branches"
        component={BranchListScreen}
        options={{
          drawerLabel: 'Branches',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="source-branch"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Branches"
              icon="source-branch"
            />
          ),
        }}
      />

      {/* =====================================================
          CASHERS
          /cashers
      ===================================================== */}

      <Drawer.Screen
        name="Cashers"
        component={CasherListScreen}
        options={{
          drawerLabel: 'Cashiers',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="cash-register"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Cashiers"
              icon="cash-register"
            />
          ),
        }}
      />

      {/* =====================================================
          SPECIAL SMS
          /special-sms
      ===================================================== */}

      <Drawer.Screen
        name="SpecialSMS"
        component={SpecialSMSScreen}
        options={{
          drawerLabel: 'Special SMS',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="message-text-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Special SMS"
              icon="message-text-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          COMPANY PROFILE
      ===================================================== */}

      <Drawer.Screen
        name="CompanyProfile"
        component={CompanyProfileScreenEmp}
        options={{
          drawerLabel: 'Company Profile',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="office-building-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="Company Profile"
              icon="office-building-outline"
            />
          ),
        }}
      />

      {/* =====================================================
          USER PROFILE
      ===================================================== */}

      <Drawer.Screen
        name="User Profile"
        options={{
          drawerLabel: 'My Profile',

          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={23}
              color={color}
            />
          ),

          headerTitle: () => (
            <HeaderTitle
              title="My Profile"
              icon="account-circle-outline"
            />
          ),
        }}
      >
        {(props) => (
          <UserProfileScreen
            {...props}
            setUserToken={setUserToken}
            setRole={setRole}
          />
        )}
      </Drawer.Screen>

    </Drawer.Navigator>
  );
}


/* =========================================================
   Main Navigator
========================================================= */

export default function AppNavigator({
  userToken,
  role,
  setUserToken,
  setRole
}) {
  if (userToken == null) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen
              {...props}
              setUserToken={setUserToken}
              setRole={setRole}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  console.log("role", role);
  

  if (role == "company_admin") {

    return (
      <OwnerAppDrawer
        userToken={userToken}
        setUserToken={setUserToken}
        setRole={setRole}
      />
    );
  } else {

    return (
      <AppDrawer
        userToken={userToken}
        setUserToken={setUserToken}
        setRole={setRole}
      />
    );
  }
}

/* =========================================================
   Styles
========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     DRAWER
  ======================================================= */

  drawerContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },

  drawer: {
    width: 292,

    backgroundColor:
      theme.colors.surface,

    elevation: 12,

    shadowColor: '#000',

    shadowOffset: {
      width: 4,
      height: 0,
    },

    shadowOpacity: 0.12,

    shadowRadius: 18,
  },

  companyHeaderWrapper: {
    backgroundColor:
      theme.colors.surface,

    borderBottomWidth: 1,

    borderBottomColor:
      theme.colors.border,

    paddingBottom: 4,
  },

  drawerScrollContent: {
    paddingTop: 8,
    paddingBottom: 20,

    flexGrow: 1,
  },

  /* =======================================================
     MENU TITLE
  ======================================================= */

  menuTitleWrapper: {
    paddingHorizontal: 18,

    paddingTop: 14,

    paddingBottom: 8,
  },

  menuTitle: {
    fontSize: 10,

    fontWeight: '800',

    letterSpacing: 1.5,

    color:
      theme.colors.textSecondary ||
      '#8A929D',
  },

  /* =======================================================
     DRAWER ITEMS
  ======================================================= */

  drawerItem: {
    borderRadius: 13,

    marginHorizontal: 4,

    marginVertical: 3,

    paddingHorizontal: 7,

    height: 50,

    justifyContent: 'center',
  },

  drawerLabel: {
    fontSize: 14.5,

    fontWeight: '600',

    marginLeft: 1,

    letterSpacing: 0.1,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footerWrapper: {
    borderTopWidth: 1,

    borderTopColor:
      theme.colors.border,

    paddingTop: 8,

    paddingBottom:
      Platform.OS === 'ios'
        ? 8
        : 4,
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    backgroundColor:
      theme.colors.surface,

    height:
      Platform.OS === 'ios'
        ? 96
        : 68,

    borderBottomWidth: 1,

    borderBottomColor:
      theme.colors.border,

    elevation: 0,

    shadowColor: 'transparent',

    shadowOpacity: 0,

    shadowRadius: 0,

    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  headerTitleContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    marginLeft: 2,

    paddingTop:
      Platform.OS === 'ios'
        ? 8
        : 0,
  },

  headerIconContainer: {
    width: 40,

    height: 40,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

    backgroundColor:
      theme.colors.cyan + '12',
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: '800',

    color:
      theme.colors.text,

    letterSpacing: -0.2,
  },

  headerSubtitle: {
    fontSize: 10.5,

    marginTop: 2,

    fontWeight: '500',

    color:
      theme.colors.textSecondary ||
      '#8A929D',

    letterSpacing: 0.2,
  },
});
