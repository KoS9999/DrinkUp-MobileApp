import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native'
import React, {useState, useEffect} from 'react'
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Barcode } from 'expo-barcode-generator';
import AsyncStorage from '@react-native-async-storage/async-storage';


type TabItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap;
  IconComponent: typeof Ionicons | typeof MaterialIcons;
};

const AccountScreen = () => {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      if(storedUserName){
        setUserName(storedUserName);
      }
    };
    fetchUserName();
  }, [])

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(loggedIn === 'true' && token !== null);
    };
    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView>
        <ImageBackground
          source={require('../assets/images/member-card-BG.png')}
          style={styles.memberCard}
          resizeMode="cover"
        >
          <Text style={styles.memberTitle}>THẺ THÀNH VIÊN</Text>
          <Text style={styles.katBalance}>8 POINTS</Text>
          <Text style={styles.memberName}>{userName}</Text>
          <Barcode     
            value="1234567890987"
            options={{ format: 'CODE128', background: 'white', height: 70, width: 2}}
          />
        </ImageBackground>

        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.item}>
                {item.IconComponent && <item.IconComponent name={item.icon as any} size={24} color="#0C2340" />}
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

const menuItems: TabItem[] = [
  { label: "Chỉnh sửa trang cá nhân", icon: "edit", IconComponent: MaterialIcons },
  { label: "Sở thích", icon: "coffee", IconComponent: MaterialIcons },
  { label: "Danh sách yêu thích", icon: "heart-half", IconComponent: Ionicons },
  { label: "Đặc quyền hạng thành viên", icon: "medal", IconComponent: FontAwesome5 },
  { label: "Ưu đãi", icon: "pricetag", IconComponent: Ionicons },
  { label: "Lịch sử đặt hàng", icon: "history", IconComponent: MaterialIcons },
  { label: "Đánh giá đơn hàng", icon: "star", IconComponent: MaterialIcons },
  { label: "Giới thiệu bạn bè", icon: "supervised-user-circle", IconComponent: MaterialIcons },
]

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 16,
  },
  memberCard: {
    backgroundColor: "#E6E8F2",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: "flex-start",

  },
  memberTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: 'justify',
  },
  katBalance: {
    fontSize: 16,
    color: "#555",
    marginVertical: 4,
    textAlign: 'justify',
  },
  memberName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginTop: 10,
    textAlign: 'justify',
    marginBottom: 20
  },
  accountSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0C2340",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    width: "45%",
    backgroundColor: "#F7F7F7",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1, // Thêm viền
    borderColor: "#0C2340", // Màu viền
    borderStyle: "dashed", // Kiểu viền gạch đứt
  },
  itemText: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
})

export default AccountScreen