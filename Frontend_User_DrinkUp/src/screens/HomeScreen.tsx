import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Animated } from 'react-native';
import Swiper from 'react-native-swiper';
import { RootStackParamList } from '../navigators/AppNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ProductCarousel from '../components/ProductCarousel';
import CategoriesComponent from '../components/CategoriesComponent';
import CategoryProductList from '../components/CategoryProductList';
import { API_BASE_URL } from "../config/api";



type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [greeting, setGreeting] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const swiperRef = useRef<Swiper>(null); // Tạo tham chiếu cho Swiper
  const [userName, setUserName] = useState('');
  const [topSellingProducts, setTopSellingProducts] = useState([]);

  const openSearchScreen = () => {
    navigation.navigate("SearchScreen"); // Điều hướng sang màn hình tìm kiếm
  };


  useEffect(() => {
    const fetchUserName = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      if(storedUserName){
        setUserName(storedUserName);
      }
    };
    fetchUserName();
  }, [])

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting());
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(loggedIn === 'true' && token !== null);
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/home/products/top-selling`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const jsonResponse = await response.json();
        console.log("Fetched top selling products:", JSON.stringify(jsonResponse, null, 2));

        if (jsonResponse.success && jsonResponse.data) {
          // Định nghĩa kiểu dữ liệu cho item
          const formattedProducts = jsonResponse.data.map((item: {
            _id: string;
            productDetails: {
              name: string;
              imageUrl: string;
              price: Record<string, number>;
            };
          }) => {
            const details = item.productDetails || {}; 
            const prices = details.price || {}; 

            return {
              id: item._id,  
              name: details.name || "Không có tên",
              imageUrl: details.imageUrl || "https://example.com/default.jpg", 
              size: Object.keys(prices).length > 0 ? Object.keys(prices) : ['S', 'M', 'L'], 
              price: prices, 
            };
          });

          setTopSellingProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      }
    };

    fetchTopSellingProducts();
}, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'CHÀO BUỔI SÁNG, DRINKUP-ER';
    if (hour >= 12 && hour < 18) return 'CHÀO BUỔI CHIỀU, DRINKUP-ER';
    if (hour >= 18 && hour < 22) return 'CHÀO BUỔI TỐI, DRINKUP-ER';
    return 'CHÚC NGỦ NGON, DRINKUP-ER';
  };

  const [fontsLoaded] = useFonts({
    "Oswald-Regular": require("../../assets/fonts/Oswald-Regular.ttf"),
    "Oswald-Medium": require("../../assets/fonts/Oswald-Medium.ttf"),
    "Pacifico-Regular": require("../../assets/fonts/Pacifico-Regular.ttf"),
  });

  const handleLogout = async () => {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('userToken');
    setIsLoggedIn(false);
  }

  const slides = [
    {
      id: 1,
      image: require('../assets/images/slide-1.png'),
    },
    {
      id: 2,
      image: require('../assets/images/slide-2.png'),
    },
    {
      id: 3,
      image: require('../assets/images/slide-3.png'),
    },
    {
      id: 4,
      image: require('../assets/images/slide-4.png'),
    },
    {
      id: 5,
      image: require('../assets/images/slide-5.png')
    },
    {
      id: 6,
      image: require('../assets/images/slide-7.png')
    },
    {
      id: 7,
      image: require('../assets/images/slide-6.png')
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  showsVerticalScrollIndicator={false}>
                  
        <Animated.View style={styles.headerBackground}>
          <Text style={styles.websiteName}>DrinkUp</Text>
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../assets/images/logo-drinkup-1.png')}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <View style={styles.authContainer}>
                <Text style={styles.role}>{isLoggedIn ? userName : 'Khách'}</Text>
                {/* Đăng ký / Đăng nhập */}
                {isLoggedIn ? (
                    <TouchableOpacity onPress={handleLogout} style={styles.authButton}>
                      <Text style={styles.authButtonText}>ĐĂNG XUẤT</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButton}>
                      <Text style={styles.authButtonText}>ĐĂNG NHẬP/ ĐĂNG KÝ</Text>
                    </TouchableOpacity>   
                )}
                <MaterialIcons name="notifications-on" size={24} color="#6E3816" style={{marginLeft: 0}} />
              </View> 

              <View>
              <TouchableOpacity onPress={openSearchScreen} activeOpacity={1}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm và lọc sản phẩm..."
                  placeholderTextColor="#999"
                  editable={false} 
                  //onChangeText={handleSearch} // Hàm xử lý khi nhập nội dung tìm kiếm
                />
              </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>

        {/* Đăng ký / Đăng nhập */}
        {/* {isLoggedIn ? (
          <TouchableOpacity onPress={handleLogout} style={styles.authButton}>
            <Text style={styles.authButtonText}>ĐĂNG XUẤT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.authButton}>
            <Text style={styles.authButtonText}>ĐĂNG NHẬP/ ĐĂNG KÝ</Text>
          </TouchableOpacity>   
        )} */}
        

        {/* Carousel */}
        <Swiper
          ref={swiperRef}
          style={styles.wrapper}
          loop={false}
          activeDotColor="#A0522D"
          dotStyle={styles.indicator}
          activeDotStyle={styles.activeIndicator}
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              <Image source={slide.image} style={styles.carouselImage} />
            </View>
          ))}
        </Swiper>

        {/* Giao hàng / Lấy tận nơi */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionItem}

          >
            {/* onPress={() => navigation.navigate('DeliveryScreen')} */}
            <Image
              source={require('../assets/images/delivery.png')}
              style={styles.optionImage}
            />
            <Text style={styles.optionText}>Giao hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}

          >
            {/* onPress={() => navigation.navigate('DeliveryScreen')} */}
            <Image
              source={require('../assets/images/pickup.png')}
              style={styles.optionImage}
            />
            <Text style={styles.optionText}>Lấy tận nơi</Text>
          </TouchableOpacity>

        </View>
        
        {/* Categories Horizontal List */}
        <CategoriesComponent/>

        {/* Hiển thị sản phẩm bán chạy với ProductCarousel */}
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
          <ProductCarousel products={topSellingProducts} />
        </View>

        {/* Hiển thị sản phẩm theo danh mục và sắp xếp GIÁ tăng dần */}
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>Món ngon phải thử</Text>
          <CategoryProductList/>
        </View>

        {/* Product Carousel */}
        {/* <ProductCarousel /> */}

      </ScrollView>
      {/* Footer Navigation */}
      
    </View>
  );
};

const styles = StyleSheet.create({
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120, // Chiều cao của phần cong
    backgroundColor: '#123456',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: "center", // Căn giữa theo chiều dọc
    alignItems: "center", // Căn giữa theo chiều ngang
  },
  websiteName: {
    fontFamily: "Pacifico-Regular",
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: 3, 
    textShadowColor: "rgba(255, 215, 0, 0.8)", // Màu tỏa sáng vàng
    textShadowOffset: { width: 0, height: 0 }, // Không dịch chuyển bóng
    textShadowRadius: 15, // Bán kính tỏa sáng
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  authContainer: {
    flexDirection: 'row',
    marginTop: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 130,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    backgroundColor: "#D9D9D9",
    borderRadius: 25,
    marginRight: 8,
    marginTop: -70
  },
  greeting: {
    //fontFamily: "Oswald-Regular",
    fontSize: 13,
    color: '#A2730C',
  },
  role: {
    //fontFamily: "Oswald-Regular",
    fontSize: 13,
    color: '#0A1858',
    marginTop: 5
  },
  authButton: {
    backgroundColor: '#7EA172',
    marginHorizontal: 10,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  authButtonText: {
    //fontFamily: "Oswald-Regular",
    fontSize: 12,
    color: '#FFFFFF',
    alignItems: 'center',
    alignContent: 'center',
  },
  searchInput: {
    marginTop: 12, 
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    alignItems:'center',
    alignContent: 'center',
    position: 'relative',
    marginLeft: -50
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: -450
  },
  optionItem: {
    alignItems: 'center',
  },
  optionImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#0A1858',
    fontWeight: 500
  },
  wrapper: {},
  slide: {
    //flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  carousel: {
    alignItems: 'center',
    marginBottom: 16,
  },
  carouselImage: {
    width: 350,
    height: 198.77,
    borderRadius: 12,
  },
  indicators: {
    flexDirection: 'row',
    marginTop: -900,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 4,
    marginTop: -900,

  },
  activeIndicator: {
    backgroundColor: '#6E3816',
    marginTop: -900,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#6E3816',
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  navTextInactive: {
    color: '#D7B6A5',
    fontSize: 12,
    marginTop: 4,
  },
  productSection: { 
    marginTop: 20, 
    paddingHorizontal: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 10
  },
  
});


export default HomeScreen