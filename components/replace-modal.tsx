import { ScalePressable } from "@/components/animated-pressable";
import type { AppColorScheme } from "@/constants/theme";
import type { ArchiveType } from "@/utils/archiver";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

interface ReplaceModalProps {
    visible: boolean;
    archiveName: string;
    archiveType: ArchiveType;
    nextAvailableName: string;
    colors: AppColorScheme;
    onReplace: () => void;
    onRename: () => void;
    onCancel: () => void;
}

export function ReplaceModal({
    visible,
    archiveName,
    archiveType,
    nextAvailableName,
    colors,
    onReplace,
    onRename,
    onCancel,
}: ReplaceModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
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
                            name="warning-outline"
                            size={28}
                            color={colors.warningIcon}
                        />
                    </View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        File already exists
                    </Text>
                    <Text
                        style={[styles.message, { color: colors.textTertiary }]}
                    >
                        {`${archiveName.trim()}.${archiveType}`} already exists
                        in the destination.
                    </Text>
                    <View style={styles.actions}>
                        <ScalePressable
                            style={[
                                styles.btn,
                                {
                                    backgroundColor: colors.replaceBackground,
                                    borderColor: colors.replaceBorder,
                                },
                            ]}
                            onPress={onReplace}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    { color: colors.replaceText },
                                ]}
                            >
                                Replace
                            </Text>
                        </ScalePressable>
                        <ScalePressable
                            style={[
                                styles.btn,
                                {
                                    backgroundColor: colors.renameBackground,
                                    borderColor: colors.renameBorder,
                                },
                            ]}
                            onPress={onRename}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    { color: colors.renameText },
                                ]}
                            >
                                Create as {nextAvailableName}.{archiveType}
                            </Text>
                        </ScalePressable>
                        <ScalePressable
                            style={[
                                styles.btn,
                                {
                                    backgroundColor: colors.cancelBackground,
                                    borderColor: colors.cancelBorder,
                                },
                            ]}
                            onPress={onCancel}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    { color: colors.cancelText },
                                ]}
                            >
                                Cancel
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
        fontWeight: "600",
    },
});
