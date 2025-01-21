import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { Entypo } from '@expo/vector-icons';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const handleRequestOtp = async () => {
    if (!email) {
      setError('Vui lòng nhập email.');
      return;
    }

    try {
      //const response = await fetch('http://192.168.2.6:5001/api/auth/forgot-password', {
      const response = await fetch('http://192.168.1.133:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Yêu cầu OTP thất bại.');
        return;
      }

      setError('');
      setStep(2);
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('OTP request error:', error);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setError('Tất cả các trường đều bắt buộc.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      //const response = await fetch('http://192.168.2.6:5001/api/auth/reset-password', {
        const response = await fetch('http://192.168.1.133:5001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Đặt lại mật khẩu thất bại.');
        return;
      }

      setError('');
      console.log('Password reset successful');
      navigation.navigate('Login');
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Password reset error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo-drinkup.png')} style={styles.logo} />

      {step === 1 ? (
        <>
          <Text style={styles.title}>Quên Mật Khẩu</Text>
          <Text style={styles.subtitle}>Nhập email để nhận mã OTP</Text>

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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.actionButton} onPress={handleRequestOtp}>
            <Text style={styles.actionButtonText}>Yêu Cầu OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Đặt Lại Mật Khẩu</Text>
          <Text style={styles.subtitle}>Nhập mã OTP và mật khẩu mới</Text>

          <View style={styles.inputContainer}>
            <Entypo name="lock" size={24} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mã OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Entypo name="lock" size={24} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Entypo name="lock" size={24} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.actionButton} onPress={handleResetPassword}>
            <Text style={styles.actionButtonText}>Đặt Lại Mật Khẩu</Text>
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
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 14,
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
  actionButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#7EA172',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});

export default ForgotPasswordScreen;
