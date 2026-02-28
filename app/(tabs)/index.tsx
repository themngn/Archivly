import { ScalePressable } from "@/components/animated-pressable";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const EASE = Easing.out(Easing.cubic);

interface HomeScreenProps {
    onGetStarted?: () => void;
}

export default function HomeScreen({ onGetStarted }: HomeScreenProps) {
    const titleOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(8);
    const taglineOpacity = useSharedValue(0);

    useEffect(() => {
        titleOpacity.value = withDelay(
            100,
            withTiming(1, { duration: 400, easing: EASE }),
        );
        buttonOpacity.value = withDelay(
            300,
            withTiming(1, { duration: 300, easing: EASE }),
        );
        buttonTranslateY.value = withDelay(
            300,
            withTiming(0, { duration: 300, easing: EASE }),
        );
        taglineOpacity.value = withDelay(
            500,
            withTiming(1, { duration: 300, easing: EASE }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
        transform: [{ translateY: buttonTranslateY.value }],
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
    }));

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: "#000" }]}>
            <ThemedView style={styles.container}>
                <Animated.View style={[styles.titleContainer, titleStyle]}>
                    <ThemedText
                        style={styles.mainTitle}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                    >
                        ARCHIVLY
                    </ThemedText>
                </Animated.View>

                <Animated.View style={[styles.buttonWrapper, buttonStyle]}>
                    <ScalePressable
                        style={styles.button}
                        onPress={onGetStarted}
                    >
                        <ThemedText
                            lightColor="#fff"
                            darkColor="#fff"
                            style={styles.buttonText}
                        >
                            Get Started
                        </ThemedText>
                    </ScalePressable>
                </Animated.View>

                <Animated.Text style={[styles.versionText, taglineStyle]}>
                    Create archives, beautifully.
                </Animated.Text>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 0,
        backgroundColor: "#000",
    },
    titleContainer: {
        width: "100%",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingBottom: 200,
    },
    mainTitle: {
        fontSize: 200,
        fontWeight: "900",
        lineHeight: 400,
        fontFamily: "System",
        width: "100%",
        textAlign: "center",
        letterSpacing: 2,
        color: "#888",
        transform: [{ scaleY: 9 }],
    },
    buttonWrapper: {
        position: "absolute",
        bottom: 70,
        left: 20,
        right: 20,
    },
    button: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        height: 82,
        justifyContent: "center",
    },
    buttonText: {
        fontSize: 24,
        fontWeight: "600",
        color: "#fff",
        textAlign: "center",
    },
    versionText: {
        position: "absolute",
        bottom: 40,
        color: "#333",
        fontSize: 13,
        letterSpacing: 0.5,
    },
});
