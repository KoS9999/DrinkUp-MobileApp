import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SplashScreen from '../screens/SplashScreen';
import OnBoardingScreen from '../screens/OnBoardingScreen';
import HomeScreen from '../screens/HomeScreen';

export type RootStackParamList = {
  SplashScreen: undefined;
  OnBoardingScreen: undefined;
  HomeScreen: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator  initialRouteName="SplashScreen">
        <Stack.Screen options={{ headerShown: false}} name="SplashScreen" component={SplashScreen} />
        <Stack.Screen options={{ headerShown: false}} name="OnBoardingScreen" component={OnBoardingScreen} />
        <Stack.Screen options={{ headerShown: false}} name="HomeScreen" component={HomeScreen} />
        {/* Tạm thời để headerShown của Login là false */}
        <Stack.Screen options={{ headerTitle: ''}} name="Login" component={LoginScreen} /> 
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
