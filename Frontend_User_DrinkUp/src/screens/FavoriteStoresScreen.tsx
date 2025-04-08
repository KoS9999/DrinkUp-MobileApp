import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const FavoriteStoresScreen = () => {
  return (
    <View style={styles.container}>
        <Text style={styles.emptyText}>Bạn chưa yêu thích cửa hàng nào</Text>
      <Image source={require('../assets/images/empty.png')} style={styles.image} />
      
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>THÊM CỬA HÀNG YÊU THÍCH</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: 200, height: 200, marginBottom: 10 },
  emptyText: { 
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#999",
    padding: 5,
    borderRadius: 5,
},
  button: { backgroundColor: "#A67C52", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default FavoriteStoresScreen;
