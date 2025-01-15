import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator'; 

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Register'>>();

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      setError('Tất cả các trường đều bắt buộc.');
      return;
    }

    try {
      const response = await fetch('http://192.168.2.6:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Đăng ký thất bại.');
        return;
      }

      setError('');
      setStep(2); // Move to OTP step
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Register error:', error);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    try {
      const response = await fetch('http://192.168.2.6:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone, otp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Xác thực OTP thất bại.');
        return;
      }

      setError('');
      console.log('Registration successful');
      navigation.navigate('Login'); // Chuyển sang màn hình Login
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('OTP verification error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 ? (
        <>
          <Text style={styles.title}>Đăng Ký</Text>

          <TextInput
            style={styles.input}
            placeholder="Họ và Tên"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Đăng Ký</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Nhập OTP</Text>

          <TextInput
            style={styles.input}
            placeholder="Mã OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.registerButton} onPress={handleVerifyOtp}>
            <Text style={styles.registerButtonText}>Xác Thực</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  registerButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});

export default RegisterScreen;
