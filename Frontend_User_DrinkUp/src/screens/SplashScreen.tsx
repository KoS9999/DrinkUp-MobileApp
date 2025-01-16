import React, { useEffect } from 'react';
import { ActivityIndicator, Image, ImageBackground } from 'react-native';
import { appInfo } from '../constants/appInfos';
import { appColors } from '../constants/appColors';
import { SpaceComponent } from '../components';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigators/AppNavigator'; 

const SplashScreen = () => {
  const navigation  = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('OnBoardingScreen'); // Chuyển đến màn hình Login
    }, 1500); // 1.5 giây

    return () => clearTimeout(timer); // Xóa timer khi component unmount
  }, [navigation]);

  return (
    <ImageBackground
      source = {require('../assets/images/splash-background.png')}
      style = {{
        flex: 1,
          justifyContent: 'center',
            alignItems: 'center',
      }}
      imageStyle = {{ flex: 1 }}>
      <Image
        source={require('../assets/images/logo-drinkup.png')}
        style={{
        width: appInfo.sizes.WIDTH *0.7,
        resizeMode: 'contain',
        }}
      />
      <SpaceComponent height={16} />
    <ActivityIndicator color={appColors.gray} size={22} />
  </ImageBackground >
  );
};
export default SplashScreen;