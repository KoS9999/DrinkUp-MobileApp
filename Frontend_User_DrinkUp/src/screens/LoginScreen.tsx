import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { FontAwesome5, FontAwesome, Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../config/socket';
import { API_BASE_URL } from "../config/api";

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email và mật khẩu không được để trống.');
      return;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === 'Không tìm thấy người dùng') {
          setError('Không tìm thấy người dùng.');
        } else if (errorData.message === 'Thông tin đăng nhập không hợp lệ') {
          setError('Sai mật khẩu.');
        } else {
          setError(errorData.message || 'Đăng nhập thất bại.');
        }
        return;
      }
  
      const data = await response.json();
      console.log('Login successful:', data);
  
      setError('');
  
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userName', data.user.name);
      await AsyncStorage.setItem('user', JSON.stringify(data.user)); 
  
      if (!socket.connected) {
        socket.connect();
      }
  
      const userId = data.user._id || data.user.id;
      if (userId) {
        socket.emit('join', userId);
        console.log('📲 Socket emit join:', userId);
      }
  
      navigation.navigate('HomeScreen');
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Login error:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo-drinkup.png')} style={styles.logo}></Image>
      <Text style={styles.title}>Đăng nhập</Text>
      <Text style={styles.subtitle}>Truy cập vào tài khoản của bạn</Text>
      <View style={styles.inputContainer}>
        <Entypo name="email" size={24} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Entypo name="lock" size={24} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Entypo
            name={showPassword ? "eye" : "eye-with-line"}
            size={24}
            color="#888"
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.rowContainer}>
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity onPress={() =>setRememberMe(!rememberMe)}>
            <FontAwesome name={ rememberMe? "check-square-o" : "square-o"} size={24} color={rememberMe? "green":"#888"}/>
          </TouchableOpacity>
          <Text style={styles.rememberMeText}>Remember Me</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Đăng nhập</Text>
      </TouchableOpacity>

      <View style={styles.rowContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Bạn chưa có tài khoản?{' '}
        <Text style={styles.signUpText} onPress={() => navigation.navigate('Register')}>
          Đăng ký
        </Text>
      </Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    //marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#502419',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 8,
    color: '#888',
    fontSize: 15
  },
  forgotPassword: {
    color: '#985446',
    fontSize: 15,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#7EA172',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 15,
    color: '#888',
    marginBottom: -20
  },
  signUpText: {
    color: '#985446',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
})

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Đăng Nhập</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Email hoặc Số điện thoại"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Mật khẩu"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       {error ? <Text style={styles.errorText}>{error}</Text> : null}

//       <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
//         <Text style={styles.loginButtonText}>Đăng Nhập</Text>
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
//         <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.register}>Đăng ký</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 24,
//   },
//   input: {
//     width: '100%',
//     height: 50,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//     backgroundColor: '#fff',
//   },
//   loginButton: {
//     width: '100%',
//     height: 50,
//     backgroundColor: '#007bff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   loginButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   forgotPassword: {
//     marginTop: 16,
//     color: '#007bff',
//     fontSize: 14,
//   },
//   register: {
//     marginTop: 16,
//     color: '#007bff',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   errorText: {
//     color: 'red',
//     marginBottom: 16,
//   },
// });

export default LoginScreen;
