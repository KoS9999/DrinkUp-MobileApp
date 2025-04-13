import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: number;
  color?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, size = 24, color = "#FFD700" }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Text style={{ fontSize: size, color: star <= rating ? color : "#ccc" }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
});

export default StarRating;
