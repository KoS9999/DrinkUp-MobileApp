import { View, Text, StyleSheet, FlatList, Animated, Image, Dimensions, ScrollView, Touchable, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'
import { AntDesign } from '@expo/vector-icons'; // Import thư viện icon


const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const CARD_MARGIN = width * 0.05;

const products = [
    { id: 1, name: 'Bơ già dừa non', price: '69,000đ', size: ['S', 'M', 'L'], image: require('../assets/images/bogia_duanon.png') },
    { id: 2, name: 'Huyền châu đường mật', price: '54,000đ',  size: ['S', 'M', 'L'], image: require('../assets/images/huyenchau_duongmat.png') },
    { id: 3, name: 'Hi bi sơ ri', price: '60,000đ',  size: ['S', 'M', 'L'], image: require('../assets/images/hibi_sori.png') },
    { id: 4, name: 'Trà sữa chôm chôm', price: '55,000đ',  size: ['S', 'M', 'L'], image: require('../assets/images/trasua_chomchom.png') },
    { id: 5, name: 'Trà nhãn sen', price: '50,000đ',  size: ['S', 'M', 'L'], image: require('../assets/images/tra_nhansen.png') },
    { id: 6, name: 'Cà phê sữa kem silky', price: '55,000đ',  size: ['S', 'M', 'L'], image: require('../assets/images/caphe_suakem.png') },
]

const ProductCarousel = () => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const [favorites, setFavorites] = useState<number[]>([]);

    const toggleFavorite = (id: number) => {
        if (favorites.includes(id)) {
            setFavorites(favorites.filter((fav) => fav !== id));
        } else {
            setFavorites([...favorites, id]);
        }
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {
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

        return (
            <Animated.View
                style={[
                    styles.card,
                    {
                        transform: [{ scale }],
                    },
                ]}>
                <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} />
                </View>    
                <Text style={styles.productName}>{item.name}</Text>
                <View style={styles.sizeContainer}>
                    {item.size.map((size: string) => (
                        <Text key={size} style={styles.sizeText}>{size}</Text>
                    ))}
                </View>
                <View style={styles.bottomRow}>
                    <Text style={styles.productPrice}>{item.price}</Text>
                    <View style={styles.iconRow}>
                        <TouchableOpacity
                            style={styles.favoriteIcon}
                            onPress={() => toggleFavorite(item.id)}>
                            <AntDesign
                                name={favorites.includes(item.id) ? 'heart' : 'hearto'}
                                size={20}
                                color={favorites.includes(item.id) ? 'red' : 'gray'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton}>
                            <AntDesign name="plus" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.carouselContainer}>
            <Animated.FlatList
                data={products}
                horizontal
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: CARD_MARGIN }}
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_MARGIN}
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
    card: {
        width: CARD_WIDTH,
        marginHorizontal: CARD_MARGIN / 3,
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
        borderWidth: 0.7, // Thêm độ dày viền
        borderColor: 'gray',
        padding: 5,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    sizeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 8,
    },
    sizeText: {
        fontSize: 12,
        color: '#555',
        marginHorizontal: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        marginRight: 10
    },
});

export default ProductCarousel