import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { HomeScreen } from '../screens';

const TabNavigator = () => {
    const Tab = createBottomTabNavigator();
    //Tab gọi Home
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Tab.Screen name="HomeScreen" component={HomeScreen} />
        </Tab.Navigator>
    );
};
export default TabNavigator;