import { ScalePressable } from "@/components/animated-pressable";
import type { AppColorScheme } from "@/constants/theme";
import type { SelectedFile } from "@/utils/archiver";
import { formatSize } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    LinearTransition,
} from "react-native-reanimated";

interface FileListSectionProps {
    files: SelectedFile[];
    isActive: boolean;
    colors: AppColorScheme;
    onActivate: () => void;
    onAddFiles: () => void;
    onAddMedia: () => void;
    onRemoveFile: (uri: string) => void;
    onClearAll: () => void;
    onNext: () => void;
}

export function FileListSection({
    files,
    isActive,
    colors,
    onActivate,
    onAddFiles,
    onAddMedia,
    onRemoveFile,
    onClearAll,
    onNext,
}: FileListSectionProps) {
    return (
        <Animated.View
            layout={LinearTransition.duration(200).easing(
                Easing.out(Easing.cubic),
            )}
            style={[
                styles.section,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                },
                isActive && { flex: 1 },
            ]}
        >
            <Pressable style={styles.sectionHeader} onPress={onActivate}>
                <Text
                    style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
                    1. select files
                </Text>
                <Ionicons
                    name={isActive ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.iconMuted}
                />
            </Pressable>

            {isActive && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={[styles.sectionBody, { flex: 1 }]}
                >
                    {/* file list header */}
                    {files.length > 0 && (
                        <View style={styles.fileListHeader}>
                            <Text
                                style={[
                                    styles.fileListCount,
                                    { color: colors.textMuted },
                                ]}
                            >
                                {files.length} file
                                {files.length !== 1 ? "s" : ""}
                            </Text>
                            <ScalePressable
                                style={[
                                    styles.clearAllBtn,
                                    {
                                        backgroundColor:
                                            colors.dangerBackground,
                                        borderColor: colors.dangerBorder,
                                    },
                                ]}
                                onPress={onClearAll}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={13}
                                    color={colors.danger}
                                />
                                <Text
                                    style={[
                                        styles.clearAllText,
                                        { color: colors.danger },
                                    ]}
                                >
                                    Remove All
                                </Text>
                            </ScalePressable>
                        </View>
                    )}

                    {/* file list */}
                    <ScrollView
                        style={[
                            styles.fileList,
                            {
                                backgroundColor: colors.surfaceInner,
                                borderColor: colors.surfaceInnerBorder,
                            },
                        ]}
                        contentContainerStyle={styles.fileListContent}
                    >
                        {files.length === 0 ? (
                            <Text
                                style={[
                                    styles.emptyText,
                                    { color: colors.textPlaceholder },
                                ]}
                            >
                                No files selected
                            </Text>
                        ) : (
                            files.map((file) => (
                                <Animated.View
                                    key={file.uri}
                                    entering={FadeIn.duration(180)}
                                    exiting={FadeOut.duration(150)}
                                    layout={LinearTransition.duration(180)}
                                    style={styles.fileRow}
                                >
                                    <Ionicons
                                        name="document-outline"
                                        size={15}
                                        color={colors.icon}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text
                                        style={[
                                            styles.fileName,
                                            {
                                                color: colors.textSecondary,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {file.name}
                                    </Text>
                                    {!!file.size && (
                                        <Text
                                            style={[
                                                styles.fileSize,
                                                {
                                                    color: colors.textMuted,
                                                },
                                            ]}
                                        >
                                            {formatSize(file.size)}
                                        </Text>
                                    )}
                                    <ScalePressable
                                        onPress={() => onRemoveFile(file.uri)}
                                        hitSlop={12}
                                        style={styles.removeBtn}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={colors.danger}
                                        />
                                    </ScalePressable>
                                </Animated.View>
                            ))
                        )}
                    </ScrollView>

                    {/* add buttons */}
                    <View style={styles.addRow}>
                        <ScalePressable
                            style={[
                                styles.addBtn,
                                {
                                    backgroundColor:
                                        colors.buttonSecondaryBackground,
                                    borderColor: colors.buttonSecondaryBorder,
                                },
                            ]}
                            onPress={onAddFiles}
                        >
                            <Ionicons
                                name="folder-open-outline"
                                size={15}
                                color={colors.iconLight}
                            />
                            <Text
                                style={[
                                    styles.addBtnText,
                                    { color: colors.iconLight },
                                ]}
                            >
                                Add Files
                            </Text>
                        </ScalePressable>
                        <ScalePressable
                            style={[
                                styles.addBtn,
                                {
                                    backgroundColor:
                                        colors.buttonSecondaryBackground,
                                    borderColor: colors.buttonSecondaryBorder,
                                },
                            ]}
                            onPress={onAddMedia}
                        >
                            <Ionicons
                                name="images-outline"
                                size={15}
                                color={colors.iconLight}
                            />
                            <Text
                                style={[
                                    styles.addBtnText,
                                    { color: colors.iconLight },
                                ]}
                            >
                                Add Media
                            </Text>
                        </ScalePressable>
                    </View>

                    {/* next step */}
                    <ScalePressable
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: colors.buttonBackground,
                                borderColor: colors.buttonBorder,
                            },
                            files.length === 0 && styles.actionBtnDisabled,
                        ]}
                        onPress={onNext}
                    >
                        <Text
                            style={[
                                styles.actionBtnText,
                                { color: colors.textPrimary },
                            ]}
                        >
                            Next step
                        </Text>
                    </ScalePressable>
                </Animated.View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    section: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    sectionBody: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        gap: 10,
    },
    fileListHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 2,
    },
    fileListCount: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },
    clearAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
    },
    clearAllText: {
        fontSize: 14,
        fontWeight: "600",
    },
    fileList: {
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
    },
    fileListContent: {
        padding: 10,
        gap: 6,
    },
    emptyText: {
        fontSize: 14,
        textAlign: "center",
        marginVertical: 16,
    },
    fileRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },
    fileName: {
        flex: 1,
        fontSize: 13,
    },
    fileSize: {
        fontSize: 11,
        marginLeft: 6,
        marginRight: 4,
    },
    removeBtn: {
        padding: 4,
        marginLeft: 6,
    },
    addRow: {
        flexDirection: "row",
        gap: 10,
    },
    addBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 8,
        borderWidth: 1,
        paddingVertical: 14,
    },
    addBtnText: {
        fontSize: 13,
        fontWeight: "500",
    },
    actionBtn: {
        borderRadius: 8,
        borderWidth: 1,
        paddingVertical: 18,
        alignItems: "center",
    },
    actionBtnDisabled: {
        opacity: 0.3,
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: "600",
    },
});
