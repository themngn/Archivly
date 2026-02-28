import type { AppColorScheme } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface LoadingModalProps {
    visible: boolean;
    colors: AppColorScheme;
}

export function LoadingModal({ visible, colors }: LoadingModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
        >
            <View
                style={[
                    styles.overlay,
                    { backgroundColor: colors.modalOverlay },
                ]}
            >
                <View
                    style={[
                        styles.box,
                        {
                            backgroundColor: colors.modalBackground,
                            borderColor: colors.modalBorder,
                        },
                    ]}
                >
                    <ActivityIndicator
                        size="large"
                        color={colors.textSecondary}
                    />
                    <Text
                        style={[styles.label, { color: colors.textSecondary }]}
                    >
                        Creating archive…
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    box: {
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 32,
        paddingHorizontal: 48,
        alignItems: "center",
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
    },
});
