import { Anton_400Regular, useFonts } from "@expo-google-fonts/anton";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import MainScreen from "./(tabs)/explore";
import HomeScreen from "./(tabs)/index";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [fontsLoaded] = useFonts({ Anton_400Regular });
    const [homeGone, setHomeGone] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const workflowAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const handleGetStarted = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -SCREEN_HEIGHT,
                duration: 600,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(workflowAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
        ]).start(() => setHomeGone(true));
    };

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                    <View style={styles.container}>
                        {/* Next screen slides up from the bottom */}
                        <Animated.View
                            style={[
                                StyleSheet.absoluteFill,
                                { transform: [{ translateY: workflowAnim }] },
                            ]}
                        >
                            <MainScreen />
                        </Animated.View>

                        {/* Landing screen slides up and away */}
                        <Animated.View
                            pointerEvents={homeGone ? "none" : "auto"}
                            style={[
                                StyleSheet.absoluteFill,
                                { transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <HomeScreen onGetStarted={handleGetStarted} />
                        </Animated.View>
                    </View>
                    <StatusBar style="light" />
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
});
