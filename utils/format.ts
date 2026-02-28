import { documentDirectory } from "expo-file-system/legacy";

/**
 * Formats a raw URI into a human-readable path string.
 * Handles `content://` (Android SAF), `file://`, and the app's documents directory.
 */
export function formatDestination(uri: string): string {
    if (!uri) return "Tap to choose folder";

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
                return path ? `Internal Storage / ${path}` : "Internal Storage";
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
}

/**
 * Converts a byte count to a human-readable size string (B, KB, or MB).
 */
export function formatSize(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
