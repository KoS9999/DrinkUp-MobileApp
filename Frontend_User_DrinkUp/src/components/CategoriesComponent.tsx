import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'

const API_BASE_URL = "http://192.168.1.131:5000/api/home/categories";

interface Category {
    id: string;
    name: string;
    imageUrl: string;
}

// const categories = [
//     {
//         id: 1,
//         name: "Cà phê",
//         image: require("../assets/images/coffee-cate-icon.png"),
//     },
//     {
//         id: 2,
//         name: "Đá xay",
//         image: require("../assets/images/iceblended-cate-icon.png"),
//     },
//     {
//         id: 3,
//         name: "Bánh",
//         image: require("../assets/images/cake-cate-icon.png"),
//     },
//     {
//         id: 4,
//         name: "Trà",
//         image: require("../assets/images/tea-cate-icon.png"),
//     },
//     {
//         id: 5,
//         name: "Sinh tố",
//         image: require("../assets/images/smoothie-cate-icon.png"),
//     },
//     // Thêm các category khác nếu cần
// ];
const CategoriesComponent = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() =>{
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
          const response = await fetch(API_BASE_URL);
          const text = await response.text();
          // console.log("Raw API Response: ", text);
          
          const json = JSON.parse(text);
          setCategories(json.data);
        } catch (error) {
          console.error("Lỗi fetch categories: ", error);
        }
      };

    return (
        <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => {
                // Xử lý khi nhấn vào 1 category (điều hướng hoặc filter sản phẩm,...)
              }}
            >
              <Image 
                source={{uri: category.imageUrl}} 
                style={styles.categoryImage} />
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
}

export default CategoriesComponent

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        // Có thể thêm paddingHorizontal nếu muốn
    },
    scrollContainer: {
        paddingHorizontal: 8,
    },
    categoryItem: {
        alignItems: "center",
        marginHorizontal: 10,
    },
    categoryImage: {
        width: 60,
        height: 60,
        marginBottom: 5,
    },
    categoryText: {
        fontSize: 14,
        color: "#0A1858",
        fontWeight: "500",
    },
});