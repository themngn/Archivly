import {
    EncodingType,
    StorageAccessFramework,
    documentDirectory,
    getInfoAsync,
    readAsStringAsync,
    writeAsStringAsync,
} from "expo-file-system/legacy";
import JSZip from "jszip";
import { gzip } from "pako";
import { Platform } from "react-native";

export type ArchiveType = "zip" | "tar" | "tar.gz";

export interface SelectedFile {
    name: string;
    uri: string;
    size?: number;
}

// ── base64 <-> Uint8Array helpers ────────────────────────────────────────────

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    // Process in chunks to avoid call-stack overflows on large buffers
    const CHUNK = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(
            ...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)),
        );
    }
    return btoa(binary);
}

// ── TAR helpers ──────────────────────────────────────────────────────────────

function writeString(
    buf: Uint8Array,
    offset: number,
    maxLen: number,
    str: string,
): void {
    for (let i = 0; i < maxLen; i++) {
        buf[offset + i] = i < str.length ? str.charCodeAt(i) : 0;
    }
}

/**
 * Builds a 512-byte POSIX ustar header block for a regular file.
 */
function buildTarHeader(name: string, size: number, mtime: number): Uint8Array {
    const hdr = new Uint8Array(512);

    // Checksum placeholder — must be spaces before summing
    for (let i = 148; i < 156; i++) hdr[i] = 0x20;

    writeString(hdr, 0, 100, name.slice(0, 99)); // name
    writeString(hdr, 100, 8, "0000644\0"); // mode
    writeString(hdr, 108, 8, "0000000\0"); // uid
    writeString(hdr, 116, 8, "0000000\0"); // gid
    writeString(hdr, 124, 12, size.toString(8).padStart(11, "0") + "\0"); // size
    writeString(
        hdr,
        136,
        12,
        Math.floor(mtime / 1000)
            .toString(8)
            .padStart(11, "0") + "\0",
    ); // mtime
    hdr[156] = 0x30; // typeflag '0' = regular file
    writeString(hdr, 257, 6, "ustar\0"); // magic
    hdr[263] = 0x30; // version '0'
    hdr[264] = 0x30; // version '0'

    // Compute and write checksum (6-digit octal + NUL + space)
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += hdr[i];
    writeString(hdr, 148, 8, sum.toString(8).padStart(6, "0") + "\0 ");

    return hdr;
}

async function buildTar(files: SelectedFile[]): Promise<Uint8Array> {
    const parts: Uint8Array[] = [];
    const mtime = Date.now();

    for (const file of files) {
        const b64 = await readAsStringAsync(file.uri, {
            encoding: EncodingType.Base64,
        });
        const content = base64ToUint8Array(b64);

        parts.push(buildTarHeader(file.name, content.length, mtime));
        parts.push(content);

        // Pad content to next 512-byte boundary
        const pad = (512 - (content.length % 512)) % 512;
        if (pad > 0) parts.push(new Uint8Array(pad));
    }

    // Two 512-byte zero-blocks end-of-archive marker
    parts.push(new Uint8Array(1024));

    const total = parts.reduce((n, p) => n + p.length, 0);
    const tar = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        tar.set(p, offset);
        offset += p.length;
    }
    return tar;
}

// ── ZIP helper ───────────────────────────────────────────────────────────────

async function buildZipBase64(files: SelectedFile[]): Promise<string> {
    const zip = new JSZip();

    for (const file of files) {
        const b64 = await readAsStringAsync(file.uri, {
            encoding: EncodingType.Base64,
        });
        zip.file(file.name, b64, { base64: true });
    }

    return zip.generateAsync({ type: "base64", compression: "DEFLATE" });
}

// ── destination writer ───────────────────────────────────────────────────────

async function saveFile(
    destinationUri: string,
    fileName: string,
    mimeType: string,
    base64Data: string,
    replace = false,
): Promise<string> {
    if (Platform.OS === "android" && destinationUri.startsWith("content://")) {
        // If replacing, delete the existing file first so SAF doesn't auto-number
        if (replace) {
            try {
                const entries =
                    await StorageAccessFramework.readDirectoryAsync(
                        destinationUri,
                    );
                for (const entry of entries) {
                    const decoded = decodeURIComponent(entry);
                    if (
                        decoded.endsWith("/" + fileName) ||
                        decoded.endsWith("%2F" + fileName)
                    ) {
                        await StorageAccessFramework.deleteAsync(entry);
                        break;
                    }
                }
            } catch {
                // ignore – createFileAsync will still write the data
            }
        }
        const fileUri = await StorageAccessFramework.createFileAsync(
            destinationUri,
            fileName,
            mimeType,
        );
        await writeAsStringAsync(fileUri, base64Data, {
            encoding: EncodingType.Base64,
        });
        return fileUri;
    }

    // iOS / web / fallback – write to app Documents directory
    const dir = documentDirectory ?? "";
    const targetUri = dir + fileName;
    await writeAsStringAsync(targetUri, base64Data, {
        encoding: EncodingType.Base64,
    });
    return targetUri;
}

// ── public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if an archive with the given name/type already exists at
 * `destinationUri`. Always returns false for Android SAF content:// URIs
 * because existence cannot be checked without listing the directory.
 */
export async function checkArchiveExists(
    archiveName: string,
    archiveType: ArchiveType,
    destinationUri: string,
): Promise<boolean> {
    const fileName = `${archiveName.trim()}.${archiveType}`;

    // Android SAF: list the directory and match by decoded filename
    if (destinationUri.startsWith("content://")) {
        try {
            const entries =
                await StorageAccessFramework.readDirectoryAsync(destinationUri);
            return entries.some((entry) => {
                try {
                    const decoded = decodeURIComponent(entry);
                    return (
                        decoded.endsWith("/" + fileName) ||
                        decoded.endsWith("%2F" + fileName)
                    );
                } catch {
                    return entry.includes(fileName);
                }
            });
        } catch {
            return false;
        }
    }

    // file:// paths (iOS / web / fallback)
    const dir = destinationUri.endsWith("/")
        ? destinationUri
        : destinationUri + "/";
    try {
        const info = await getInfoAsync(dir + fileName);
        return info.exists;
    } catch {
        return false;
    }
}

/**
 * Finds the next available archive name by appending (1), (2), … until
 * a filename that does not yet exist is found.
 */
export async function findAvailableName(
    archiveName: string,
    archiveType: ArchiveType,
    destinationUri: string,
): Promise<string> {
    if (destinationUri.startsWith("content://")) {
        return `${archiveName.trim()}(1)`;
    }
    const dir = destinationUri.endsWith("/")
        ? destinationUri
        : destinationUri + "/";
    let counter = 1;
    while (true) {
        const candidate = `${archiveName.trim()}(${counter})`;
        try {
            const info = await getInfoAsync(
                `${dir}${candidate}.${archiveType}`,
            );
            if (!info.exists) return candidate;
        } catch {
            return candidate;
        }
        counter++;
    }
}

/**
 * Creates an archive of the given files in the specified format, and saves
 * it to `destinationUri`.
 *
 * @returns The URI of the created archive file.
 */
export async function createArchive(
    files: SelectedFile[],
    archiveType: ArchiveType,
    archiveName: string,
    destinationUri: string,
    replace = false,
): Promise<string> {
    if (files.length === 0) throw new Error("No files to archive.");
    if (!archiveName.trim()) throw new Error("Archive name is required.");

    const fileName = `${archiveName.trim()}.${archiveType}`;
    let base64Data: string;
    let mimeType: string;

    if (archiveType === "zip") {
        base64Data = await buildZipBase64(files);
        mimeType = "application/zip";
    } else if (archiveType === "tar") {
        const tarBytes = await buildTar(files);
        base64Data = uint8ArrayToBase64(tarBytes);
        mimeType = "application/x-tar";
    } else {
        // tar.gz
        const tarBytes = await buildTar(files);
        const gzipped = gzip(tarBytes);
        base64Data = uint8ArrayToBase64(gzipped);
        mimeType = "application/octet-stream";
    }

    return saveFile(destinationUri, fileName, mimeType, base64Data, replace);
}
