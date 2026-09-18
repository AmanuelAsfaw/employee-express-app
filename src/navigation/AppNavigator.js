import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/Employee/DashboardScreen';
import CreateBillScreen from '../screens/Employee/CreateBillScreen';
import BillHistoryScreen from '../screens/Employee/BillHistoryScreen';
import ReceivedBillsScreen from '../screens/Employee/ReceivedBillsScreen';
import DetailBillScreen from '../screens/Employee/DetailBillScreen';

import { theme } from '../theme/theme';
import UserProfileScreen from '../screens/Employee/UserProfileScreen';
import CompanyProfileScreenEmp from '../screens/Employee/CompanyProfileScreenEmp';
import { View } from 'react-native';
import ZPrimeFooter from '../components/Z-PrimeFooter';
import CompanyDrawerHeader from '../components/CompanyDrawerHeader';
import { ComapnyIcon, CompanyName } from '../constants/companyInfo';
import ConsigneesListScreen from '../screens/Employee/ConsigneesListScreen';
import SendersListScreen from '../screens/Employee/SendersListScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <View style={{ flex: 1 }}>
      <CompanyDrawerHeader
        companyName={CompanyName}
        logo={ComapnyIcon}
      />
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <ZPrimeFooter />
    </View>
  );
}


function AppDrawer({ userToken, setUserToken }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },

        headerTintColor: theme.colors.text,

        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.cyan,
        },

        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },

        drawerActiveTintColor: theme.colors.cyan,
        drawerInactiveTintColor: theme.colors.text,

        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '600',
        },
      }}
    >

      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'My Dashboard',
        }}
      />

      <Drawer.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{
          title: 'Generate New Bill',
        }}
      />

      <Drawer.Screen
        name="BillHistory"
        component={BillHistoryScreen}
        options={{
          title: 'Bill History',
        }}
      />

      <Drawer.Screen
        name="ReceivedBills"
        component={ReceivedBillsScreen}
        options={{
          title: 'Received Bills',
        }}
      />

      <Drawer.Screen
        name="DetailBill"
        component={DetailBillScreen}
        options={({ route }) => ({
          title: route.params?.trackingNo
            ? `Bill: ${route.params.trackingNo}`
            : 'Bill Details',

          // Don't show Detail Bill in the drawer menu
          drawerItemStyle: {
            display: 'none',
          },
        })}
      />

      <Drawer.Screen
        name="CompanyProfile"
        component={CompanyProfileScreenEmp}
        options={{
          title: 'Company Profile',
        }}
      />


      <Drawer.Screen
        name="User Profile"
        options={{
          title: 'User Profile',
        }}
      >
        {(props) => <UserProfileScreen {...props} setUserToken={setUserToken} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Consignees"
        component={ConsigneesListScreen}
        options={{
          title: 'Consignees',
        }}
      />


      <Drawer.Screen
        name="Senders"
        component={SendersListScreen}
        options={{
          title: 'Senders',
        }}
      />


    </Drawer.Navigator>
  );
}

export default function AppNavigator({ userToken, setUserToken }) {
  if (userToken == null) {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          options={{
            headerShown: false,
          }}
        >
          {(props) => (
            <LoginScreen
              {...props}
              setUserToken={setUserToken}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return <AppDrawer userToken={userToken} setUserToken={setUserToken}/>;
}
