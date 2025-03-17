import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { useFonts } from 'expo-font';
import { API_BASE_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

interface Topping {
    _id: string;
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
    quantity: number;
}

interface RouteParams {
    productId: string;
}

const getAuthToken = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
        console.error("Missing token");
    }
    console.log("Token", token);
    return token;
}

const ProductDetailScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { productId } = route.params as RouteParams;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(product?.quantity ?? 1);

    const [selectedSize, setSelectedSize] = useState("S");
    const [selectedSweet, setSelectedSweet] = useState<string>("Ngọt bình thường");
    const [selectedIce, setSelectedIce] = useState<string>("Đá bình thường");

    // const [selectedTopping, setSelectedTopping] = useState<{ [key: number]: number }>({});
    const [selectedTopping, setSelectedTopping] = useState<{ id: string, name: string, quantity: number }[]>([]);

    const [totalPrice, setTotalPrice] = useState<number>(0);

    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 50;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    //Tính tổng giá tiền
    useEffect(() => {
        if (!product) return;

        const sizePrice = product.price[selectedSize] || 0;
        const toppingPrice = selectedTopping.reduce((sum, topping) => {
            const toppingData = product.toppings.find(t => t._id === topping.id)
            return sum + (toppingData ? toppingData.price * topping.quantity : 0);
        }, 0);

        setTotalPrice((sizePrice + toppingPrice) * quantity);
    }, [selectedSize, selectedTopping, quantity, product]);

    const handleToppingPress = (topping: { _id: string; name: string }) => {
        setSelectedTopping((prev) => {
            const existingTopping = prev.find(item => item.id === topping._id);

            if (existingTopping) {
                return prev.map(item =>
                    item.id === topping._id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            return [...prev, { id: topping._id, name: topping.name, quantity: 1 }];
        });
    };


    const handleToppingRemove = (topping: { _id: string }) => {
        setSelectedTopping((prev) => {
            return prev
                .map(item =>
                    item.id === topping._id ? { ...item, quantity: item.quantity - 1 } : item
                )
                .filter(item => item.quantity > 0) // Xóa nếu quantity = 0
        })
    }

    const handleAddToCart = async () => {
        console.log("selectedTopping:", selectedTopping);
        console.log("Type of selectedTopping:", typeof selectedTopping);
        console.log("Is array?", Array.isArray(selectedTopping));

        console.log("selectedIce:", selectedIce);
        console.log("selectedSweet:", selectedSweet);

        const validIceLevels = ["Không đá", "Ít đá", "Đá bình thường", "Đá riêng"];
        const validSweetLevels = ["Không ngọt", "Ít ngọt", "Ngọt bình thường", "Nhiều ngọt"];

        if (!validIceLevels.includes(selectedIce)) {
            Toast.show({
                type: "info",
                text1: "Thông báo",
                text2: "Vui lòng chọn mức đá ❄️",
                visibilityTime: 4000,
            });
            return;
        }
        
        if (!validSweetLevels.includes(selectedSweet)) {
            Toast.show({
                type: "info",
                text1: "Thông báo",
                text2: "Vui lòng chọn mức đường 🍬",
                visibilityTime: 4000,
            });
            return; 
        }

        try {
            const token = await getAuthToken();

            const response = await fetch(`${API_BASE_URL}/cart/add`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product?._id,
                    quantity: quantity,
                    size: selectedSize,
                    iceLevel: selectedIce,
                    sweetLevel: selectedSweet,
                    toppings: Array.isArray(selectedTopping)
                        ? selectedTopping.map(topping => ({
                            toppingId: topping.id,
                            quantity: topping.quantity ?? 1
                        }))
                        : Object.entries(selectedTopping).map(([toppingId, quantity]) => ({
                            toppingId,
                            quantity
                        })),
                }),
            });

            if (!response.ok) {
                Toast.show({
                    type: "error",
                    text1: "Lỗi",
                    text2: "Không thể thêm sản phẩm vào giỏ hàng",
                    visibilityTime: 4000,
                });
                throw new Error(`Lỗi API: ${response.status}`);
            }
            else {
                console.log("🚀 Gửi API với dữ liệu:", response);
                const data = await response.json();
                //alert("Thêm vào giỏ hàng thành công!");
                Toast.show({
                    type: "success",
                    text1: "Thông báo",
                    text2: "Thêm vào giỏ hàng thành công!",
                    position: "top",
                    visibilityTime: 4000,
                });
                console.log("✅ Response:", data);
            }

        } catch (error) {
            //console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
            //alert("Thêm vào giỏ hàng thất bại!");
        }
    }

    useEffect(() => {
        fetch(`${API_BASE_URL}/product/get-product/${productId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched data:", data);
                console.log("ID san pham: ", data.product._id);

                if (data?.success) {
                    setProduct(data.product);
                    setSelectedSweet(data.sweetLevels);
                    setSelectedIce(data.iceLevels);
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

        <View style={styles.container}>
            <ScrollView>
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
                        <Text style={styles.descriptionInput}>
                            {isExpanded || product.description.length <= maxLength
                                ? product.description
                                : `${product.description.slice(0, maxLength)}... `}

                            {product.description.length > maxLength && (
                                <TouchableOpacity onPress={toggleExpand}>
                                    <Text style={styles.expandText}>
                                        {isExpanded ? "Thu gọn" : "Xem thêm"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Size</Text>
                    {["S", "M", "L"].map((size) => (
                        <TouchableOpacity key={size} style={styles.optionRow} onPress={() => setSelectedSize(size)}>
                            <AntDesign name="checkcircle" size={20} color={selectedSize === size ? "#0A1858" : "#737373"} />
                            <Text style={{ marginLeft: 10, color: selectedSize === size ? "#0A1858" : "#737373", fontWeight: selectedSize === size ? "bold" : "normal" }}>
                                {size}
                            </Text>
                            <Text style={{ color: selectedSize === size ? "#0A1858" : "#737373", fontWeight: selectedSize === size ? "bold" : "normal", marginLeft: "auto" }}>
                                {product.price[size]} đ
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chọn mức đường</Text>
                    {['Không ngọt', 'Ít ngọt', 'Ngọt bình thường', 'Nhiều ngọt'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.optionRow}
                            onPress={() => setSelectedSweet(option)}
                        >
                            <AntDesign
                                name="checkcircle"
                                size={20}
                                color={selectedSweet === option ? "#0A1858" : "#737373"}
                            />
                            <Text
                                style={{
                                    marginLeft: 10,
                                    color: selectedSweet === option ? "#0A1858" : "#737373",
                                    fontWeight: selectedSweet === option ? "bold" : "normal",
                                }}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chọn mức đá</Text>
                    {['Không đá', 'Ít đá', 'Đá bình thường', 'Đá riêng'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.optionRow}
                            onPress={() => setSelectedIce(option)}
                        >
                            <AntDesign
                                name="checkcircle"
                                size={20}
                                color={selectedIce === option ? "#0A1858" : "#737373"}
                            />
                            <Text
                                style={{
                                    marginLeft: 10,
                                    color: selectedIce === option ? "#0A1858" : "#737373",
                                    fontWeight: selectedIce === option ? "bold" : "normal",
                                }}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thêm topping</Text>
                    {product.toppings.map((topping) => {
                        const existingTopping = selectedTopping.find(item => item.id === topping._id);
                        const quantity = existingTopping ? existingTopping.quantity : 0;

                        return (
                            <TouchableOpacity key={topping._id} style={styles.toppingRow}>
                                <View style={styles.iconContainer}>
                                    {quantity > 0 ? (
                                        <>
                                            <TouchableOpacity onPress={() => handleToppingRemove(topping)}>
                                                <AntDesign name="minus" size={18} color="#0A1858" />
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{quantity}</Text>
                                        </>
                                    ) : null}
                                    <TouchableOpacity onPress={() => handleToppingPress(topping)}>
                                        <AntDesign name="plus" size={18} color="#0A1858" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={{
                                    marginLeft: 10,
                                    color: quantity > 0 ? "#0A1858" : "#737373",
                                    fontWeight: quantity > 0 ? "bold" : "normal"
                                }}>
                                    {topping.name}
                                </Text>

                                <Text style={{
                                    marginLeft: "auto",
                                    color: quantity > 0 ? "#0A1858" : "#737373",
                                    fontWeight: quantity > 0 ? "bold" : "normal"
                                }}>
                                    {topping.price} đ
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                </View>
            </ScrollView>

            <View style={styles.quantityContainer}>
                <View style={{ flexDirection: "column" }}>
                    <Text style={{ color: '#0A1858' }}> {quantity} sản phẩm</Text>
                    <Text style={{ paddingLeft: 5, marginTop: 5, color: '#0A1858', fontSize: 20, fontWeight: "600" }}>{totalPrice.toLocaleString('vi-VN')} đ</Text>
                </View>
                {/* <View style = {{flexDirection: "column"}}>
                    <Text style = {{marginBottom: 10}}>Số lượng</Text>
                    <Text>Thành tiền</Text>
                </View> */}
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

            <View style={styles.quantityContainer}>
                <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                    <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
                </TouchableOpacity>
            </View>
        </View>

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
        textAlign: "justify",
        lineHeight: 22,
        width: "100%",
        flexWrap: "wrap"
    },
    sectionHead: {
        backgroundColor: "#FFF",
        marginBottom: 10,
    },
    section: {
        backgroundColor: "#FFF",
        padding: 10,
        marginBottom: 10,
        height: "auto"
    },
    sectionTitle: {
        fontWeight: "bold",
        fontSize: 16
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        color: "#737373",
        marginLeft: 10
    },
    toppingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        color: "#737373",
        marginLeft: 10,
    },
    plusIcon: {
        width: 24,
        height: 24,
        borderRadius: 12, // Làm viền tròn
        borderWidth: 1,
        borderColor: "#0A1858",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    iconContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: "#F5F5F5"
    },
    quantityContainer: {
        backgroundColor: "#E6EFE6",
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
        backgroundColor: "#7EA172",
        padding: 15,
        alignItems: "center",
        marginTop: 10,
        borderRadius: 10,
        width: 320,
        alignSelf: "center",
        alignContent: "center",
        marginLeft: "auto",
        marginRight: "auto"
    },
    addToCartText: {
        color: "#FFF",
        fontWeight: "bold",
    },
    expandText: {
        color: '#007bff',
        textDecorationLine: 'underline',
    }
});
