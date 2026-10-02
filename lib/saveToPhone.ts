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

      // Detect binary vs text: PDF and images are binary, must use Base64
      const isBinary =
        mimeType === 'application/pdf' ||
        mimeType.startsWith('image/');
      const encoding = isBinary
        ? FileSystem.EncodingType.Base64
        : FileSystem.EncodingType.UTF8;

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
