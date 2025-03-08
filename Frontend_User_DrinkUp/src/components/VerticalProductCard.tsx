import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { RootStackParamList } from '../navigators/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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

interface VerticalProductCardProps {
    item: Product;
    scale: Animated.AnimatedInterpolation<string | string>;
}

const VerticalProductCard: React.FC<VerticalProductCardProps> = ({ item, scale }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [favorites, setFavorites] = useState<string[]>([]);


    const toggleFavorite = (id: string) => {
        if (favorites.includes(id)) {
            setFavorites(favorites.filter((fav) => fav !== id));
        } else {
            setFavorites([...favorites, id]);
        }
    };

    return (
        <TouchableOpacity
            onPress={() => {
                if (item?._id) {
                    navigation.navigate('ProductDetailScreen', { productId: item._id });
                } else {
                    console.warn("Invalid product data:", item);
                }
            }}
        >
            <Animated.View
                style={[
                    styles.card,
                    {
                        transform: [{ scale }],
                    },
                ]}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                </View>
                <Text style={styles.productName}>{item.name}</Text>

                {/* Hiển thị giá theo size */}
                <View style={styles.sizeContainer}>
                    <View style={styles.sizeBox}>
                        <View style={styles.sizeItem}>
                            <Text style={styles.sizeText}>S</Text>
                            <Text style={styles.priceText}>{item.price.S}đ</Text>
                        </View>

                        <View style={styles.sizeItem}>
                            <Text style={styles.sizeText}>M</Text>
                            <Text style={styles.priceText}>{item.price.M}đ</Text>
                        </View>

                        <View style={styles.sizeItem}>
                            <Text style={styles.sizeText}>L</Text>
                            <Text style={styles.priceText}>{item.price.L}đ</Text>
                        </View>
                    </View>
                </View>


                <View style={styles.bottomRow}>
                    <View style={styles.iconRow}>
                        <TouchableOpacity style={styles.favoriteIcon} onPress={() => toggleFavorite(item._id)}>
                            <AntDesign name={favorites.includes(item._id) ? 'heart' : 'hearto'} size={20} color={favorites.includes(item._id) ? 'red' : 'gray'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton}>
                            <AntDesign name="plus" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    )
}

export default VerticalProductCard

const styles = StyleSheet.create({
    card: {
        width: 240,
        marginHorizontal: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    favoriteIcon: {
        marginRight: 10,
        borderRadius: 20,
        borderWidth: 0.7,
        borderColor: 'gray',
        padding: 5,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 14,
        color: '#A2730C',
        marginLeft: 10
    },
    addButton: {
        backgroundColor: '#7EA172',
        borderRadius: 20,
        padding: 6,
        marginRight: 10,
        alignItems: 'flex-end'
    },
    sizeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 8,
    },

    sizeBox: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
    },
    sizeItem: {
        flexDirection: 'column',
        alignItems: 'center',
        marginHorizontal: 6,
    },
    sizeText: {
        fontSize: 12,
        color: '#555',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        marginBottom: 5,
    },
    priceText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#A2730C',
    },

});