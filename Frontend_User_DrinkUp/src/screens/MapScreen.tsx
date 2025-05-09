import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, BackHandler } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
import { RootStackParamList } from '../navigators/AppNavigator';

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MapScreen'>;
type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ShippingDetails {
  branch: {
    _id: string;
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number };
  };
  distance: number;
  duration: string;
  shippingFee: number;
  estimatedDeliveryTime: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyAtrDd6-7V4rQyHJiBiXg4Ntd-JqmQkGbo';

const MapScreen: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string>('');
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation<MapScreenNavigationProp>();
  const route = useRoute<MapScreenRouteProp>();

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigation]);

  const calculateShipping = async (address: string, lat: number, lng: number) => {
    setLoading(true);
    try {
      if (!lat || !lng) {
        throw new Error('Tọa độ không hợp lệ');
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const shippingResponse = await axios.post(
        `${API_BASE_URL}/order/calculate-shipping`,
        {
          deliveryAddress: address,
          lat,
          lng,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (shippingResponse.data.success) {
        setShippingDetails(shippingResponse.data);
        if (shippingResponse.data.distance > 100) {
          Toast.show({
            type: 'error',
            text1: 'Khoảng cách quá xa',
            text2: 'Chỉ hỗ trợ giao hàng trong vòng 100km. Vui lòng chọn địa chỉ khác.',
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Đã chọn địa điểm',
            text2: `Chi nhánh gần nhất: ${shippingResponse.data.branch.name}`,
          });
        }
      } else {
        throw new Error(shippingResponse.data.error || 'Không thể tính phí vận chuyển');
      }
    } catch (error: any) {
      console.error('Lỗi khi tính phí vận chuyển:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể tính phí vận chuyển',
      });
      setAddress('');
      setSelectedLocation(null);
      setShippingDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation && address && shippingDetails && shippingDetails.distance <= 100) {
      navigation.navigate('OrderScreen', {
        deliveryAddress: address,
        deliveryCoordinates: selectedLocation,
        shippingDetails,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Không thể xác nhận',
        text2:
          shippingDetails && shippingDetails.distance > 100
            ? 'Khoảng cách vượt quá 100km. Vui lòng chọn địa chỉ khác.'
            : 'Vui lòng chọn một địa điểm và đảm bảo phí vận chuyển được tính.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="Nhập địa chỉ giao hàng"
        onPress={(data, details = null) => {
          if (details) {
            const { lat, lng } = details.geometry.location;
            const formattedAddress = details.formatted_address;
            setAddress(formattedAddress);
            setSelectedLocation({ latitude: lat, longitude: lng });
            calculateShipping(formattedAddress, lat, lng);
          }
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'vi',
          components: 'country:vn',
        }}
        fetchDetails={true}
        styles={{
          container: { flex: 0, width: '100%', zIndex: 1 },
          textInput: styles.searchInput,
          listView: styles.suggestionList,
        }}
        enablePoweredByContainer={false}
      />
      <Text style={styles.noteText}>
        Lưu ý: Bạn có thể chọn địa chỉ gần nhà nếu không tìm thấy trên gợi ý
      </Text>
      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Địa chỉ giao hàng:</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#FF6347" style={styles.loading} />
        ) : (
          <Text style={address ? styles.addressText : styles.placeholderText}>
            {address || 'Chọn một địa điểm...'}
          </Text>
        )}
        {shippingDetails && !loading && (
          <View style={styles.shippingDetails}>
            <Text style={styles.shippingText}>
              Phí vận chuyển: {shippingDetails.shippingFee.toLocaleString()}đ
            </Text>
            <Text style={styles.shippingText}>
              Khoảng cách: {shippingDetails.distance.toFixed(2)} km
            </Text>
            <Text style={styles.shippingText}>
              Thời gian dự kiến: {shippingDetails.duration}
            </Text>
            <Text style={styles.shippingText}>
              Chi nhánh giao: {shippingDetails.branch.name}
            </Text>
            <Text style={styles.shippingText}>
              Địa chỉ chi nhánh: {shippingDetails.branch.address}
            </Text>
            {shippingDetails.distance > 100 && (
              <Text style={styles.warningText}>
                Khoảng cách vượt quá 100km. Vui lòng chọn địa chỉ gần hơn.
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              opacity:
                address && shippingDetails && !loading && shippingDetails.distance <= 100 ? 1 : 0.5,
            },
          ]}
          onPress={handleConfirm}
          disabled={!address || !shippingDetails || loading || shippingDetails.distance > 100}
        >
          <Text style={styles.confirmButtonText}>Xác nhận địa điểm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#F8F8F8',
  },
  searchInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  addressContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 12,
  },
  shippingDetails: {
    marginBottom: 16,
  },
  shippingText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF6347',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loading: {
    marginBottom: 12,
  },
});

export default MapScreen;