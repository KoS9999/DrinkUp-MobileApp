import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, FlatList, StyleSheet, Alert ,Image, ActivityIndicator, Dimensions  } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_BASE_URL } from "../config/api";


const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.3;  
const CARD_MARGIN = width * 0.1; 

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false); 

  const handleSearch = async (text: string) => {
    setSearchText(text);

    if (!text.trim()) {
      setResults([]); 
      return;
    }

    setLoading(true); 

    try {
      const response = await fetch(`${API_BASE_URL}/home/search-products?query=${text}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.data.products);
      } else {
        Alert.alert("Lỗi", "Không tìm thấy sản phẩm.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi khi gọi API.");
    } finally {
      setLoading(false); 
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <Text style={styles.productName}>{item.name}</Text>
  
        {/* Hiển thị giá theo size */}
        <View style={styles.sizeContainer}>
          {(item.size || []).map((size: string) => (  
            <View key={size} style={styles.sizeBox}>
              <Text style={styles.sizeText}>{size}</Text>
              <Text style={styles.priceText}>{item.price[size]}đ</Text>
            </View>
          ))}
        </View>
  
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
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
          autoFocus={true} 
        />
        <TouchableOpacity onPress={() => handleSearch(searchText)}>
          <MaterialIcons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Hiển thị kết quả tìm kiếm */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
        data={results}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()} 
        renderItem={renderItem} 
        horizontal={false} 
        numColumns={2} 
        contentContainerStyle={{ paddingHorizontal: CARD_MARGIN }}
      />

      )}
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
    paddingRight: 10,
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
  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN / 3,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
    marginBottom: 20,  
  },
  image: {
    width: "100%",
    height: 150,  
    borderRadius: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  sizeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  sizeBox: {
    alignItems: "center",
    marginHorizontal: 6,
  },
  sizeText: {
    fontSize: 12,
    color: "#555",
    marginHorizontal: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  priceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#A2730C",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#7EA172",
    borderRadius: 20,
    padding: 6,
    marginTop: 10,
  },
});


export default SearchScreen;
