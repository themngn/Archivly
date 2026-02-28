import { ArchiveType, SelectedFile, createArchive } from "@/utils/archiver";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { StorageAccessFramework } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MainScreen() {
    const [activeStep, setActiveStep] = useState<1 | 2>(1);
    const [files, setFiles] = useState<SelectedFile[]>([]);
    const [archiveType, setArchiveType] = useState<ArchiveType>("zip");
    const [archiveName, setArchiveName] = useState("");
    const [destination, setDestination] = useState("App Documents/");
    const [isLoading, setIsLoading] = useState(false);

    // ─── file helpers ────────────────────────────────────────────────────────

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
            setFiles((prev) => [
                ...prev,
                ...incoming.filter((f) => !prev.some((p) => p.uri === f.uri)),
            ]);
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
            setFiles((prev) => [
                ...prev,
                ...incoming.filter((f) => !prev.some((p) => p.uri === f.uri)),
            ]);
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

        setIsLoading(true);
        try {
            const savedUri = await createArchive(
                files,
                archiveType,
                archiveName,
                destination,
            );
            const displayPath = formatDestination(savedUri);
            Alert.alert(
                "Archive created",
                `📦 ${archiveName.trim()}.${archiveType}\n\nType: ${archiveType.toUpperCase()}\nSaved to: ${displayPath}\nFiles: ${files.length} file${files.length !== 1 ? "s" : ""}`,
            );
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const formatDestination = (uri: string): string => {
        if (!uri) return "App Documents/";
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
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.screenTitle}>New Archive</Text>

                {/* ── STEP 1: select files ── */}
                <View style={styles.section}>
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
                        <View style={styles.sectionBody}>
                            {/* add buttons */}
                            <View style={styles.addRow}>
                                <Pressable
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
                                </Pressable>
                                <Pressable
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
                                </Pressable>
                            </View>

                            {/* file list */}
                            <View style={styles.fileList}>
                                {files.length === 0 ? (
                                    <Text style={styles.emptyText}>
                                        No files selected
                                    </Text>
                                ) : (
                                    files.map((file) => (
                                        <View
                                            key={file.uri}
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
                                            <Pressable
                                                onPress={() =>
                                                    removeFile(file.uri)
                                                }
                                                hitSlop={8}
                                                style={styles.removeBtn}
                                            >
                                                <Ionicons
                                                    name="close"
                                                    size={14}
                                                    color="#444"
                                                />
                                            </Pressable>
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* next step */}
                            <Pressable
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
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* ── STEP 2: destination ── */}
                <View
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
                        <View style={styles.sectionBody}>
                            {/* archive destination */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    archive dest
                                </Text>
                                <Pressable
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
                                </Pressable>
                            </View>

                            {/* archive type */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>
                                    select and type
                                </Text>
                                <View style={styles.typeToggle}>
                                    {(
                                        [
                                            "zip",
                                            "tar",
                                            "tar.gz",
                                        ] as ArchiveType[]
                                    ).map((t) => (
                                        <Pressable
                                            key={t}
                                            style={[
                                                styles.typeBtn,
                                                archiveType === t &&
                                                    styles.typeBtnActive,
                                            ]}
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
                                        </Pressable>
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
                            <Pressable
                                style={[
                                    styles.actionBtn,
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
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#000",
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 12,
        flexGrow: 1,
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
        minHeight: 200,
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
    removeBtn: {
        padding: 2,
        marginLeft: 4,
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
        paddingVertical: 10,
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
        paddingVertical: 14,
        alignItems: "center",
    },
    actionBtnDisabled: {
        opacity: 0.3,
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
    typeBtn: {
        flex: 1,
        paddingVertical: 9,
        alignItems: "center",
        borderRadius: 6,
    },
    typeBtnActive: {
        backgroundColor: "#1e1e1e",
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
});
