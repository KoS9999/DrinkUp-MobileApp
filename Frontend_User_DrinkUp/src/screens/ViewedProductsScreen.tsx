import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getViewedProducts, clearViewedProducts } from '../config/storageUtils';
import HorizontalProductCard from '../components/HorizontalProductCard';
import { Appbar } from "react-native-paper";

const ViewedProductsScreen = ({ navigation }: any) => {
  const [viewedProducts, setViewedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchViewed = async () => {
      const products = await getViewedProducts();
      setViewedProducts(products);
    };
    fetchViewed();
  }, []);

  const handleClearViewed = async () => {
    await clearViewedProducts();
    setViewedProducts([]);
  };

  //if (viewedProducts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate('AccountScreen')} />
        <Appbar.Content title="Đã xem gần đây" />
      </Appbar.Header>

      <View style={styles.clearButtonContainer}>
        <Text style={styles.clearText} onPress={handleClearViewed}>
          Xóa tất cả
        </Text>
      </View>

      {viewedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có sản phẩm nào đã xem.</Text>
        </View>
      ) : (
        <FlatList
          data={viewedProducts}
          keyExtractor={(item, index) => item._id + index}
          renderItem={({ item }) => <HorizontalProductCard product={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    marginBottom: 100
  },
  separator: {
    height: 10,
  },
  clearButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  clearText: {
    color: 'red',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
});

export default ViewedProductsScreen;
