import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, ActivityIndicator } from 'react-native';
import VerticalProductCard from './VerticalProductCard';
import { API_BASE_URL } from "../config/api";


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

interface SimilarProductsListProps {
    productId: string;
}

const SimilarProductsList: React.FC<SimilarProductsListProps> = ({ productId }) => {
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/product/get-similar-products/${productId}`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setSimilarProducts(data);
            } catch (error) {
                console.error('Error fetching similar products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSimilar();
    }, [productId]);

    if (loading) {
        return <ActivityIndicator size="small" color="#000" />;
    }

    if (similarProducts.length === 0) {
        return null; 
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SẢN PHẨM TƯƠNG TỰ</Text>
            <FlatList
                data={similarProducts}
                horizontal
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                    const animatedScale = new Animated.Value(0.9);
                    return <VerticalProductCard item={item} scale={animatedScale} />;
                }}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default SimilarProductsList

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    listContent: {
        paddingLeft: 4,
        paddingRight: 4,
    },
});