import { ConfigSection } from "@/components/config-section";
import { FileListSection } from "@/components/file-list-section";
import { LoadingModal } from "@/components/loading-modal";
import { ReplaceModal } from "@/components/replace-modal";
import { SuccessModal, type SuccessInfo } from "@/components/success-modal";
import { ValidationModal } from "@/components/validation-modal";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
    checkArchiveExists,
    createArchive,
    findAvailableName,
    type ArchiveType,
    type SelectedFile,
} from "@/utils/archiver";
import { formatDestination } from "@/utils/format";
import * as DocumentPicker from "expo-document-picker";
import { StorageAccessFramework } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const ARCHIVE_TYPES: ArchiveType[] = ["zip", "tar", "tar.gz"];

export default function MainScreen() {
    const { colors } = useAppTheme();

    const [activeStep, setActiveStep] = useState<1 | 2>(1);
    const [files, setFiles] = useState<SelectedFile[]>([]);
    const [archiveType, setArchiveType] = useState<ArchiveType>("zip");
    const [toggleWidth, setToggleWidth] = useState(0);
    const [sliderItemWidth, setSliderItemWidth] = useState(0);
    const sliderX = useSharedValue(0);
    const [archiveName, setArchiveName] = useState("");
    const [destination, setDestination] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationContent, setValidationContent] = useState({
        title: "",
        message: "",
    });
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [nextAvailableName, setNextAvailableName] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successInfo, setSuccessInfo] = useState<SuccessInfo>({
        name: "",
        path: "",
        type: "",
        count: 0,
    });

    // ─── slider animation ───────────────────────────────────────────────────

    useEffect(() => {
        if (toggleWidth === 0) return;
        const innerWidth = toggleWidth - 8;
        const itemW = (innerWidth - 8) / 3;
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

    // ─── file helpers ───────────────────────────────────────────────────────

    const normalizeUri = (uri: string) => uri.replace(/\/$/, "").toLowerCase();

    const isDuplicate = (a: SelectedFile, b: SelectedFile) => {
        if (normalizeUri(a.uri) === normalizeUri(b.uri)) return true;
        return (
            a.name.toLowerCase() === b.name.toLowerCase() &&
            !!a.size &&
            !!b.size &&
            a.size === b.size
        );
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
            const unique = incoming.filter(
                (f) => !files.some((p) => isDuplicate(f, p)),
            );
            if (unique.length < incoming.length) {
                Alert.alert(
                    "Duplicate files",
                    `${incoming.length - unique.length} file(s) were already added and were skipped.`,
                );
            }
            setFiles((prev) => [...prev, ...unique]);
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
            const unique = incoming.filter(
                (f) => !files.some((p) => isDuplicate(f, p)),
            );
            if (unique.length < incoming.length) {
                Alert.alert(
                    "Duplicate files",
                    `${incoming.length - unique.length} file(s) were already added and were skipped.`,
                );
            }
            setFiles((prev) => [...prev, ...unique]);
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
                setDestination(result.assets[0].uri);
            } catch {
                Alert.alert(
                    "Destination",
                    "On iOS archives are saved to the App Documents folder.",
                );
            }
        }
    };

    // ─── archive creation ───────────────────────────────────────────────────

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
            const usedName = nameOverride ?? archiveName.trim();
            setSuccessInfo({
                name: `${usedName}.${archiveType}`,
                path: formatDestination(savedUri),
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

    const showValidation = (title: string, message: string) => {
        setValidationContent({ title, message });
        setShowValidationModal(true);
    };

    const makeArchive = async () => {
        if (!archiveName.trim()) {
            showValidation(
                "Missing name",
                "Please enter a name for the archive.",
            );
            return;
        }
        if (files.length === 0) {
            showValidation("No files", "Please add at least one file.");
            return;
        }
        if (!destination) {
            showValidation(
                "No destination",
                "Please select a destination folder.",
            );
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

    // ─── render ─────────────────────────────────────────────────────────────

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background }]}
        >
            <Animated.View
                style={styles.content}
                entering={FadeIn.duration(250)}
            >
                <Text style={[styles.screenTitle, { color: colors.textMuted }]}>
                    New Archive
                </Text>

                <FileListSection
                    files={files}
                    isActive={activeStep === 1}
                    colors={colors}
                    onActivate={() => setActiveStep(1)}
                    onAddFiles={addFiles}
                    onAddMedia={addMedia}
                    onRemoveFile={removeFile}
                    onClearAll={() => setFiles([])}
                    onNext={() => {
                        if (files.length > 0) setActiveStep(2);
                    }}
                />

                <ConfigSection
                    isActive={activeStep === 2}
                    isLocked={activeStep < 2}
                    destination={destination}
                    archiveType={archiveType}
                    archiveName={archiveName}
                    isLoading={isLoading}
                    sliderItemWidth={sliderItemWidth}
                    sliderStyle={sliderStyle}
                    colors={colors}
                    onActivate={() => {
                        if (files.length > 0) setActiveStep(2);
                    }}
                    onToggleLayout={setToggleWidth}
                    onPickDestination={pickDestination}
                    onTypeChange={setArchiveType}
                    onNameChange={setArchiveName}
                    onMakeArchive={makeArchive}
                />
            </Animated.View>

            <ReplaceModal
                visible={showReplaceModal}
                archiveName={archiveName}
                archiveType={archiveType}
                nextAvailableName={nextAvailableName}
                colors={colors}
                onReplace={() => {
                    setShowReplaceModal(false);
                    doCreateArchive(undefined, true);
                }}
                onRename={() => {
                    setShowReplaceModal(false);
                    doCreateArchive(nextAvailableName);
                }}
                onCancel={() => setShowReplaceModal(false)}
            />

            <SuccessModal
                visible={showSuccessModal}
                info={successInfo}
                colors={colors}
                onDismiss={() => setShowSuccessModal(false)}
            />

            <ValidationModal
                visible={showValidationModal}
                title={validationContent.title}
                message={validationContent.message}
                colors={colors}
                onDismiss={() => setShowValidationModal(false)}
            />

            <LoadingModal visible={isLoading} colors={colors} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
        gap: 12,
    },
    screenTitle: {
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 4,
    },
});
