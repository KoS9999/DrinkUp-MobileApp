import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native"; 

const API_BASE_URL = "http://192.168.2.9:5001/api/user";

const getAuthToken = async () => {
  return await AsyncStorage.getItem("userToken");
};

const UpdatePhoneScreen = () => {
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); 
  const navigation = useNavigation(); 

  const requestOtp = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/update-phone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPhone }),
      });

      const result = await response.json();
      if (response.ok) {
        setStep(2);
        Alert.alert("OTP đã gửi", "Vui lòng kiểm tra email của bạn.");
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi OTP.");
    }
  };

  const updatePhone = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/update-phone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPhone, otpFromEmail: otp }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Thành công", "Cập nhật số điện thoại thành công.");
        navigation.goBack();
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật số điện thoại.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {step === 1 && (
        <>
          <Text>Nhập số điện thoại mới:</Text>
          <TextInput style={{ borderBottomWidth: 1, marginBottom: 10 }} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
          <TouchableOpacity onPress={requestOtp} style={{ backgroundColor: "blue", padding: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Gửi OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text>Nhập OTP:</Text>
          <TextInput style={{ borderBottomWidth: 1, marginBottom: 10 }} value={otp} onChangeText={setOtp} keyboardType="numeric" />
          <TouchableOpacity onPress={updatePhone} style={{ backgroundColor: "green", padding: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Cập nhật Số điện thoại</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default UpdatePhoneScreen;
