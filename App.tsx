import "./src/global.css";

import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LAB_ENTRIES } from "@/lab";
import LabHome from "@/screens/LabHome";

export type RootStackParamList = {
  home: undefined;
} & Record<string, undefined>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer
          theme={scheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          >
            <Stack.Screen name="home">
              {({ navigation }) => (
                <LabHome onOpen={(slug) => navigation.navigate(slug)} />
              )}
            </Stack.Screen>
            {LAB_ENTRIES.map((entry) => (
              <Stack.Screen
                key={entry.slug}
                name={entry.slug}
                component={entry.Demo}
              />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
