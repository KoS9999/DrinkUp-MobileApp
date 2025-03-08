import { View, Text, StyleSheet, FlatList, Animated, Image, Dimensions, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'
import { AntDesign } from '@expo/vector-icons'; 
import VerticalProductCard from './VerticalProductCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const CARD_MARGIN = width * 0.05;

// type Product = {
//     id: number;
//     name: string;
//     price: Record<string,number>;
//     size: string[];
//     imageUrl: string;
// };

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

type ProductCarouselProps = {
    products: Product[];
};

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
    const scrollX = useRef(new Animated.Value(0)).current;

    const renderItem = ({ item, index }: { item: Product; index: number }) => {
        const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_MARGIN),
            index * (CARD_WIDTH + CARD_MARGIN),
            (index + 1) * (CARD_WIDTH + CARD_MARGIN),
        ];
    
        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.7, 0.9, 0.7],
            extrapolate: 'clamp',
        });

        return <VerticalProductCard key={item._id} item={item} scale={scale} />
    };
    
    return (
        <View style={styles.carouselContainer}>
            <Animated.FlatList
                data={products}
                horizontal
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: CARD_MARGIN }}
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_MARGIN}
                decelerationRate="fast"
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    carouselContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
});

export default ProductCarousel;