import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";

const CustomAlert = ({
  isVisible,
  title,
  message,
  onClose,
  type = "success",
}: {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "success" | "error";
}) => {
  return (
    <Modal isVisible={isVisible}>
      <View style={[styles.modalView, type === "success" ? styles.success : styles.error]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Đã hiểu</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  modalView: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
  },
  success: {
    borderColor: "#28a745",
    borderWidth: 2,
  },
  error: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#6F4E37",
  },
  message: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6F4E37",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
