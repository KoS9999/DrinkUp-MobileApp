import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/AppNavigator';
import { useNavigation } from '@react-navigation/native';

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
}

interface ProductCardProps {
    product: Product;
}

const HorizontalProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    return (
        <TouchableOpacity
            style={styles.productContainer}
            onPress={() => navigation.navigate('ProductDetailScreen', { productId: product._id })}
        >
            <View style={styles.imagePlaceholder}>
                {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.mockImage} />
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc}>{product.description}</Text>

                <View>
                    <Text style={styles.productPrice}>Size S: {product.price.S} đ</Text>
                    <Text style={styles.productPrice}>Size M: {product.price.M} đ</Text>
                    <Text style={styles.productPrice}>Size L: {product.price.L} đ</Text>
                </View>

                <TouchableOpacity style={styles.buyButton}>
                    <Text style={styles.buyButtonText}>Đặt mua</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.favButton}>
                <Text style={styles.heartIcon}>
                    <AntDesign name="hearto" size={24} color="#DC5D5D" />
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default HorizontalProductCard

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 10,
    },
    categoryContainer: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#6E3816',
        textTransform: 'uppercase'
    },
    productContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginVertical: 6,
        padding: 10,
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#ccc',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: 110,
        height: 130,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    mockImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#B7B7B7',
        borderRadius: 8,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    productDesc: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#6E3816',
        marginBottom: 6,
        flexDirection: 'column',

    },
    buyButton: {
        backgroundColor: '#6E3816',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
    },
    buyButtonText: {
        color: 'white',
        fontSize: 12,
    },
    favButton: {
        marginLeft: 8,
    },
    heartIcon: {
        fontSize: 18,
        color: '#DC5D5D',
    },

});