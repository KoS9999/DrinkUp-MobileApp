import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { useFonts } from 'expo-font';
import { API_BASE_URL } from "../config/api";


interface Topping {
    name: string;
    price: number;
}

interface Product {
    _id: string;
    name: string;
    imageUrl: string;
    description: string;
    price: Record<string, number>; // Giá theo size (S, M, L)
    toppings: Topping[];
}

interface RouteParams {
    productId: string;
}
const ProductDetailScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { productId } = route.params as RouteParams;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(1);

    const [selectedSize, setSelectedSize] = useState("S");



    useEffect(() => {
        fetch(`${API_BASE_URL}/product/get-product/${productId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched data:", data);

                if (data?.success) {
                    setProduct(data.product);
                    console.log("Received productId:", productId);
                }
            })
            .catch((error) => console.error("Lỗi khi lấy chi tiết sản phẩm:", error))
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (!product) {
        return <Text>Lỗi: Không tìm thấy sản phẩm</Text>;
    }

    return (
        <ScrollView>
            <View style={styles.container}>
                <View style={styles.sectionHead}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
                        <AntDesign name="arrowleft" size={24} color="black" />
                    </TouchableOpacity>

                    <View style={styles.productImageContainer}>
                        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                    </View>

                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <AntDesign name="hearto" size={24} color="#DC5D5D" style={styles.favoriteIcon} />
                        <Text style={styles.descriptionInput}>{product.description}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Size</Text>
                    {["S", "M", "L"].map((size) => (
                        <TouchableOpacity key={size} style={styles.optionRow} onPress={() => setSelectedSize(size)}>
                           <AntDesign name="checkcircle" size={20} color={selectedSize === size ? "#0A1858" : "#737373"} />
                            <Text style={{ marginLeft: 10, color: selectedSize === size ? "#0A1858" : "#737373", fontWeight: selectedSize === size ? "bold" : "normal"}}>{size} - {product.price[size]} đ</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chọn mức đường</Text>
                    {["Ngọt bình thường", "Ít ngọt", "Không đường"].map((option, index) => (
                        <TouchableOpacity key={index} style={styles.optionRow}>
                            <AntDesign name="checkcircle" size={20} color={index === 0 ? "#000" : "#CCC"} />
                            <Text style={{ marginLeft: 10 }}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thêm topping</Text>
                    {product.toppings.map((topping, index) => (
                        <TouchableOpacity key={index} style={styles.toppingRow}>
                            <Text>{topping.name}</Text>
                            <Text>{topping.price} đ</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.quantityContainer}>
                    <Text>Số lượng</Text>
                    <View style={styles.quantityControl}>
                        <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                            <AntDesign name="minuscircleo" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                            <AntDesign name="pluscircleo" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.addToCartButton}>
                    <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    header: {
        position: "absolute",
        top: 40,
        left: 20,
        zIndex: 10,
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 8,
        borderRadius: 20,
    },
    productImageContainer: {
        height: 300,
        backgroundColor: "#D99",
        justifyContent: "center",
        alignItems: "center",
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    productInfo: {
        backgroundColor: "white",
        padding: 15,
    },
    productName: {
        fontSize: 25,
        fontWeight: "bold",
        textTransform: "capitalize",
        color: "#0A1858"
    },
    favoriteIcon: {
        position: "absolute",
        right: 10,
        top: 10,
        padding: 0
    },
    descriptionInput: {
        backgroundColor: "#FFF",
        fontSize: 12,
        color: "#737373",
        textAlign: "justify", // Căn đều hai bên cho đẹp
        lineHeight: 22, // Tăng khoảng cách dòng để dễ đọc
        width: "100%", // Chiều rộng full để không bị cắt chữ
        flexWrap: "wrap" // Đảm bảo chữ không bị tràn
    },
    sectionHead: {
        backgroundColor: "#FFF",
        marginBottom: 10,
    },
    section: {
        backgroundColor: "#FFF",
        padding: 10,
        marginBottom: 10,
    },
    sectionTitle: {
        fontWeight: "bold",
        fontSize: 16
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        color: "#737373"
    },
    toppingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 5,
    },
    quantityContainer: {
        backgroundColor: "#CCC",
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    quantityControl: {
        flexDirection: "row",
        alignItems: "center",
    },
    quantityText: {
        marginHorizontal: 10,
    },
    addToCartButton: {
        backgroundColor: "#6A9",
        padding: 15,
        alignItems: "center",
        marginTop: 10,
    },
    addToCartText: {
        color: "#FFF",
        fontWeight: "bold",
    },
});
