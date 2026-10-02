import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

/**
 * Saves a file to the user's chosen folder on Android (typically Downloads).
 * On iOS, falls back to the share sheet (iOS doesn't allow direct Downloads write).
 *
 * Returns the saved file URI, or null if the user cancelled.
 */
export async function saveToPhone(
  sourceUri: string,
  filename: string,
  mimeType: string,
  dialogTitle: string,
): Promise<string | null> {
  // ── Android: use Storage Access Framework ──
  if (Platform.OS === 'android') {
    try {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        // User denied → fallback to share sheet
        return await fallbackShare(sourceUri, mimeType, dialogTitle);
      }

      // Create the file in the chosen folder
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        mimeType,
      );

      // Text-only MIME types use UTF-8; everything else is binary (PDF, xlsx, docx, images)
      const isText =
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/xml';
      const encoding = isText
        ? FileSystem.EncodingType.UTF8
        : FileSystem.EncodingType.Base64;

      const content = await FileSystem.readAsStringAsync(sourceUri, {
        encoding,
      });

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding,
      });

      return fileUri;
    } catch (err) {
      console.warn('[saveToPhone] Android SAF failed:', err);
      return await fallbackShare(sourceUri, mimeType, dialogTitle);
    }
  }

  // ── iOS / Web: use share sheet ──
  return await fallbackShare(sourceUri, mimeType, dialogTitle);
}

async function fallbackShare(
  uri: string,
  mimeType: string,
  dialogTitle: string,
): Promise<string | null> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle,
      UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
    });
  }
  return uri;
}
