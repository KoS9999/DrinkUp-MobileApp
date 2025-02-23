import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<{ name: string }[]>([]); // Danh sách kết quả tìm kiếm

  const handleSearch = (text: string) => {
    setSearchText(text);
    // Gọi API hoặc xử lý tìm kiếm tại đây, sau đó cập nhật `setResults`
  };

  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}><MaterialIcons name="arrow-back" size={24} color="black" /></Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
          autoFocus={true} // Tự động focus khi mở màn hình
        />

        <TouchableOpacity onPress={() => handleSearch(searchText)}>
            <MaterialIcons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Hiển thị kết quả tìm kiếm */}
      <FlatList
        data={results}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.resultItem}>{item.name}</Text>}
        ListEmptyComponent={<Text style={styles.emptyMessage}>Không có kết quả</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: 1,
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    fontSize: 18,
    marginLeft: -10,
    paddingRight: 10
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  resultItem: {
    padding: 10,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#999",
  },
});

export default SearchScreen;
