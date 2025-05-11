import React from "react";
import AppNavigator from "./src/navigators/AppNavigator";
import Toast, { BaseToast, ErrorToast, ToastConfigParams } from "react-native-toast-message";
import SocketListener from "./src/components/SocketListener";
import 'react-native-get-random-values';
const toastConfig = {
  success: (props: ToastConfigParams<{ text1: string; text2?: string }>) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: "#4CAF50",
        backgroundColor: "#E8F5E9",
        width: '90%', 
        minHeight: 60, 
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 15,
        flex: 1, 
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#2E7D32",
        flexWrap: "wrap",
        width: "100%",
        flexShrink: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: "#1B5E20",
        flexWrap: "wrap",
        width: "100%",
        flexShrink: 1,
      }}
      text1NumberOfLines={0} 
      text2NumberOfLines={0}
    />
  ),
  error: (props: ToastConfigParams<{ text1: string; text2?: string }>) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: "#D32F2F", 
        backgroundColor: "#FFEBEE",
        width: '90%',
        minHeight: 60,
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 15,
        flex: 1,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#C62828",
        flexWrap: "wrap",
        width: "100%",
        flexShrink: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: "#B71C1C",
        flexWrap: "wrap",
        width: "100%",
        flexShrink: 1,
      }}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
    />
  ),
  info: (props: ToastConfigParams<{ text1: string; text2?: string }>) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: "#0288D1", 
        backgroundColor: "#E3F2FD",
        width: '90%',
        minHeight: 60,
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 15,
        flex: 1,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#01579B",
        flexWrap: "wrap",
        width: "100%",
        flexShrink: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: "#003C8F",
        flexWrap: "wrap",
        width: "100%",
        flexShrink: 1,
      }}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
    />
  ),
};

export default function App() {
  return (
    <>
      <AppNavigator />
      <SocketListener />
      <Toast config={toastConfig} visibilityTime={3000} />
    </>
  );
}
