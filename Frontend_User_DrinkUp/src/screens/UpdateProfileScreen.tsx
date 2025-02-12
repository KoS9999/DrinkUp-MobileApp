import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, Alert, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import UpdateEmailScreen from "./UpdateEmailScreen";
import UpdatePhoneScreen from "./UpdatePhoneScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.2.9:5001/api/user";

// Hàm lấy token từ AsyncStorage
const getAuthToken = async () => {
  return await AsyncStorage.getItem("userToken");
};

const UpdateProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<"name" | "address" | null>(null);
  const [newValue, setNewValue] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, 
          },
        });

        const result = await response.json();
        if (response.ok) {
          setUser(result.user);
        } else {
          Alert.alert("Lỗi", result.message);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin:", error);
        Alert.alert("Lỗi", "Không thể lấy thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const updateField = async () => {
    if (!fieldToEdit || !newValue) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify({ [fieldToEdit]: newValue }),
      });

      const result = await response.json();
      if (response.ok) {
        setUser((prev: any) => ({ ...prev, [fieldToEdit]: newValue }));
        Alert.alert("Thành công", "Cập nhật thông tin thành công.");
      } else {
        Alert.alert("Lỗi", result.message);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật.");
    }
    setModalVisible(false);
  };

  if (loading) return <Text>Đang tải thông tin...</Text>;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Ảnh đại diện */}
      <Image source={{ uri: user?.profileImage || "https://via.placeholder.com/100" }} style={{ width: 100, height: 100, borderRadius: 50, alignSelf: "center" }} />

      {/* Thông tin người dùng */}
      {[
        { key: "name", label: "Tên", editable: true },
        { key: "email", label: "Email", editable: false, screen: "UpdateEmailScreen" },
        { key: "phone", label: "Số điện thoại", editable: false, screen: "UpdatePhoneScreen" },
        { key: "address", label: "Địa chỉ", editable: true },
      ].map(({ key, label, editable, screen }) => (
        <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 10 }}>
          <Text>{label}: {user?.[key]}</Text>
          <TouchableOpacity onPress={() => {
            if (screen) navigation.navigate(screen as never);
            else { setFieldToEdit(key as any); setModalVisible(true); }
          }}>
            <MaterialIcons name="edit" size={24} color="blue" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Modal chỉnh sửa Name & Address */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "80%", padding: 20, backgroundColor: "#fff", borderRadius: 10 }}>
            <Text>Cập nhật {fieldToEdit === "name" ? "Tên" : "Địa chỉ"}</Text>
            <TextInput style={{ borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10 }} value={newValue} onChangeText={setNewValue} />
            <TouchableOpacity onPress={updateField} style={{ backgroundColor: "blue", padding: 10, borderRadius: 5, alignItems: "center" }}>
              <Text style={{ color: "#fff" }}>Cập nhật</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10, alignItems: "center" }}>
              <Text style={{ color: "red" }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Stack = createStackNavigator();

const UpdateProfileScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UpdateProfile" component={UpdateProfile} options={{ title: "Cập nhật hồ sơ" }} />
      <Stack.Screen name="UpdateEmailScreen" component={UpdateEmailScreen} options={{ title: "Cập nhật Email" }} />
      <Stack.Screen name="UpdatePhoneScreen" component={UpdatePhoneScreen} options={{ title: "Cập nhật Số điện thoại" }} />
    </Stack.Navigator>
  );
};

export default UpdateProfileScreen;
