import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('qlcn-app.supabase.co') &&
  !supabaseAnonKey.includes('dummy_anon_key')
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

/**
 * Upload an image (base64 string or File) to Supabase Storage bucket 'class-media'
 * Returns the permanent HTTPS Public URL
 */
export async function uploadImageToSupabase(fileOrBase64, filename = 'image.jpg') {
  if (!isSupabaseConfigured) return null;
  try {
    let blob;
    let contentType = 'image/jpeg';

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
        return fileOrBase64;
      }
      const res = await fetch(fileOrBase64);
      blob = await res.blob();
      contentType = blob.type || 'image/jpeg';
    } else if (fileOrBase64 instanceof Blob || fileOrBase64 instanceof File) {
      blob = fileOrBase64;
      contentType = fileOrBase64.type || 'image/jpeg';
    } else {
      return null;
    }

    const ext = filename.split('.').pop() || 'jpg';
    const cleanPath = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('class-media')
      .upload(cleanPath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('class-media')
      .getPublicUrl(data.path);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('uploadImageToSupabase exception:', err.message);
    return null;
  }
}

/**
 * Listen to Realtime WebSocket changes across all public database tables
 * Triggers callback immediately when GVCN or Student adds, edits or deletes any record
 */
export function subscribeToClassChanges(onDataChange) {
  if (!isSupabaseConfigured) return null;

  try {
    const channel = supabase
      .channel('qlcn-realtime-room')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('⚡ [Supabase Realtime] Event received:', payload.eventType, payload.table);
          if (typeof onDataChange === 'function') {
            onDataChange(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Supabase Realtime] Connected WebSocket successfully.');
        }
      });

    return channel;
  } catch (err) {
    console.warn('Supabase Realtime subscription error:', err.message);
    return null;
  }
}

/**
 * Verify GVCN Login credentials against Supabase 'teachers' table
 */
export async function verifyTeacherSupabase(password) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('active', true)
      .limit(1);

    if (!error && data && data.length > 0) {
      const teacher = data[0];
      if (teacher.password === password || teacher.pin === password) {
        return {
          role: 'teacher',
          name: teacher.name || 'Đỗ Kim Tuyền',
          position: teacher.position || 'GVCN',
          email: teacher.email || 'dokimtuyen.thpt@gmail.com',
          provider: 'supabase'
        };
      }
    }
  } catch (err) {
    console.warn('Supabase authentication check failed:', err);
  }
  return null;
}
