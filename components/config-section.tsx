import { ScalePressable } from "@/components/animated-pressable";
import type { AppColorScheme } from "@/constants/theme";
import { Fonts } from "@/constants/theme";
import type { ArchiveType } from "@/utils/archiver";
import { formatDestination } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    LinearTransition,
} from "react-native-reanimated";

const ARCHIVE_TYPES: ArchiveType[] = ["zip", "tar", "tar.gz"];

interface ConfigSectionProps {
    isActive: boolean;
    isLocked: boolean;
    destination: string;
    archiveType: ArchiveType;
    archiveName: string;
    isLoading: boolean;
    sliderItemWidth: number;
    sliderStyle: StyleProp<ViewStyle>;
    colors: AppColorScheme;
    onActivate: () => void;
    onToggleLayout: (width: number) => void;
    onPickDestination: () => void;
    onTypeChange: (type: ArchiveType) => void;
    onNameChange: (name: string) => void;
    onMakeArchive: () => void;
}

export function ConfigSection({
    isActive,
    isLocked,
    destination,
    archiveType,
    archiveName,
    isLoading,
    sliderItemWidth,
    sliderStyle,
    colors,
    onActivate,
    onToggleLayout,
    onPickDestination,
    onTypeChange,
    onNameChange,
    onMakeArchive,
}: ConfigSectionProps) {
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
                isLocked && styles.sectionLocked,
            ]}
        >
            <Pressable style={styles.sectionHeader} onPress={onActivate}>
                <Text
                    style={[
                        styles.sectionTitle,
                        { color: colors.textPrimary },
                        isLocked && { color: colors.sectionLockedText },
                    ]}
                >
                    2. destination select
                </Text>
                <Ionicons
                    name={isActive ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={
                        isLocked ? colors.sectionLockedText : colors.iconMuted
                    }
                />
            </Pressable>

            {isActive && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.sectionBody}
                >
                    {/* archive destination */}
                    <View style={styles.fieldGroup}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { color: colors.textMuted },
                            ]}
                        >
                            Archive Destination
                        </Text>
                        <ScalePressable
                            style={[
                                styles.destRow,
                                {
                                    backgroundColor: colors.surfaceInner,
                                    borderColor: colors.surfaceInnerBorder,
                                },
                            ]}
                            onPress={onPickDestination}
                        >
                            <Ionicons
                                name="folder-outline"
                                size={15}
                                color={colors.icon}
                                style={{ marginRight: 8 }}
                            />
                            <Text
                                style={[
                                    styles.destText,
                                    { color: colors.textTertiary },
                                    !destination && {
                                        color: colors.textMuted,
                                        fontStyle: "italic",
                                    },
                                ]}
                            >
                                {formatDestination(destination)}
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={14}
                                color={colors.textPlaceholder}
                            />
                        </ScalePressable>
                    </View>

                    {/* archive type */}
                    <View style={styles.fieldGroup}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { color: colors.textMuted },
                            ]}
                        >
                            Select Archive Type
                        </Text>
                        <View
                            style={[
                                styles.typeToggle,
                                {
                                    backgroundColor: colors.surfaceInner,
                                    borderColor: colors.surfaceInnerBorder,
                                },
                            ]}
                            onLayout={(e) =>
                                onToggleLayout(e.nativeEvent.layout.width)
                            }
                        >
                            <Animated.View
                                style={[
                                    styles.typeSlider,
                                    {
                                        width: sliderItemWidth,
                                        backgroundColor: colors.sliderThumb,
                                    },
                                    sliderStyle,
                                ]}
                            />
                            {ARCHIVE_TYPES.map((t) => (
                                <ScalePressable
                                    key={t}
                                    style={styles.typeBtn}
                                    onPress={() => onTypeChange(t)}
                                >
                                    <Text
                                        style={[
                                            styles.typeBtnText,
                                            {
                                                color: colors.textMuted,
                                                fontFamily: Fonts.mono,
                                            },
                                            archiveType === t && {
                                                color: colors.textPrimary,
                                            },
                                        ]}
                                    >
                                        .{t}
                                    </Text>
                                </ScalePressable>
                            ))}
                        </View>
                    </View>

                    {/* archive name */}
                    <View style={styles.fieldGroup}>
                        <Text
                            style={[
                                styles.fieldLabel,
                                { color: colors.textMuted },
                            ]}
                        >
                            Select Archive Name
                        </Text>
                        <View
                            style={[
                                styles.nameRow,
                                {
                                    backgroundColor: colors.surfaceInner,
                                    borderColor: colors.surfaceInnerBorder,
                                },
                            ]}
                        >
                            <TextInput
                                style={[
                                    styles.nameInput,
                                    {
                                        color: colors.textPrimary,
                                        fontFamily: Fonts.mono,
                                    },
                                ]}
                                value={archiveName}
                                onChangeText={onNameChange}
                                placeholder="archive-name"
                                placeholderTextColor={colors.textPlaceholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Text
                                style={[
                                    styles.nameExt,
                                    {
                                        color: colors.textMuted,
                                        fontFamily: Fonts.mono,
                                    },
                                ]}
                            >
                                .{archiveType}
                            </Text>
                        </View>
                    </View>

                    {/* make archive */}
                    <ScalePressable
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: colors.accentBackground,
                                borderColor: colors.accentBorder,
                            },
                            isLoading && styles.actionBtnDisabled,
                        ]}
                        onPress={onMakeArchive}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.textPrimary} />
                        ) : (
                            <Text
                                style={[
                                    styles.actionBtnText,
                                    { color: colors.textPrimary },
                                ]}
                            >
                                Make Archive
                            </Text>
                        )}
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
    sectionLocked: {
        opacity: 0.35,
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
    fieldGroup: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginLeft: 2,
    },
    destRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    destText: {
        flex: 1,
        fontSize: 13,
    },
    typeToggle: {
        flexDirection: "row",
        borderRadius: 8,
        borderWidth: 1,
        padding: 4,
        gap: 4,
    },
    typeSlider: {
        position: "absolute",
        top: 4,
        left: 4,
        bottom: 4,
        borderRadius: 6,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 13,
        alignItems: "center",
        borderRadius: 6,
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: "600",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        overflow: "hidden",
    },
    nameInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 11,
    },
    nameExt: {
        fontSize: 13,
        paddingLeft: 2,
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
