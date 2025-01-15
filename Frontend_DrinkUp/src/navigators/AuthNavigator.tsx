import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { LoginScreen, OnBoardingScreen } from '../screens';
const AuthNavigator = () => {
    const Stack = createNativeStackNavigator();
    //Auth gọi Login
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}>
            <Stack.Screen name="OnbroadingScreen" component={OnBoardingScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
        </Stack.Navigator>
    );
};
export default AuthNavigator;