import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, Alert, Modal, StyleSheet, ImageBackground } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import UpdateEmailScreen from "./UpdateEmailScreen";
import UpdatePhoneScreen from "./UpdatePhoneScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
//import axios from 'axios';
import { API_BASE_URL } from "../config/api";

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
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      uploadProfileImage(result.assets[0].uri);
    }
  };
  const uploadProfileImage = async (uri: string) => {
    const token = await getAuthToken();
    const formData = new FormData();

    const fileUri = uri;
    const fileName = fileUri.split('/').pop() ?? "default.jpg";
    const fileType = fileName.split(".").pop() ?? "jpg";

    console.log("Uploading file with URI:", fileUri);

    // Đổi URI sang Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    formData.append("image", {
      uri: fileUri,
      name: fileName,
      type: `image/${fileType}`,
    } as any);
    
    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/user/update-profile-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const result = await uploadResponse.json();
      console.log("Server response:", result);

      if (uploadResponse.ok) {
        setUser((prev: any) => ({ ...prev, profileImage: result.imageUrl }));
        Alert.alert("Thành công", "Cập nhật ảnh người dùng thành công.");
      } else {
        Alert.alert("Lỗi", `Không thể cập nhật ảnh: ${result.message}`);
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Lỗi", "Không thể kết nối với server. Vui lòng thử lại.");
    }

    // try {
    //   const blob = await fetch(fileUri).then((response) => response.blob());
    //   console.log("Blob created:", blob);  

    //   formData.append('image', blob, fileName);

    //   console.log("Sending request to the server");  
    //   const response = await fetch(`${API_BASE_URL}/update-profile-image`, {
    //     method: 'PUT',
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //     body: formData,
    //   });

    //   const result = await response.json();
    //   console.log("Server response:", result); 
    //   if (response.ok) {
    //     setUser((prev: any) => ({ ...prev, profileImage: result.imageUrl }));
    //     Alert.alert('Thành công', 'Cập nhật ảnh người dùng thành công.');
    //   } else {
    //     console.error('Error response:', result);
    //     Alert.alert('Lỗi', `Không thể cập nhật ảnh: ${result.message}`);
    //   }
    // } catch (error) {
    //   console.error('Network Error:', error);

    //   Alert.alert('Lỗi', 'Không thể kết nối với server. Vui lòng thử lại.');
    // }
  };

  const updateField = async () => {
    if (!fieldToEdit || !newValue) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/user/update-profile`, {
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
    <ImageBackground
      source={require('../assets/images/background-update-profile-1.png')}
      style={styles.background}
      resizeMode="cover"
      blurRadius={3}
    >
      <View style={styles.overlay} />

      <View style={{ flex: 1, padding: 20 }}>
        {/* Ảnh đại diện */}
        <Image
          source={user?.profileImage ? { uri: user.profileImage } : require('../assets/images/logo-drinkup.png')}
          style={{ width: 100, height: 100, borderRadius: 50, alignSelf: "center", borderWidth: 2, borderColor: "#d3d3d3" }}
        />

        <TouchableOpacity onPress={pickImage}>
          <Text style={{ marginTop: 10, color: "white", fontWeight: "bold", alignSelf: "center" }}>
            Đổi ảnh đại diện
          </Text>
        </TouchableOpacity>

        {/* Thông tin người dùng */}
        {[
          { key: "name", label: "Tên", icon: "person-outline", editable: true },
          { key: "email", label: "Email", icon: "email", editable: false, screen: "UpdateEmailScreen" },
          { key: "phone", label: "Số điện thoại", icon: "phone", editable: false, screen: "UpdatePhoneScreen" },
          { key: "address", label: "Địa chỉ", icon: "location-on", editable: true },
        ].map(({ key, label, icon, screen, editable }) => (
          <View key={key} style={styles.itemRow}>
            <MaterialIcons name={icon as never} size={24} color="#6B7280" style={styles.itemIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{label}</Text>
              <Text style={styles.itemValue}>{user?.[key] || ""}</Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (screen) navigation.navigate(screen as never);
                else { setFieldToEdit(key as any); setModalVisible(true); }
              }}>
              <MaterialIcons name="edit" size={24} color="#6B7280" />
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
    </ImageBackground>
  );
};

const Stack = createStackNavigator();

const UpdateProfileScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UpdateProfile" component={UpdateProfile} options={{ headerShown: false }} />
      <Stack.Screen name="UpdateEmailScreen" component={UpdateEmailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UpdatePhoneScreen" component={UpdatePhoneScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default UpdateProfileScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(106, 160, 186, 0.5)',
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemIcon: {
    marginRight: 15,
    color: "#3F3F3F"
  },
  itemLabel: {
    fontSize: 14,
    color: "#3F3F3F",
  },
  itemValue: {
    fontSize: 16,
    fontWeight: "500",
    color: '#0A1858',
    marginTop: 2,
  },
  editButton: {
    padding: 5,
  },
});
