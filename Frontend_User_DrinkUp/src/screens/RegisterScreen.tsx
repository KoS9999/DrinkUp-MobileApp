import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { FontAwesome5, FontAwesome, Entypo } from '@expo/vector-icons';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  //const [otp, setOtp] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(10 * 60);// 10 minutes
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Register'>>();

  // Đếm ngược thời gian
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Mỗi giây giảm 1

    return () => clearInterval(intervalRef.current!); // Dọn dẹp timer
  }, []);

  // Định dạng thời gian hiển thị
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      setError('Tất cả các trường đều bắt buộc.');
      return;
    }

    try {
      //const response = await fetch('http://192.168.2.6:5001/api/auth/register', {
      const response = await fetch('http://192.168.1.15:5001/api/auth/register', {
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

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');// Ghép mảng OTP thành chuỗi

    if (!otp) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    try {
      //const response = await fetch('http://192.168.2.6:5001/api/auth/register', {
      const response = await fetch('http://192.168.1.15:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone, otp: otpCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Xác thực OTP thất bại.');
        Alert.alert('OTP không hợp lệ. Xác thực OTP thất bại.')
        return;
      }

      setError('');
      setModalVisible(true); // Hiển thị modal khi xác thực thành công
      console.log('Registration successful');
      setModalVisible(true);
      //navigation.navigate('Login'); // Chuyển sang màn hình Login. Không điều hướng ngay lập tức
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('OTP verification error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 ? (
        <>
          <Image source={require('../assets/images/logo-drinkup.png')} style={styles.logo}></Image>
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Đăng ký trở thành DrinkUp-er</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="user-o" size={24} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              value={name}
              onChangeText={setName}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <FontAwesome name="phone" size={24} color="#888" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.acceptPolicyContainer}>
              <TouchableOpacity onPress={() => setAcceptPolicy(!acceptPolicy)}>
                <FontAwesome name={acceptPolicy ? "check-square-o" : "square-o"} size={24} color={acceptPolicy ? "green" : "#888"} />
              </TouchableOpacity>

              <Text style={styles.footerText}>
                <Text style={styles.acceptPolicyText}>Tôi đồng ý với{' '}</Text>
                <Text style={styles.signInText} onPress={() => navigation.navigate('PolicyScreen')}>
                  Điều khoản dịch vụ{' '}
                </Text>
                <Text style={styles.acceptPolicyText}> và </Text>

                <Text style={styles.signInText} onPress={() => navigation.navigate('PolicyScreen')}>
                  Chính sách quyền riêng tư.
                </Text>
              </Text>
            </View>
          </View>


          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
            <Text style={styles.loginButtonText}>Đăng ký</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
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

            <Text style={styles.timerText}>
              Mã OTP sẽ hết hạn trong: {formatTime(timeLeft)}
            </Text>

            {timeLeft === 0 ? (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Code Resent', 'Mã xác nhận đã được gửi lại!');
                  setTimeLeft(10 * 60); // Đặt lại thời gian 10 phút
                }}
              >
                <Text style={styles.resendText}>
                  OTP đã hết hạn. <Text style={styles.resendLink}>Gửi lại</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => Alert.alert('Code Resent', 'Mã xác nhận đã được gửi lại!')}
              >
                <Text style={styles.resendText}>
                  Chưa nhận được OTP? <Text style={styles.resendLink}>Gửi lại</Text>
                </Text>
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity onPress={() => Alert.alert('Code Resent', 'The code has been sent again!')}>
              <Text style={styles.resendText}>Chưa nhận được OTP? <Text style={styles.resendLink}>Gửi lại</Text></Text>
            </TouchableOpacity> */}
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleVerifyOtp}>
            <Text style={styles.verifyButtonText}>Xác thực</Text>
          </TouchableOpacity>

        </>
      )}
      <Text style={styles.footerText}>
        Bạn đã có tài khoản?{' '}
        <Text style={styles.signInText} onPress={() => navigation.navigate('Login')}>
          Đăng nhập
        </Text>
      </Text>
      {/* Modal thông báo */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Image
              source={require('../assets/images/checkmark.png')} // Đường dẫn ảnh
              style={styles.successIcon}
            />
            <Text style={styles.successMessage}>Xác thực thành công. Chào mừng thành viên mới!</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Login'); // Điều hướng sang Login ngay khi nhấn OK
              }}
            >
              <Text style={styles.closeButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>

  );
}

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
    marginTop: 0
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
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 16,
    color: '#FF0000',
    marginBottom: 20,
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
  footerText: {
    fontSize: 15,
    color: '#888',
    marginLeft: 8,
    //marginTop: 10,
  },
  signInText: {
    color: '#985446',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});


//{
// //   return (
//     <View style={styles.container}>
//       {step === 1 ? (
//         <>
//           <Text style={styles.title}>Đăng Ký</Text>

//           <TextInput
//             style={styles.input}
//             placeholder="Họ và Tên"
//             value={name}
//             onChangeText={setName}
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Email"
//             value={email}
//             onChangeText={setEmail}
//             keyboardType="email-address"
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Mật khẩu"
//             value={password}
//             onChangeText={setPassword}
//             secureTextEntry
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Số điện thoại"
//             value={phone}
//             onChangeText={setPhone}
//             keyboardType="phone-pad"
//           />

//           {error ? <Text style={styles.errorText}>{error}</Text> : null}

//           <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
//             <Text style={styles.registerButtonText}>Đăng Ký</Text>
//           </TouchableOpacity>
//         </>
//       ) : (
//         <>
//           <Text style={styles.title}>Nhập OTP</Text>

//           <TextInput
//             style={styles.input}
//             placeholder="Mã OTP"
//             value={otp}
//             onChangeText={setOtp}
//             keyboardType="numeric"
//           />

//           {error ? <Text style={styles.errorText}>{error}</Text> : null}

//           <TouchableOpacity style={styles.registerButton} onPress={handleVerifyOtp}>
//             <Text style={styles.registerButtonText}>Xác Thực</Text>
//           </TouchableOpacity>
//         </>
//       )}
//     </View>
//   );
// };
//}


export default RegisterScreen;
