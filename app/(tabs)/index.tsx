import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HomeScreenProps {
    onGetStarted?: () => void;
}

export default function HomeScreen({ onGetStarted }: HomeScreenProps) {
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: "#000" }]}>
            <ThemedView style={styles.container}>
                <ThemedView style={styles.titleContainer}>
                    <ThemedText
                        style={styles.mainTitle}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                    >
                        ARCHIVLY
                    </ThemedText>
                </ThemedView>
                <Pressable style={[styles.button]} onPress={onGetStarted}>
                    <ThemedText
                        lightColor="#fff"
                        darkColor="#fff"
                        style={styles.buttonText}
                    >
                        Get Started
                    </ThemedText>
                </Pressable>
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
    button: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        backgroundColor: "#111",
        height: 75,
        justifyContent: "center",
    },
    buttonText: {
        fontSize: 24,
        fontWeight: "600",
        //colors
        color: "#fff",
        //in the middle of the button
        textAlign: "center",
    },
});
