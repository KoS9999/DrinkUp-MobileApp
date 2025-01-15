import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

const MainNavigatior = () => {
    const Stack = createNativeStackNavigator();
    //Main gọi Tab
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={TabNavigator} />
        </Stack.Navigator>
    );
};
export default MainNavigatior;