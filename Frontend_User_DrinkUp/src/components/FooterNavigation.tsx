import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ScreenName = 'HomeTab' | 'OrderTab' | 'CartTab' | 'StoreTab' | 'AccountTab';

type TabItem = {
  route: ScreenName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap;
  IconComponent: typeof Ionicons | typeof MaterialIcons;
};

// Danh sách các tab (định nghĩa ngoài component để tránh re-create mỗi lần render)
const tabs: TabItem[] = [
  { route: 'HomeTab', label: 'Trang chủ', icon: 'home', IconComponent: Ionicons },
  { route: 'OrderTab', label: 'Đặt nước', icon: 'local-cafe', IconComponent: MaterialIcons },
  { route: 'CartTab', label: 'Giỏ hàng', icon: 'cart-outline', IconComponent: Ionicons },
  { route: 'StoreTab', label: 'Cửa hàng', icon: 'storefront-outline', IconComponent: Ionicons },
  { route: 'AccountTab', label: 'Tài khoản', icon: 'person-outline', IconComponent: Ionicons }
];

const FooterNavigation: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() =>{
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token); //Nếu có token thì set true, ngược lại là false
    };
    checkLoginStatus();
  }, []);

  const handleAccountPress = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if(token){
      navigation.navigate('AccountTab' as never);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  return (
    <View style={styles.footer}>
      {tabs.map(({ route, label, icon, IconComponent }, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={route}
            style={styles.navItem}
            onPress={route === 'AccountTab' ? handleAccountPress : () => navigation.navigate(route as never)}
            //onPress={() => navigation.navigate(route as never)}
          >
            <IconComponent name={icon as any} size={24} color={isActive ? 'white' : '#D7B6A5'} />
            <Text style={[styles.navText, !isActive && styles.navTextInactive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default FooterNavigation;

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#6E3816',
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  navTextInactive: {
    color: '#D7B6A5',
    fontSize: 12,
    marginTop: 4,
  },
});
