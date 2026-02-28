import { ScalePressable } from "@/components/animated-pressable";
import type { AppColorScheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

interface ValidationModalProps {
    visible: boolean;
    title: string;
    message: string;
    colors: AppColorScheme;
    onDismiss: () => void;
}

export function ValidationModal({
    visible,
    title,
    message,
    colors,
    onDismiss,
}: ValidationModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
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
                    <View style={styles.iconRow}>
                        <Ionicons
                            name="alert-circle"
                            size={40}
                            color={colors.warningIcon}
                        />
                    </View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        {title}
                    </Text>
                    <Text
                        style={[styles.message, { color: colors.textTertiary }]}
                    >
                        {message}
                    </Text>
                    <View style={styles.actions}>
                        <ScalePressable
                            style={[
                                styles.btn,
                                {
                                    backgroundColor: colors.cancelBackground,
                                    borderColor: colors.cancelBorder,
                                },
                            ]}
                            onPress={onDismiss}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    { color: colors.cancelText },
                                ]}
                            >
                                OK
                            </Text>
                        </ScalePressable>
                    </View>
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
        width: "100%",
        borderRadius: 14,
        borderWidth: 1,
        padding: 24,
        gap: 12,
    },
    iconRow: {
        alignItems: "center",
    },
    title: {
        fontSize: 17,
        fontWeight: "700",
        textAlign: "center",
    },
    message: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
    },
    actions: {
        marginTop: 4,
    },
    btn: {
        paddingVertical: 17,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
    },
    btnText: {
        fontSize: 15,
        fontWeight: "600",
    },
});
