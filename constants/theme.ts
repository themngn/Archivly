import { Platform } from "react-native";

/**
 * Color tokens used throughout the app, defined for light and dark schemes.
 */
export const Colors = {
    light: {
        // Backgrounds
        background: "#f5f5f5",
        surface: "#ffffff",
        surfaceBorder: "#e0e0e0",
        surfaceInner: "#f0f0f0",
        surfaceInnerBorder: "#dcdcdc",

        // Text
        textPrimary: "#1a1a1a",
        textSecondary: "#555555",
        textTertiary: "#777777",
        textMuted: "#999999",
        textPlaceholder: "#aaaaaa",

        // Icons
        icon: "#666666",
        iconMuted: "#888888",
        iconLight: "#555555",

        // Buttons
        buttonBackground: "#e8e8e8",
        buttonBorder: "#d0d0d0",
        buttonSecondaryBackground: "#eeeeee",
        buttonSecondaryBorder: "#dddddd",
        accentBackground: "#e0e0e0",
        accentBorder: "#cccccc",

        // Slider
        sliderThumb: "#d8d8d8",

        // Section
        sectionLockedText: "#cccccc",

        // Danger
        danger: "#c0392b",
        dangerBackground: "#fdeaeb",
        dangerBorder: "#f5c6cb",

        // Modal
        modalOverlay: "rgba(0,0,0,0.4)",
        modalBackground: "#ffffff",
        modalBorder: "#e0e0e0",

        // Modal buttons
        cancelBackground: "#f0f0f0",
        cancelBorder: "#d0d0d0",
        cancelText: "#666666",

        // Warning
        warningIcon: "#e67e22",

        // Replace
        replaceBackground: "#fdeaeb",
        replaceBorder: "#f5c6cb",
        replaceText: "#c0392b",

        // Rename
        renameBackground: "#e8f0fe",
        renameBorder: "#a8c7fa",
        renameText: "#1a5fb4",

        // Success
        successIcon: "#27ae60",
        successBackground: "#eafaf1",
        successBorder: "#a3d9b1",
        successText: "#1e8449",

        // Meta
        metaValue: "#666666",
    },
    dark: {
        // Backgrounds
        background: "#000000",
        surface: "#0e0e0e",
        surfaceBorder: "#1c1c1c",
        surfaceInner: "#080808",
        surfaceInnerBorder: "#1a1a1a",

        // Text
        textPrimary: "#e0e0e0",
        textSecondary: "#b0b0b0",
        textTertiary: "#777777",
        textMuted: "#444444",
        textPlaceholder: "#333333",

        // Icons
        icon: "#555555",
        iconMuted: "#666666",
        iconLight: "#cccccc",

        // Buttons
        buttonBackground: "#141414",
        buttonBorder: "#252525",
        buttonSecondaryBackground: "#161616",
        buttonSecondaryBorder: "#222222",
        accentBackground: "#1a1a1a",
        accentBorder: "#333333",

        // Slider
        sliderThumb: "#1e1e1e",

        // Section
        sectionLockedText: "#2a2a2a",

        // Danger
        danger: "#c0392b",
        dangerBackground: "#1a0a0a",
        dangerBorder: "#3a1010",

        // Modal
        modalOverlay: "rgba(0,0,0,0.75)",
        modalBackground: "#111111",
        modalBorder: "#2a2a2a",

        // Modal buttons
        cancelBackground: "#1a1a1a",
        cancelBorder: "#2a2a2a",
        cancelText: "#888888",

        // Warning
        warningIcon: "#e67e22",

        // Replace
        replaceBackground: "#7a1a0a",
        replaceBorder: "#a02010",
        replaceText: "#ff6b55",

        // Rename
        renameBackground: "#0a2a4a",
        renameBorder: "#1050a0",
        renameText: "#5599ff",

        // Success
        successIcon: "#27ae60",
        successBackground: "#0a3a1a",
        successBorder: "#1a7a40",
        successText: "#2ecc71",

        // Meta
        metaValue: "#999999",
    },
};

export type AppColorScheme = typeof Colors.dark;

export const Fonts = Platform.select({
    ios: {
        mono: "ui-monospace",
    },
    default: {
        mono: "monospace",
    },
    web: {
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
    },
})!;
