import { View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SplashScreen } from './src/screens';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigators/AuthNavigator';
import { StatusBar } from 'react-native';

const App = () => {
  const [isShowSplash, setIsShowPlash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsShowPlash(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  return <>
    <StatusBar barStyle={'dark-content'} translucent backgroundColor={'transparent'} />
    {
      !isShowSplash ? (
        <SplashScreen/>
      ) : (
        <NavigationContainer>
          <AuthNavigator/>
        </NavigationContainer>
      )
    }
  </>
};

export default App;