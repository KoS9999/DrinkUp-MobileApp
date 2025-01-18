import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigators/AppNavigator';

type OnBoardingScreenProps = NativeStackScreenProps<RootStackParamList, 'OnBoardingScreen'>;

const OnBoardingScreen: React.FC<OnBoardingScreenProps> = ({ navigation }) => {
  const swiperRef = useRef<Swiper>(null); // Tạo tham chiếu cho Swiper

  const slides = [
    {
      id: 1,
      image: require('../assets/images/coffee.png'),
      title: 'Energize Your Day',
      description: 'Fuel your day with your favorite drink',
    },
    {
      id: 2,
      image: require('../assets/images/sweet.png'),
      title: 'Sweet & Creamy Bliss',
      description: 'Experience the smooth harmony of sweetness and creaminess',
    },
    {
      id: 3,
      image: require('../assets/images/milk_tea.png'),
      title: 'Made with Love',
      description: 'We bring you delightful flavors, filled with care and passion',
    },
  ];

  return (
    <Swiper
      ref={swiperRef} // Gắn tham chiếu vào Swiper
      style={styles.wrapper}
      loop={false}
      activeDotColor="#A0522D"
      dotStyle={styles.dot}
      activeDotStyle={styles.activeDot}
    >
      {slides.map((slide, index) => (
        <View key={slide.id} style={styles.slide}>
          <Image source={slide.image} style={styles.image} />
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigation.replace('HomeScreen')}
            >
              <Text style={styles.buttonText}>Skip</Text>
            </TouchableOpacity>
            {index < slides.length - 1 ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => swiperRef.current?.scrollBy(1)} // Di chuyển tới slide tiếp theo
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => navigation.replace('HomeScreen')}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </Swiper>
  );
};

const styles = StyleSheet.create({
  wrapper: {},
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: '95%',
    height: '70%',
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  skipButton: {
    backgroundColor: '#7EA172',
    padding: 10,
    borderRadius: 20,
    width: '40%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: '#A0522D',
    padding: 10,
    borderRadius: 20,
    width: '40%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dot: {
    backgroundColor: '#d3d3d3',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#A0522D',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 3,
  },
});

export default OnBoardingScreen;
