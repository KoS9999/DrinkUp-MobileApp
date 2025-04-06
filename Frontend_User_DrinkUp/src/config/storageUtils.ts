// utils/storageUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIEWED_PRODUCTS_KEY = 'viewedProducts';

export const saveViewedProduct = async (product: any) => {
    try {
        const existing = await AsyncStorage.getItem(VIEWED_PRODUCTS_KEY);
        let products = existing ? JSON.parse(existing) : [];

        // Kiểm tra nếu đã có sản phẩm này thì không thêm nữa
        const isAlreadyViewed = products.some((p: any) => p._id === product._id);
        if (!isAlreadyViewed) {
            products.unshift(product); // Thêm vào đầu danh sách
            products = products.slice(0, 100); // Giới hạn 100 sản phẩm gần nhất
            await AsyncStorage.setItem(VIEWED_PRODUCTS_KEY, JSON.stringify(products));
        }
    } catch (error) {
        console.error('Failed to save viewed product', error);
    }
};

export const getViewedProducts = async (): Promise<any[]> => {
    try {
        const result = await AsyncStorage.getItem(VIEWED_PRODUCTS_KEY);
        return result ? JSON.parse(result) : [];
    } catch (error) {
        console.error('Failed to get viewed products', error);
        return [];
    }
};

export const clearViewedProducts = async () => {
    try {
        await AsyncStorage.removeItem('viewedProducts');
    } catch (error) {
        console.error('Failed to clear viewed products', error);
    }
};
