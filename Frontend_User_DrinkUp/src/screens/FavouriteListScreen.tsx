import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import FavoriteStoresScreen from "./FavoriteStoresScreen";
import FavoriteProductsScreen from "./FavoriteProductsScreen";
import { Appbar } from "react-native-paper";
import { View } from "react-native";

const Tab = createMaterialTopTabNavigator();

const FavouriteListScreen = ({navigation}: any) => {
  return (
    <View style={{ flex: 1 }}> 
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate('AccountScreen')} />
        <Appbar.Content title="Danh sách yêu thích của bạn" />
      </Appbar.Header>
      
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
          tabBarStyle: { backgroundColor: "#fff" },
          tabBarIndicatorStyle: { backgroundColor: "#A67C52", height: 3 },
        }}
      >
        <Tab.Screen name="Cửa hàng yêu thích" component={FavoriteStoresScreen} />
        <Tab.Screen name="Sản phẩm yêu thích" component={FavoriteProductsScreen} />
      </Tab.Navigator>
    </View>
  );
};

export default FavouriteListScreen;
