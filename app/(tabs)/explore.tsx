import { ScalePressable } from "@/components/animated-pressable";
import {
    ArchiveType,
    SelectedFile,
    checkArchiveExists,
    createArchive,
    findAvailableName,
} from "@/utils/archiver";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import {
    StorageAccessFramework,
    documentDirectory,
} from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
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
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const ARCHIVE_TYPES: ArchiveType[] = ["zip", "tar", "tar.gz"];

export default function MainScreen() {
    const [activeStep, setActiveStep] = useState<1 | 2>(1);
    const [files, setFiles] = useState<SelectedFile[]>([]);
    const [archiveType, setArchiveType] = useState<ArchiveType>("zip");
    const [toggleWidth, setToggleWidth] = useState(0);
    const [sliderItemWidth, setSliderItemWidth] = useState(0);
    const sliderX = useSharedValue(0);
    const [archiveName, setArchiveName] = useState("");
    const [destination, setDestination] = useState(documentDirectory ?? "");
    const [isLoading, setIsLoading] = useState(false);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [nextAvailableName, setNextAvailableName] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successInfo, setSuccessInfo] = useState({
        name: "",
        path: "",
        type: "",
        count: 0,
    });

    // ─── slider animation ──────────────────────────────────────────────────────
    useEffect(() => {
        if (toggleWidth === 0) return;
        const innerWidth = toggleWidth - 8; // subtract left+right padding (4+4)
        const itemW = (innerWidth - 8) / 3; // subtract 2 gaps of 4
        setSliderItemWidth(itemW);
        const idx = ARCHIVE_TYPES.indexOf(archiveType);
        sliderX.value = withTiming(idx * (itemW + 4), {
            duration: 200,
            easing: Easing.out(Easing.cubic),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [archiveType, toggleWidth]);

    const sliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: sliderX.value }],
    }));

    // ─── file helpers ────────────────────────────────────────────────────────

    const normalizeUri = (uri: string): string => {
        // Remove trailing slashes and normalize the URI for comparison
        return uri.replace(/\/$/, "").toLowerCase();
    };

    const isDuplicate = (
        newFile: SelectedFile,
        existingFile: SelectedFile,
    ): boolean => {
        // Check by URI first (most reliable)
        if (normalizeUri(newFile.uri) === normalizeUri(existingFile.uri)) {
            return true;
        }
        // Also check by name and size to catch duplicates with different URIs
        if (
            newFile.name.toLowerCase() === existingFile.name.toLowerCase() &&
            newFile.size &&
            existingFile.size &&
            newFile.size === existingFile.size
        ) {
            return true;
        }
        return false;
    };

    const addFiles = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                multiple: true,
                copyToCacheDirectory: false,
            });
            if (result.canceled) return;
            const incoming: SelectedFile[] = result.assets.map((a) => ({
                name: a.name,
                uri: a.uri,
                size: a.size ?? undefined,
            }));
            const uniqueFiles = incoming.filter(
                (f) => !files.some((p) => isDuplicate(f, p)),
            );
            const duplicateCount = incoming.length - uniqueFiles.length;
            if (duplicateCount > 0) {
                Alert.alert(
                    "Duplicate files",
                    `${duplicateCount} file(s) were already added and were skipped.`,
                );
            }
            setFiles((prev) => [...prev, ...uniqueFiles]);
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? String(e));
        }
    };

    const addMedia = async () => {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission needed",
                    "Grant photo library access to add media.",
                );
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsMultipleSelection: true,
                mediaTypes: ["images", "videos"],
            });
            if (result.canceled) return;
            const incoming: SelectedFile[] = result.assets.map((a) => ({
                name: a.fileName ?? a.uri.split("/").pop() ?? "media",
                uri: a.uri,
                size: a.fileSize ?? undefined,
            }));
            const uniqueFiles = incoming.filter(
                (f) => !files.some((p) => isDuplicate(f, p)),
            );
            const duplicateCount = incoming.length - uniqueFiles.length;
            if (duplicateCount > 0) {
                Alert.alert(
                    "Duplicate files",
                    `${duplicateCount} file(s) were already added and were skipped.`,
                );
            }
            setFiles((prev) => [...prev, ...uniqueFiles]);
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? String(e));
        }
    };

    const removeFile = (uri: string) =>
        setFiles((prev) => prev.filter((f) => f.uri !== uri));

    const pickDestination = async () => {
        if (Platform.OS === "android") {
            const result =
                await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!result.granted) return;
            setDestination(result.directoryUri);
        } else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: "public.folder",
                    copyToCacheDirectory: false,
                });
                if (result.canceled) return;
                const asset = result.assets[0];
                setDestination(asset.uri);
            } catch {
                Alert.alert(
                    "Destination",
                    "On iOS archives are saved to the App Documents folder.",
                );
            }
        }
    };

    const makeArchive = async () => {
        if (!archiveName.trim()) {
            Alert.alert("Missing name", "Please enter a name for the archive.");
            return;
        }
        if (files.length === 0) {
            Alert.alert("No files", "Please add at least one file.");
            return;
        }

        const exists = await checkArchiveExists(
            archiveName,
            archiveType,
            destination,
        );
        if (exists) {
            const avail = await findAvailableName(
                archiveName,
                archiveType,
                destination,
            );
            setNextAvailableName(avail);
            setShowReplaceModal(true);
            return;
        }
        await doCreateArchive();
    };

    const doCreateArchive = async (nameOverride?: string, replace = false) => {
        setIsLoading(true);
        try {
            const savedUri = await createArchive(
                files,
                archiveType,
                nameOverride ?? archiveName,
                destination,
                replace,
            );
            const displayPath = formatDestination(savedUri);
            const usedName = nameOverride ?? archiveName.trim();
            setSuccessInfo({
                name: `${usedName}.${archiveType}`,
                path: displayPath,
                type: archiveType.toUpperCase(),
                count: files.length,
            });
            setShowSuccessModal(true);
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const formatDestination = (uri: string): string => {
        if (!uri) return "Documents";
        // Treat the default app documents directory as "Documents"
        if (documentDirectory && uri === documentDirectory) return "Documents";
        if (documentDirectory && uri.startsWith(documentDirectory)) {
            return "Documents/" + uri.slice(documentDirectory.length);
        }
        try {
            if (uri.startsWith("content://")) {
                // Extract the tree path from the raw encoded URI so that
                // %2F (encoded slash) inside the path isn't treated as a
                // URL path separator. Decode only the captured segment.
                const treeMatch = uri.match(
                    /\/tree\/([^/]+)(?:\/document\/[^/]+)?$/i,
                );
                if (treeMatch) {
                    const decoded = decodeURIComponent(treeMatch[1]);
                    const path = decoded
                        .replace(/^primary:/, "")
                        .replace(/\//g, " / ");
                    return path
                        ? `Internal Storage / ${path}`
                        : "Internal Storage";
                }
                return decodeURIComponent(uri);
            }
            const decoded = decodeURIComponent(uri);
            if (decoded.startsWith("file://")) {
                return decoded.replace("file://", "");
            }
            return decoded;
        } catch {
            return uri;
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // ─── render ──────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safeArea}>
            <Animated.View
                style={styles.content}
                entering={FadeIn.duration(250)}
            >
                <Text style={styles.screenTitle}>New Archive</Text>

                {/* ── STEP 1: select files ── */}
                <Animated.View
                    layout={LinearTransition.duration(200).easing(
                        Easing.out(Easing.cubic),
                    )}
                    style={[styles.section, activeStep === 1 && { flex: 1 }]}
                >
                    <Pressable
                        style={styles.sectionHeader}
                        onPress={() => setActiveStep(1)}
                    >
                        <Text style={styles.sectionTitle}>1. select files</Text>
                        <Ionicons
                            name={
                                activeStep === 1 ? "chevron-up" : "chevron-down"
                            }
                            size={18}
                            color="#666"
                        />
                    </Pressable>

                    {activeStep === 1 && (
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(150)}
                            style={[styles.sectionBody, { flex: 1 }]}
                        >
                            {/* file list header */}
                            {files.length > 0 && (
                                <View style={styles.fileListHeader}>
                                    <Text style={styles.fileListCount}>
                                        {files.length} file
                                        {files.length !== 1 ? "s" : ""}
                                    </Text>
                                    <ScalePressable
                                        style={styles.clearAllBtn}
                                        onPress={() => setFiles([])}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={13}
                                            color="#c0392b"
                                        />
                                        <Text style={styles.clearAllText}>
                                            remove all
                                        </Text>
                                    </ScalePressable>
                                </View>
                            )}

                            {/* file list */}
                            <ScrollView
                                style={styles.fileList}
                                contentContainerStyle={styles.fileListContent}
                            >
                                {files.length === 0 ? (
                                    <Text style={styles.emptyText}>
                                        No files selected
                                    </Text>
                                ) : (
                                    files.map((file) => (
                                        <Animated.View
                                            key={file.uri}
                                            entering={FadeIn.duration(180)}
                                            exiting={FadeOut.duration(150)}
                                            layout={LinearTransition.duration(
                                                180,
                                            )}
                                            style={styles.fileRow}
                                        >
                                            <Ionicons
                                                name="document-outline"
                                                size={15}
                                                color="#555"
                                                style={{ marginRight: 8 }}
                                            />
                                            <Text
                                                style={styles.fileName}
                                                numberOfLines={1}
                                            >
                                                {file.name}
                                            </Text>
                                            {!!file.size && (
                                                <Text style={styles.fileSize}>
                                                    {formatSize(file.size)}
                                                </Text>
                                            )}
                                            <ScalePressable
                                                onPress={() =>
                                                    removeFile(file.uri)
                                                }
                                                hitSlop={12}
                                                style={styles.removeBtn}
                                            >
                                                <Ionicons
                                                    name="close-circle"
                                                    size={20}
                                                    color="#c0392b"
                                                />
                                            </ScalePressable>
                                        </Animated.View>
                                    ))
                                )}
                            </ScrollView>

                            {/* add buttons */}
                            <View style={styles.addRow}>
                                <ScalePressable
                                    style={styles.addBtn}
                                    onPress={addFiles}
                                >
                                    <Ionicons
                                        name="folder-open-outline"
                                        size={15}
                                        color="#ccc"
                                    />
                                    <Text style={styles.addBtnText}>
                                        add files
                                    </Text>
                                </ScalePressable>
                                <ScalePressable
                                    style={styles.addBtn}
                                    onPress={addMedia}
                                >
                                    <Ionicons
                                        name="images-outline"
                                        size={15}
                                        color="#ccc"
                                    />
                                    <Text style={styles.addBtnText}>
                                        add media
                                    </Text>
                                </ScalePressable>
                            </View>

                            {/* next step */}
                            <ScalePressable
                                style={[
                                    styles.actionBtn,
                                    files.length === 0 &&
                                        styles.actionBtnDisabled,
                                ]}
                                onPress={() => {
                                    if (files.length > 0) setActiveStep(2);
                                }}
                            >
                                <Text style={styles.actionBtnText}>
                                    Next step
                                </Text>
                            </ScalePressable>
                        </Animated.View>
                    )}
                </Animated.View>

                {/* ── STEP 2: destination ── */}
                <Animated.View
                    layout={LinearTransition.duration(200).easing(
                        Easing.out(Easing.cubic),
                    )}
                    style={[
                        styles.section,
                        activeStep < 2 && styles.sectionLocked,
                    ]}
                >
                    <Pressable
                        style={styles.sectionHeader}
                        onPress={() => {
                            if (files.length > 0) setActiveStep(2);
                        }}
                    >
                        <Text
                            style={[
                                styles.sectionTitle,
                                activeStep < 2 && styles.sectionTitleLocked,
                            ]}
                        >
                            2. destination select
                        </Text>
                        <Ionicons
                            name={
                                activeStep === 2 ? "chevron-up" : "chevron-down"
                            }
                            size={18}
                            color={activeStep < 2 ? "#2a2a2a" : "#666"}
                        />
                    </Pressable>

                    {activeStep === 2 && (
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(150)}
                            style={styles.sectionBody}
                        >
                            {/* archive destination */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    archive dest
                                </Text>
                                <ScalePressable
                                    style={styles.destRow}
                                    onPress={pickDestination}
                                >
                                    <Ionicons
                                        name="folder-outline"
                                        size={15}
                                        color="#555"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.destText}>
                                        {formatDestination(destination)}
                                    </Text>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color="#333"
                                    />
                                </ScalePressable>
                            </View>

                            {/* archive type */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    select and type
                                </Text>
                                <View
                                    style={styles.typeToggle}
                                    onLayout={(e) =>
                                        setToggleWidth(
                                            e.nativeEvent.layout.width,
                                        )
                                    }
                                >
                                    <Animated.View
                                        style={[
                                            styles.typeSlider,
                                            { width: sliderItemWidth },
                                            sliderStyle,
                                        ]}
                                    />
                                    {ARCHIVE_TYPES.map((t) => (
                                        <ScalePressable
                                            key={t}
                                            style={styles.typeBtn}
                                            onPress={() => setArchiveType(t)}
                                        >
                                            <Text
                                                style={[
                                                    styles.typeBtnText,
                                                    archiveType === t &&
                                                        styles.typeBtnTextActive,
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
                                <Text style={styles.fieldLabel}>
                                    select and name
                                </Text>
                                <View style={styles.nameRow}>
                                    <TextInput
                                        style={styles.nameInput}
                                        value={archiveName}
                                        onChangeText={setArchiveName}
                                        placeholder="archive-name"
                                        placeholderTextColor="#333"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <Text style={styles.nameExt}>
                                        .{archiveType}
                                    </Text>
                                </View>
                            </View>

                            {/* make archive */}
                            <ScalePressable
                                style={[
                                    styles.actionBtn,
                                    styles.actionBtnAccent,
                                    isLoading && styles.actionBtnDisabled,
                                ]}
                                onPress={makeArchive}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#e0e0e0" />
                                ) : (
                                    <Text style={styles.actionBtnText}>
                                        Make archive
                                    </Text>
                                )}
                            </ScalePressable>
                        </Animated.View>
                    )}
                </Animated.View>
            </Animated.View>

            {/* ── replace-file modal ── */}
            <Modal
                visible={showReplaceModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReplaceModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalIconRow}>
                            <Ionicons
                                name="warning-outline"
                                size={28}
                                color="#e67e22"
                            />
                        </View>
                        <Text style={styles.modalTitle}>
                            File already exists
                        </Text>
                        <Text style={styles.modalMessage}>
                            {`${archiveName.trim()}.${archiveType}`} already
                            exists in the destination.
                        </Text>
                        <View style={styles.modalActions}>
                            <ScalePressable
                                style={[
                                    styles.modalBtn,
                                    styles.modalBtnReplace,
                                ]}
                                onPress={() => {
                                    setShowReplaceModal(false);
                                    doCreateArchive(undefined, true);
                                }}
                            >
                                <Text style={styles.modalBtnReplaceText}>
                                    Replace
                                </Text>
                            </ScalePressable>
                            <ScalePressable
                                style={[styles.modalBtn, styles.modalBtnRename]}
                                onPress={() => {
                                    setShowReplaceModal(false);
                                    doCreateArchive(nextAvailableName);
                                }}
                            >
                                <Text style={styles.modalBtnRenameText}>
                                    Create as {nextAvailableName}.{archiveType}
                                </Text>
                            </ScalePressable>
                            <ScalePressable
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setShowReplaceModal(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>
                                    Cancel
                                </Text>
                            </ScalePressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── success modal ── */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalIconRow}>
                            <Ionicons
                                name="checkmark-circle"
                                size={40}
                                color="#27ae60"
                            />
                        </View>
                        <Text style={styles.modalTitle}>Archive created</Text>
                        <Text style={styles.successFileName}>
                            {successInfo.name}
                        </Text>
                        <View style={styles.successMeta}>
                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>Type</Text>
                                <Text style={styles.successValue}>
                                    {successInfo.type}
                                </Text>
                            </View>
                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>
                                    Saved to
                                </Text>
                                <Text
                                    style={styles.successValue}
                                    numberOfLines={2}
                                >
                                    {successInfo.path}
                                </Text>
                            </View>
                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>Files</Text>
                                <Text style={styles.successValue}>
                                    {successInfo.count}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.modalActions}>
                            <ScalePressable
                                style={[
                                    styles.modalBtn,
                                    styles.modalBtnSuccess,
                                ]}
                                onPress={() => setShowSuccessModal(false)}
                            >
                                <Text style={styles.modalBtnSuccessText}>
                                    Done
                                </Text>
                            </ScalePressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#000",
    },
    content: {
        flex: 1,
        padding: 16,
        gap: 12,
    },

    // screen title
    screenTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#444",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 4,
    },

    // sections
    section: {
        backgroundColor: "#0e0e0e",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1c1c1c",
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
        color: "#e0e0e0",
        letterSpacing: 0.2,
    },
    sectionTitleLocked: {
        color: "#2a2a2a",
    },
    sectionBody: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        gap: 10,
    },

    // file list
    fileList: {
        backgroundColor: "#080808",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        flex: 1,
    },
    fileListContent: {
        padding: 10,
        gap: 6,
    },
    emptyText: {
        color: "#333",
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
        color: "#b0b0b0",
        fontSize: 13,
    },
    fileSize: {
        color: "#444",
        fontSize: 11,
        marginLeft: 6,
        marginRight: 4,
    },
    fileListHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 2,
    },
    fileListCount: {
        color: "#444",
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
        backgroundColor: "#1a0a0a",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#3a1010",
    },
    clearAllText: {
        color: "#c0392b",
        fontSize: 14,
        fontWeight: "600",
    },
    removeBtn: {
        padding: 4,
        marginLeft: 6,
    },

    // add buttons
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
        backgroundColor: "#161616",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#222",
        paddingVertical: 14,
    },
    addBtnText: {
        color: "#ccc",
        fontSize: 13,
        fontWeight: "500",
    },

    // action button
    actionBtn: {
        backgroundColor: "#141414",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#252525",
        paddingVertical: 18,
        alignItems: "center",
    },
    actionBtnDisabled: {
        opacity: 0.3,
    },
    actionBtnAccent: {
        backgroundColor: "#1a1a1a",
        borderColor: "#333",
    },
    actionBtnText: {
        color: "#e0e0e0",
        fontSize: 15,
        fontWeight: "600",
    },

    // destination
    fieldGroup: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#444",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginLeft: 2,
    },
    destRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#080808",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    destText: {
        flex: 1,
        color: "#777",
        fontSize: 13,
    },

    // type toggle
    typeToggle: {
        flexDirection: "row",
        backgroundColor: "#080808",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        padding: 4,
        gap: 4,
    },
    typeSlider: {
        position: "absolute",
        top: 4,
        left: 4,
        bottom: 4,
        backgroundColor: "#1e1e1e",
        borderRadius: 6,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 13,
        alignItems: "center",
        borderRadius: 6,
    },
    typeBtnText: {
        color: "#444",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "monospace",
    },
    typeBtnTextActive: {
        color: "#e0e0e0",
    },

    // name input
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#080808",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        paddingHorizontal: 12,
        overflow: "hidden",
    },
    nameInput: {
        flex: 1,
        color: "#e0e0e0",
        fontSize: 13,
        paddingVertical: 11,
        fontFamily: "monospace",
    },
    nameExt: {
        color: "#444",
        fontSize: 13,
        fontFamily: "monospace",
        paddingLeft: 2,
    },

    // replace modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.75)",
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    modalBox: {
        width: "100%",
        backgroundColor: "#111",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#2a2a2a",
        padding: 24,
        gap: 12,
    },
    modalIconRow: {
        alignItems: "center",
    },
    modalTitle: {
        color: "#e0e0e0",
        fontSize: 17,
        fontWeight: "700",
        textAlign: "center",
    },
    modalMessage: {
        color: "#777",
        fontSize: 13,
        lineHeight: 20,
        textAlign: "center",
    },
    modalActions: {
        flexDirection: "column",
        gap: 8,
        marginTop: 4,
    },
    modalBtn: {
        paddingVertical: 17,
        borderRadius: 8,
        alignItems: "center",
    },
    modalBtnCancel: {
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    modalBtnCancelText: {
        color: "#888",
        fontSize: 15,
        fontWeight: "600",
    },
    modalBtnReplace: {
        backgroundColor: "#7a1a0a",
        borderWidth: 1,
        borderColor: "#a02010",
    },
    modalBtnReplaceText: {
        color: "#ff6b55",
        fontSize: 15,
        fontWeight: "700",
    },
    modalBtnRename: {
        backgroundColor: "#0a2a4a",
        borderWidth: 1,
        borderColor: "#1050a0",
    },
    modalBtnRenameText: {
        color: "#5599ff",
        fontSize: 15,
        fontWeight: "600",
    },
    modalBtnSuccess: {
        backgroundColor: "#0a3a1a",
        borderWidth: 1,
        borderColor: "#1a7a40",
    },
    modalBtnSuccessText: {
        color: "#2ecc71",
        fontSize: 15,
        fontWeight: "700",
    },
    successFileName: {
        color: "#e0e0e0",
        fontSize: 15,
        fontWeight: "600",
        fontFamily: "monospace",
        textAlign: "center",
    },
    successMeta: {
        backgroundColor: "#080808",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        padding: 12,
        gap: 8,
    },
    successRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    successLabel: {
        color: "#444",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        paddingTop: 1,
    },
    successValue: {
        color: "#999",
        fontSize: 13,
        flex: 1,
        textAlign: "right",
    },
});
