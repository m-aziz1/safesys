import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" color={"#5dcb97"} size={30} />
          ),
          headerStyle: {
            backgroundColor: "#192729",
          },
          headerTintColor: "#5dcb97",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "USER",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" color={"#5dcb97"} size={24} />
          ),
          headerStyle: {
            backgroundColor: "#192729",
          },
          headerTintColor: "#5dcb97",
        }}
      />
    </Tabs>
  );
}
