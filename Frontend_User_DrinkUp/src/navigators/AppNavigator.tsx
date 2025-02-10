import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SplashScreen from '../screens/SplashScreen';
import OnBoardingScreen from '../screens/OnBoardingScreen';
import HomeScreen from '../screens/HomeScreen';
import PolicyScreen from '../screens/PolicyScreen';
import OrderScreen from '../screens/OrderScreen';
import CartScreen from '../screens/CartScreen';
import StoreScreen from '../screens/StoreScreen';
import AccountScreen from '../screens/AccountScreen';
import FooterNavigation from '../components/FooterNavigation';

// Định nghĩa kiểu dữ liệu cho Stack Navigator
export type RootStackParamList = {
  SplashScreen: undefined;
  OnBoardingScreen: undefined;
  HomeScreen: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PolicyScreen: undefined;
};

// Định nghĩa kiểu dữ liệu cho Bottom Tab Navigator
export type TabParamList = {
  HomeTab: undefined;
  OrderTab: undefined;
  CartTab: undefined;
  StoreTab: undefined;
  AccountTab: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Component HomeTabs để chứa Tab Navigator
const HomeTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FooterNavigation {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="OrderTab" component={OrderScreen} />
      <Tab.Screen name="CartTab" component={CartScreen} />
      <Tab.Screen name="StoreTab" component={StoreScreen} />
      <Tab.Screen name="AccountTab" component={AccountScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen options={{ headerShown: false }} name="SplashScreen" component={SplashScreen} />
        <Stack.Screen options={{ headerShown: false }} name="OnBoardingScreen" component={OnBoardingScreen} />
        <Stack.Screen options={{ headerShown: false }} name="HomeScreen" component={HomeTabs} />
        <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
        <Stack.Screen options={{ headerShown: false }} name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="PolicyScreen" component={PolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
