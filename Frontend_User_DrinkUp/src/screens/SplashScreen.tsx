import React, { useEffect } from 'react';
import { View, Image, ImageBackground, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { appInfo } from '../constants/appInfos';
import { appColors } from '../constants/appColors';
import { SpaceComponent } from '../components';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "../config/api";

const SplashScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [fontsLoaded] = useFonts({
    "Pacifico-Regular": require("../../assets/fonts/Pacifico-Regular.ttf"),
  });
  console.log('Fonts Loaded:', fontsLoaded);

  useEffect(() => {
    if (fontsLoaded) {
      // SplashScreen.tsx
      const checkAuthStatus = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

          // Debug thêm thông tin
          console.log('Token exists:', !!token);
          console.log('isLoggedIn:', isLoggedIn);

          if (!token || isLoggedIn !== 'true') {
            navigation.replace('OnBoardingScreen');
            return;
          }

          const response = await fetch(`${API_BASE_URL}/auth/verify-token`, { 
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` // Gửi token qua header
            },
          });

          // Debug response
          console.log('Verify token status:', response.status);
          const responseBody = await response.text();
          console.log('Response body:', responseBody);

          if (response.ok) {
            navigation.replace('HomeScreen');
          } else {
            await AsyncStorage.multiRemove(['userToken', 'isLoggedIn', 'user']);
            navigation.replace('OnBoardingScreen');
          }
        } catch (error) {
          console.error('Auth check error:', error);
          navigation.replace('OnBoardingScreen');
        }
      };
  
      const splashTimeout = setTimeout(() => {
        checkAuthStatus();
      }, 2000);
      
      return () => clearTimeout(splashTimeout);
    }
  }, [fontsLoaded, navigation]);

  if (!fontsLoaded) {
    return null; // Hoặc hiển thị ActivityIndicator trong khi tải font
  }

  return (
    <ImageBackground
      source={require('../assets/images/splash-background-1.png')}
      style={styles.imageBackground}
    >
      {/* Lớp phủ màu tối */}
      <View style={styles.overlay} />

      {/* Nội dung trên lớp phủ */}
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo-drinkup-1.png')}
          style={styles.logo}
        />
        <Text style={styles.websiteName}>DrinkUp</Text>
        <Text style={styles.slogan}>Sip - Savor - Smile</Text>
        <SpaceComponent height={16} />
        <ActivityIndicator color={appColors.gray} size={22} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Phủ toàn bộ ImageBackground
    backgroundColor: 'rgba(50, 74, 89, 0.5)', // Màu xanh dương đậm với độ trong suốt 50%
  },
  content: {
    justifyContent: 'flex-start', // Align items to the top
    alignItems: 'center',
    marginTop: -400, // Adjust this value to move the content up or down
  },
  logo: {
    width: appInfo.sizes.WIDTH * 0.5,
    height: appInfo.sizes.WIDTH * 0.5,
    resizeMode: 'contain',
    marginBottom: 10, // Khoảng cách giữa logo và tên website
    marginTop: 90
  },
  websiteName: {
    fontFamily: "Pacifico-Regular",
    fontSize: 50,
    color: '#FFFFFF', // Màu trắng
    marginBottom: 3, // Khoảng cách giữa tên website và slogan
  },
  slogan: {
    fontFamily: "Pacifico-Regular",
    fontSize: 20,
    color: '#FFFFFF', // Màu trắng
    marginBottom: 20, // Khoảng cách giữa slogan và ActivityIndicator
  },
});

export default SplashScreen;
