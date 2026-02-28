import { ScalePressable } from "@/components/animated-pressable";
import type { AppColorScheme } from "@/constants/theme";
import { Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

export interface SuccessInfo {
    name: string;
    path: string;
    type: string;
    count: number;
}

interface SuccessModalProps {
    visible: boolean;
    info: SuccessInfo;
    colors: AppColorScheme;
    onDismiss: () => void;
}

export function SuccessModal({
    visible,
    info,
    colors,
    onDismiss,
}: SuccessModalProps) {
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
                            name="checkmark-circle"
                            size={40}
                            color={colors.successIcon}
                        />
                    </View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Archive created
                    </Text>
                    <Text
                        style={[
                            styles.fileName,
                            {
                                color: colors.textPrimary,
                                fontFamily: Fonts.mono,
                            },
                        ]}
                    >
                        {info.name}
                    </Text>
                    <View
                        style={[
                            styles.meta,
                            {
                                backgroundColor: colors.surfaceInner,
                                borderColor: colors.surfaceInnerBorder,
                            },
                        ]}
                    >
                        <View style={styles.row}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.textMuted },
                                ]}
                            >
                                Type
                            </Text>
                            <Text
                                style={[
                                    styles.value,
                                    { color: colors.metaValue },
                                ]}
                            >
                                {info.type}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.textMuted },
                                ]}
                            >
                                Saved to
                            </Text>
                            <Text
                                style={[
                                    styles.value,
                                    { color: colors.metaValue },
                                ]}
                                numberOfLines={2}
                            >
                                {info.path}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text
                                style={[
                                    styles.label,
                                    { color: colors.textMuted },
                                ]}
                            >
                                Files
                            </Text>
                            <Text
                                style={[
                                    styles.value,
                                    { color: colors.metaValue },
                                ]}
                            >
                                {info.count}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <ScalePressable
                            style={[
                                styles.btn,
                                {
                                    backgroundColor: colors.successBackground,
                                    borderColor: colors.successBorder,
                                },
                            ]}
                            onPress={onDismiss}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    { color: colors.successText },
                                ]}
                            >
                                Done
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
    fileName: {
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
    },
    meta: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        gap: 8,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        paddingTop: 1,
    },
    value: {
        fontSize: 13,
        flex: 1,
        textAlign: "right",
    },
    actions: {
        flexDirection: "column",
        gap: 8,
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
        fontWeight: "700",
    },
});
