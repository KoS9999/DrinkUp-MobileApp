import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';


type Product = {
    id: string;
    name: string;
    size?: string;
    description: string;
    price: number;
    imageUrl?: string;
}

type CategoryData = {
    categoryName: string;
    products: Product[];
}

interface CategoryProductListProps {
    // có thể truyền vào từ ngoài (từ HomeScreen)
    // hoặc có thể mock cứng data.
    categoriesData?: CategoryData[];
}


const CategoryProductList: React.FC<CategoryProductListProps> = ({ categoriesData }) => {
    const mockData: CategoryData[] = [
        {
            categoryName: 'CÀ PHÊ',
            products: [
                { id: '1', name: 'Cà phê sữa', size: 'M', description: 'Mô tả...', price: 30000, imageUrl: 'https://file.hstatic.net/200000605565/file/03_luu_y_de_tranh_sai_lam_khi_chon_ly_thuy_tinh_uong_cafe-1_f4b48b3c19c34a22851b4aa3fbfa627a.jpeg' },
                { id: '2', name: 'Cà phê đen', size: 'M', description: 'Mô tả...', price: 25000, imageUrl: 'http://hcafe.vn/thumbs/540x540x1/upload/product/kin00954-2742.jpg' },
                { id: '3', name: 'Cà phê cốt dừa', size: 'M', description: 'Mô tả...', price: 35000, imageUrl: 'https://saycoffee24h.vn/wp-content/uploads/2024/06/cach_pha_cafe_cot_dua_a02823aec1e14b228e950be3e321a834-683x1024.jpg' },
                { id: '4', name: 'Cà phê sữa tươi', size: 'M', description: 'Mô tả...', price: 40000, imageUrl: 'https://caphenguyenchat.vn/wp-content/uploads/2023/11/ca-phe-sua-tuoi.jpg' },
                { id: '5', name: 'Cà phê kem trứng', size: 'M', description: 'Mô tả...', price: 50000, imageUrl: 'https://rapido.vn/wp-content/uploads/2024/02/Quan_cafe_cacao_trung_Vung_Tau_Palma_9.jpeg' },
                { id: '6', name: 'Bạc xĩu', size: 'M', description: 'Mô tả...', price: 50000, imageUrl: 'https://123coffee.vn/wp-content/uploads/2023/09/Bac-Xiu.png' },
            ],
        },

        {
            categoryName: 'ĐÁ XAY',
            products: [
                { id: '5', name: 'Matcha đá xay', size: 'M', description: 'Mô tả...', price: 30000, imageUrl: 'https://www.huongnghiepaau.com/wp-content/uploads/2016/10/cach-lam-matcha-da-xay.jpg' },
                { id: '6', name: 'Chocolate đá xay', size: 'M', description: 'Mô tả...', price: 25000, imageUrl: 'https://www.bartender.edu.vn/wp-content/uploads/2016/02/socola-da-xay.jpg' },
                { id: '7', name: 'Chocolate bạc hà đá xay', size: 'M', description: 'Mô tả...', price: 40000, imageUrl: 'https://thucphamplaza.com/wp-content/uploads/products_img/cong-thuc-pha-che-mint-choco-frappe.jpg' },
                { id: '8', name: 'Dâu đá xay', size: 'M', description: 'Mô tả...', price: 50000, imageUrl: 'https://baristaschool.vn/wp-content/uploads/2022/10/Strawberry-Frappe-e1665849907843.jpg' },
            ],
        },
    ];

    // Data cuối cùng sẽ dùng
    const dataToRender = categoriesData && categoriesData.length > 0 ? categoriesData : mockData;

    // Mỗi danh mục sẽ được quản lý "bao nhiêu sản phẩm hiển thị" qua một state
    // Dùng object: { "Cà phê": 3, "Đá xay": 3, ... }
    const initialShowCount: Record<string, number> = {};
    dataToRender.forEach((cate) => {
        initialShowCount[cate.categoryName] = 3;
    });

    const [showCountByCategory, setShowCountByCategory] = useState<Record<string, number>>(initialShowCount);

    //Hàm xử lý khi nhấn Xem thêm....
    const handleShowMore = (categoryName: string) => {
        setShowCountByCategory((prev) => ({
            ...prev,
            [categoryName]: prev[categoryName] + 3,
        }));
    }


    return (
        <View style={styles.container}>
            {dataToRender.map((category, index) => {
                //Sắp xếp sản phẩm theo giá tăng dần
                const sortedProducts = [...category.products].sort((a, b) => a.price - b.price);

                // Giới hạn sản phẩm hiển thị
                const showCount = showCountByCategory[category.categoryName];
                const displayedProducts = sortedProducts.slice(0, showCount);

                // Kiểm tra còn sản phẩm chưa hiển thị hay không
                const hasMore = showCount < sortedProducts.length;
                const remainCount = sortedProducts.length - showCount;

                return (
                    <View key={index} style={styles.categoryContainer}>
                        <Text style={styles.categoryTitle}>{category.categoryName}</Text>

                        {/* Danh sách sản phẩm */}
                        {displayedProducts.map((product) => (
                            <View key={product.id} style={styles.productContainer}>
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
                                    <Text style={styles.productPrice}>{product.price} đ</Text>
                                    {/* Button "Đặt mua" (demo) */}
                                    <TouchableOpacity style={styles.buyButton}>
                                        <Text style={styles.buyButtonText}>Đặt mua</Text>
                                    </TouchableOpacity>
                                </View>
                                {/* Icon "heart" (yêu thích) demo */}
                                <TouchableOpacity style={styles.favButton}>
                                    <Text style={styles.heartIcon}><AntDesign name="hearto" size={24} color="#DC5D5D" /></Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Nút "Xem thêm n sản phẩm [Tên danh mục]" */}
                        {hasMore && (
                            <TouchableOpacity
                                onPress={() => handleShowMore(category.categoryName)}
                                style={styles.loadMoreButton}
                            >
                                <Text style={styles.loadMoreText}>
                                    Xem thêm {remainCount} sản phẩm {category.categoryName}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            })};
        </View>
    );
};

export default CategoryProductList

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 10,
    },
    categoryContainer: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#6E3816',
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
        width: 100,
        height: 100,
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
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6E3816',
        marginBottom: 6,
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
    loadMoreButton: {
        marginTop: 6,
        alignSelf: 'flex-start',
        padding: 6,
    },
    loadMoreText: {
        color: '#A0522D',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});