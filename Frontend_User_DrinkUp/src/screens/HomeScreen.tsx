import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Swiper from 'react-native-swiper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;


const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [greeting, setGreeting] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting());
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedIn === 'true');
    };

    checkLoginStatus();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'CHÀO BUỔI SÁNG, DRINKUP-ER';
    if (hour >= 12 && hour < 18) return 'CHÀO BUỔI CHIỀU, DRINKUP-ER';
    if (hour >= 18 && hour < 22) return 'CHÀO BUỔI TỐI, DRINKUP-ER';
    return 'CHÚC NGỦ NGON, DRINKUP-ER';
  };

  const [fontsLoaded] = useFonts({
    "Oswald-Regular": require("../../assets/fonts/Oswald-Regular.ttf"),
    "Oswald-Medium": require("../../assets/fonts/Oswald-Medium.ttf"),
    "Pacifico-Regular": require("../../assets/fonts/Pacifico-Regular.ttf"),
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/images/logo-drinkup-1.png')}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.role}>{isLoggedIn ? 'Thành viên' : 'Khách'}</Text>
          </View>
        </View>
        <MaterialIcons name="notifications-on" size={24} color="#6E3816" />
        {/* <Ionicons name="notifications-on" size={24} color="#6E3816" /> */}
      </View>

      {/* Đăng ký / Đăng nhập */}
      {/* {!isLoggedIn && (
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButton}>
          <Text style={styles.authButtonText}>ĐĂNG NHẬP/ ĐĂNG KÝ</Text>
        </TouchableOpacity>
      )} */}
      {(
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButton}>
          <Text style={styles.authButtonText}>ĐĂNG NHẬP/ ĐĂNG KÝ</Text>
        </TouchableOpacity>
      )}

      {/* Carousel */}
      <View style={styles.carousel}>
        <Image
          source={require('../assets/images/slide-1.png')}
          style={styles.carouselImage}
        />
        <View style={styles.indicators}>
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
        </View>
      </View>

      {/* Giao hàng / Lấy tận nơi */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionItem}
          
        >
          {/* onPress={() => navigation.navigate('DeliveryScreen')} */}
          <Image
            source={require('../assets/images/delivery.png')}
            style={styles.optionImage}
          />
           <Text style={styles.optionText}>Giao hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionItem}
          
        >
          {/* onPress={() => navigation.navigate('DeliveryScreen')} */}
          <Image
            source={require('../assets/images/pickup.png')}
            style={styles.optionImage}
          />
           <Text style={styles.optionText}>Lấy tận nơi</Text>
        </TouchableOpacity>

      </View>
      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.navText}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="local-cafe" size={24} color="#D7B6A5" />
          <Text style={styles.navTextInactive}>Đặt nước</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cart-outline" size={24} color="#D7B6A5" />
          <Text style={styles.navTextInactive}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="storefront-outline" size={24} color="#D7B6A5" />
          <Text style={styles.navTextInactive}>Cửa hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#D7B6A5" />
          <Text style={styles.navTextInactive}>Tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    backgroundColor: "#D9D9D9",
    borderRadius: 20,
    marginRight: 8,
  },
  greeting: {
    //fontFamily: "Oswald-Regular",
    fontSize: 14,
    color: '#A2730C',
  },
  role: {
    //fontFamily: "Oswald-Regular",
    fontSize: 12,
    color: '#0A1858',
  },
  authButton: {
    backgroundColor: '#7EA172',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  authButtonText: {
    //fontFamily: "Oswald-Regular",
    fontSize: 16,
    color: '#FFFFFF',
    alignItems: 'center',
    alignContent: 'center'
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  optionItem: {
    alignItems: 'center',
  },
  optionImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 10,
  },
  optionText: {
    fontSize: 14,
    color: '#0A1858',
  },
  carousel: {
    alignItems: 'center',
    marginBottom: 16,
  },
  carouselImage: {
    width: 400,
    height: 198.77,
    borderRadius: 12,
  },
  indicators: {
    flexDirection: 'row',
    marginTop: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#6E3816',
  },
  footer: {
    // flexDirection: 'row',
    // justifyContent: 'space-around',
    // backgroundColor: '#6E3816',
    // paddingVertical: 16,
    // borderTopLeftRadius: 24,
    // borderTopRightRadius: 24,
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


export default HomeScreen