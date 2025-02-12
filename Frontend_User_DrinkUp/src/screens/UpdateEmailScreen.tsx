import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native"; // ✅ Import useNavigation

const API_BASE_URL = "http://192.168.2.9:5001/api/user";

const getAuthToken = async () => {
  return await AsyncStorage.getItem("userToken");
};

const UpdateEmailScreen = () => {
  const [newEmail, setNewEmail] = useState("");
  const [currentEmailOtp, setCurrentEmailOtp] = useState("");
  const [newEmailOtp, setNewEmailOtp] = useState("");
  const [step, setStep] = useState(1);
  const navigation = useNavigation(); 

  const startEmailUpdateProcess = async () => {
    if (!newEmail.includes("@")) {
      Alert.alert("Lỗi", "Vui lòng nhập email hợp lệ.");
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/update-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail }),
      });

      const result = await response.json();
      if (response.ok) {
        setStep(2);
        Alert.alert("OTP đã gửi", "Vui lòng kiểm tra email hiện tại.");
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi OTP.");
    }
  };

  const verifyCurrentEmailOtp = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/update-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail, otpFromCurrentEmail: currentEmailOtp }),
      });

      const result = await response.json();
      if (response.ok) {
        setStep(3);
        Alert.alert("OTP đã gửi", "Vui lòng kiểm tra email mới.");
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi OTP đến email mới.");
    }
  };

  const updateEmail = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/update-email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail, otpFromCurrentEmail: currentEmailOtp, otpFromNewEmail: newEmailOtp }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Thành công", "Cập nhật email thành công.");
        navigation.goBack(); 
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật email.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {step === 1 && (
        <>
          <Text>Nhập email mới:</Text>
          <TextInput style={{ borderBottomWidth: 1, marginBottom: 10 }} value={newEmail} onChangeText={setNewEmail} />
          <TouchableOpacity onPress={startEmailUpdateProcess} style={{ backgroundColor: "blue", padding: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Xác nhận</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text>Nhập OTP từ email hiện tại:</Text>
          <TextInput style={{ borderBottomWidth: 1, marginBottom: 10 }} value={currentEmailOtp} onChangeText={setCurrentEmailOtp} keyboardType="numeric" />
          <TouchableOpacity onPress={verifyCurrentEmailOtp} style={{ backgroundColor: "blue", padding: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Gửi OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <Text>Nhập OTP từ email mới:</Text>
          <TextInput style={{ borderBottomWidth: 1, marginBottom: 10 }} value={newEmailOtp} onChangeText={setNewEmailOtp} keyboardType="numeric" />
          <TouchableOpacity onPress={updateEmail} style={{ backgroundColor: "green", padding: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Cập nhật Email</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default UpdateEmailScreen;
