import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { FontAwesome5, FontAwesome, Entypo } from '@expo/vector-icons';

const OTPScreen = () => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']); // Định nghĩa kiểu là mảng chuỗi
    const navigation = useNavigation();

    // Sử dụng useRef với kiểu dữ liệu TextInput hoặc null
    const refs = useRef<(TextInput | null)[]>([]);

    const handleInputChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            refs.current[index + 1]?.focus(); // Focus đến ô tiếp theo
        }
    };

    const verifyOtp = () => {
        if (otp.join('').length === 6) {
            Alert.alert('OTP Verified', `Your OTP is: ${otp.join('')}`);
            //   navigation.navigate('NextScreen');
        } else {
            Alert.alert('Invalid OTP', 'Please enter all 6 digits.');
        }
    };

    return (
        <View style={styles.containerOTP}>
            <Image source={require('../assets/images/image-verify-1.png')} style={styles.logoOTP}></Image>
            <Text style={styles.title}>Nhập OTP</Text>
            <Text style={styles.subtitle}>Kiểm tra mã xác nhận trong email của bạn</Text>

            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.otpInput}
                        keyboardType="numeric"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleInputChange(text, index)}
                        ref={(ref) => (refs.current[index] = ref)} // Gắn ref
                    />
                ))}
            </View>

            <TouchableOpacity onPress={() => Alert.alert('Code Resent', 'The code has been sent again!')}>
                <Text style={styles.resendText}>Chưa nhận được OTP? <Text style={styles.resendLink}>Gửi lại</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.verifyButton} onPress={verifyOtp}>
                <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>

            {/* <TextInput
                style={styles.input}
                placeholder="Mã OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.registerButton} onPress={handleVerifyOtp}>
                <Text style={styles.registerButtonText}>Xác Thực</Text>
            </TouchableOpacity> */}
        </View>
    )
}

const styles = StyleSheet.create({
    containerOTP: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    logoOTP: {
        width: 150,
        height: 150,
        //marginBottom: 5,
        marginTop: 10
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
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    otpInput: {
        width: 40,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 18,
        marginHorizontal: 5,
    },
    resendText: {
        fontSize: 15,
        color: '#888',
    },
    resendLink: {
        fontSize: 15,
        color: '#985446',
        textDecorationLine: 'underline',
    },
    verifyButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#6c757d',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 16,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    acceptPolicyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10
    },
    acceptPolicyText: {
        marginLeft: 8,
        color: '#888',
        fontSize: 15,
        lineHeight: 20
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
    registerButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#7EA172',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginBottom: 16,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 15,
        color: '#888',
        marginLeft: 8,
        //marginTop: 10,
    },
    signUpText: {
        color: '#985446',
        textDecorationLine: 'underline',
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
    },
});

export default OTPScreen