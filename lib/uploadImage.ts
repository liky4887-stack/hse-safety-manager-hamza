import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

/**
 * Compress → upload to Supabase Storage → return public URL.
 * Only the URL is stored in the database — never base64 or binary.
 */
export async function uploadImage(uri: string, folder: string): Promise<string | null> {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const response = await fetch(manipulated.uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const { error } = await supabase.storage
      .from('hse-media')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[uploadImage] upload failed:', error);
      return null;
    }

    const { data } = supabase.storage.from('hse-media').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error('[uploadImage] error:', err);
    return null;
  }
}
