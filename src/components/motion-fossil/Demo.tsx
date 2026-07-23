import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { MotionFossil } from "./MotionFossil";

export default function MotionFossilDemo() {
  const navigation = useNavigation();

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <MotionFossil onBack={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
