import React, { useState, useEffect, useRef } from "react";
import {
  View, TextInput, Text, TouchableOpacity, FlatList, StyleSheet, BackHandler,
  Alert, Image, ActivityIndicator, Dimensions, ScrollView, Animated
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { API_BASE_URL } from "../config/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigators/AppNavigator";
import { useCart } from "../components/CartContext";

const { width } = Dimensions.get("window");
const INITIAL_CATEGORY_WIDTH = width * 0.2;
const COLLAPSED_CATEGORY_WIDTH = width * 0.05;
const CARD_WIDTH = (width - INITIAL_CATEGORY_WIDTH - 50) / 2;
const CARD_MARGIN = 10;//

type Cart = {
  id: string
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SearchScreen'>;

const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [orderBy, setOrderBy] = useState("asc");
  const [orderByPrice, setOrderByPrice] = useState("asc");
  const [orderByName, setOrderByName] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const categoryWidth = new Animated.Value(INITIAL_CATEGORY_WIDTH);
  const [cart, setCart] = useState([]);
  const { totalQuantity, totalAmount } = useCart();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [sortBy, orderBy, selectedCategory]);
  
    useEffect(() => {
      const backAction = () => {
        navigation.goBack();
        return true;
      };
  
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
  
      return () => backHandler.remove();
    }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/home/categories`);
      const data = await response.json();
      if (response.ok) {
        setCategories(data.data);
      } else {
        Alert.alert("Lỗi", "Không thể tải danh mục.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi khi tải danh mục.");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    let url = `${API_BASE_URL}/home/filter-sort?page=1&limit=10`;

    if (searchText) url += `&query=${searchText}`;
    if (selectedCategory) url += `&category=${selectedCategory}`;

    if (sortBy) {
      const currentOrder = sortBy === "price" ? orderByPrice : orderByName;
      url += `&sortBy=${sortBy}&order=${currentOrder}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setResults(data.data.products);
      } else {
        setResults([]);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi khi gọi API.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = () => {
    Animated.timing(categoryWidth, {
      toValue: isCollapsed ? INITIAL_CATEGORY_WIDTH : COLLAPSED_CATEGORY_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsCollapsed(!isCollapsed);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    fetchProducts();
  };

  const handleSortByPrice = () => {
    setSortBy("price");
    setOrderByPrice(orderByPrice === "asc" ? "desc" : "asc");
    fetchProducts();
  };

  const handleSortByName = () => {
    setSortBy("name");
    setOrderByName(orderByName === "asc" ? "desc" : "asc");
    fetchProducts();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ProductDetailScreen", { productId: item._id })}>

      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.priceText}>Size S: {item.price.S}đ</Text>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>

    </TouchableOpacity>
  );


  // const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  // const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearch}
            autoFocus={true}
          />

          {/* Nút X bên trong TextInput */}
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchText("");
                fetchProducts();
              }}>
              <MaterialIcons name="close" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => fetchProducts()}>
          <MaterialIcons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Danh mục bên trái với khả năng thu gọn */}
        <Animated.View style={[styles.categoryContainer, { width: categoryWidth }]}>
          {!isCollapsed && (
            <ScrollView>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryItem, selectedCategory === category.name && styles.selectedCategory]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Image source={{ uri: category.imageUrl }} style={[styles.categoryIcon, selectedCategory !== category.name && styles.inactiveIcon]} />
                  <Text style={[styles.categoryText, selectedCategory !== category.name && styles.inactiveText]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Sản phẩm */}
        <View style={styles.productContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity onPress={handleSortByPrice} style={styles.filterButton}>
              <Text style={styles.filterText}>Giá {sortBy === "price" ? (orderByPrice === "asc" ? "↑" : "↓") : ""}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSortByName} style={styles.filterButton}>
              <Text style={styles.filterText}>Tên {sortBy === "name" ? (orderByName === "asc" ? "A-Z" : "Z-A") : ""}</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              renderItem={renderItem}
              numColumns={2}
              contentContainerStyle={{ paddingHorizontal: CARD_MARGIN }}
            />
          )}
        </View>
      </View>

      <View style={styles.cartButtonContainer}>
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('CartScreen')}
      >
        <View style={{ position: 'relative' }}>
          <MaterialIcons name="shopping-cart" size={32} color="white" />

          {/* Badge hiển thị số lượng sản phẩm */}
          {totalQuantity > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalQuantity}</Text>
            </View>
          )}
        </View>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
          {totalAmount.toLocaleString()} đ
        </Text>
      </TouchableOpacity>
    </View>

    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingBottom: 40 },
  searchBar: { flexDirection: "row", alignItems: "center", marginBottom: 10, marginHorizontal: 20,},
  searchInputContainer: { flex: 1, position: "relative", },
  searchInput: { height: 40, borderWidth: 1, borderColor: "#ccc", borderRadius: 15, paddingHorizontal: 20, backgroundColor: "#fff", },
  clearButton: { position: "absolute", right: 5, top: "35%", transform: [{ translateY: -10 }], padding: 5 },

  contentContainer: { flexDirection: "row", flex: 1 },
  categoryContainer: { paddingVertical: 5, paddingHorizontal: 5, width: 300 },
  categoryItem: { paddingVertical: 5, paddingHorizontal: 8, alignItems: "center", marginBottom: 10 },
  selectedCategory: { backgroundColor: "#ddd", borderRadius: 5 },
  categoryText: { fontSize: 14, fontWeight: "bold", textAlign: "center" },

  inactiveIcon: {
    opacity: 0.3,
  },
  inactiveText: {
    color: "#bbb"
  },

  categoryIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },


  productContainer: { flex: 1, padding: 10 },
  filterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#ddd" },
  filterText: { fontSize: 12, fontWeight: "bold" },

  card: { width: CARD_WIDTH, margin: CARD_MARGIN / 2, backgroundColor: "#fff", borderRadius: 12, alignItems: "center", marginBottom: 15 },
  image: { width: "100%", height: 120, borderRadius: 12 },
  productName: { fontSize: 12, fontWeight: "bold", marginTop: 5, textAlign: "center" },
  priceText: { fontSize: 12, fontWeight: "bold", color: "#A2730C", marginTop: 2 },
  addButton: { backgroundColor: "#7EA172", borderRadius: 20, padding: 6, marginTop: 5 },

  toggleButton: { alignItems: "center", padding: 5 },

  cartButtonContainer: {
    position: "absolute",
    right: 10,
    bottom: 100,
    zIndex: 10,
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D537E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 30,
    alignContent: "center",
    alignSelf: "center"
  },
  cartText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  cartPrice: {
    color: "white",
    marginLeft: 10,
    fontWeight: "bold",
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: '#b08d64',  
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SearchScreen;
