import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Thêm useFocusEffect
import { StackNavigationProp } from "@react-navigation/stack";
import HorizontalProductCard from "../components/HorizontalProductCard";
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

type Product = {
    _id: string;
    name: string;
    description?: string;
    price: {
        S: number;
        M: number;
        L: number;
    };
    category: string;
    imageUrl?: string;
    toppings: { _id: string; name: string; price: number }[];
    createdAt: string;
};

// Định nghĩa kiểu dữ liệu trả về từ API
type FavoriteProductResponse = {
    items: { productId: Product }[];
};

const getAuthToken = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
        console.error("Missing token");
    }
    console.log("Token:", token);
    return token;
};

const FavoriteProductsScreen = () => {
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<StackNavigationProp<any>>();

    // Dùng useCallback để tránh tạo lại hàm trong mỗi lần render
    const fetchFavoriteProducts = useCallback(async () => {
        console.log("🔄 fetchFavoriteProducts được gọi");
        try {
            setLoading(true);
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/favorite/favorite-products`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: FavoriteProductResponse = await response.json();
            console.log("Danh sách SPYT:", JSON.stringify(data, null, 2));

            const extractedProducts: Product[] = data.items
                .map((item) => item.productId)
                .filter(
                    (product): product is Product =>
                        product !== null &&
                        typeof product === "object" &&
                        typeof product._id === "string" &&
                        product._id.trim() !== ""
                )
            console.log("Danh sách SPYT sau lọc:", extractedProducts);
            setFavoriteProducts(extractedProducts);

        } catch (error) {
            // console.error("Lỗi khi lấy danh sách sản phẩm yêu thích: ", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Dùng useFocusEffect để gọi API mỗi khi trang được focus
    useFocusEffect(
        useCallback(() => {
            fetchFavoriteProducts();
        }, [fetchFavoriteProducts]) // Đưa fetchFavoriteProducts vào dependencies
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A67C52" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {favoriteProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Bạn chưa yêu thích sản phẩm nào</Text>
                    <Image source={require('../assets/images/empty.png')} style={styles.image} />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('SearchScreen')}  // Thêm dòng này để chuyển trang
                    >
                        <Text style={styles.buttonText}>THÊM SẢN PHẨM YÊU THÍCH</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={favoriteProducts}
                    keyExtractor={(item: Product) => item._id}
                    renderItem={({ item }: { item: Product }) => <HorizontalProductCard product={item} />}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        marginBottom: 100
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    listContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
    image: {
        width: 180,
        height: 180,
        marginBottom: 15,
    },
    emptyText: {
        fontSize: 18,
        color: "#555",
        marginBottom: 15,
        textAlign: "center",
        fontWeight: "500",
    },
    button: {
        backgroundColor: "#A67C52",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default FavoriteProductsScreen;
