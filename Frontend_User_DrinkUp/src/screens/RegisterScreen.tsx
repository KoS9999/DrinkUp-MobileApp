import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export default function RegisterScreen({ navigation }: any) {
  const [otpSent, setOtpSent] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>
      {!otpSent ? (
        <>
          <TextInput style={styles.input} placeholder="Họ và tên" />
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Mật khẩu" secureTextEntry />
          <TextInput style={styles.input} placeholder="Số điện thoại" keyboardType="phone-pad" />
          <TouchableOpacity style={styles.button} onPress={() => setOtpSent(true)}>
            <Text style={styles.buttonText}>Gửi OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Nhập OTP" keyboardType="numeric" maxLength={6} />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Xác thực</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8, padding: 10, marginBottom: 15 },
  button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16 },
  linkText: { marginTop: 10, color: COLORS.link, fontSize: 14 },
});
