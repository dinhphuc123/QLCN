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

// ── Competition Records Helpers (Thi Đua 3 Tầng) ─────────────────────────

function packSupabaseRecord(weekId, studentId, record) {
  return {
    week_id: weekId,
    student_id: parseInt(studentId, 10),
    violations: {
      items: record.violations || [],
      meta: {
        status: record.status || 'draft',
        submittedAt: record.submittedAt || null,
        reviewNote: record.reviewNote || '',
        reviewedBy: record.reviewedBy || null,
        reviewedAt: record.reviewedAt || null,
        monitorApprovedBy: record.monitorApprovedBy || null,
        monitorApprovedAt: record.monitorApprovedAt || null,
        teacherNote: record.teacherNote || '',
        approvedBy: record.approvedBy || null,
        approvedAt: record.approvedAt || null,
        updatedAt: new Date().toISOString()
      }
    },
    status: record.status || 'draft',
    updated_at: new Date().toISOString()
  };
}

function unpackSupabaseRecord(row) {
  let violations = [];
  let meta = {};
  if (Array.isArray(row.violations)) {
    violations = row.violations;
  } else if (row.violations && typeof row.violations === 'object') {
    violations = row.violations.items || row.violations.violations || [];
    meta = row.violations.meta || {};
  }
  return {
    studentId: row.student_id,
    violations,
    status: row.status || meta.status || 'draft',
    submittedAt: meta.submittedAt || null,
    reviewNote: meta.reviewNote || '',
    reviewedBy: meta.reviewedBy || null,
    reviewedAt: meta.reviewedAt || null,
    monitorApprovedBy: meta.monitorApprovedBy || null,
    monitorApprovedAt: meta.monitorApprovedAt || null,
    teacherNote: meta.teacherNote || '',
    approvedBy: meta.approvedBy || null,
    approvedAt: meta.approvedAt || null,
    updatedAt: row.updated_at || meta.updatedAt || new Date().toISOString()
  };
}

/**
 * Lấy toàn bộ bản ghi thi đua theo tuần từ Supabase
 */
export async function fetchCompetitionFromSupabase(weekId) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('competition_records')
      .select('*')
      .eq('week_id', weekId);

    if (error) throw error;
    if (!data) return {};

    const result = {};
    data.forEach(row => {
      result[row.student_id] = unpackSupabaseRecord(row);
    });
    return result;
  } catch (err) {
    console.warn('fetchCompetitionFromSupabase error:', err.message);
    return null;
  }
}

/**
 * Lưu/cập nhật 1 bản ghi thi đua của học sinh lên Supabase
 */
export async function saveCompetitionRecordToSupabase(weekId, studentId, record) {
  if (!isSupabaseConfigured) return null;
  try {
    const sId = parseInt(studentId, 10);
    const row = packSupabaseRecord(weekId, sId, record);
    const { data: existing } = await supabase
      .from('competition_records')
      .select('id')
      .eq('week_id', weekId)
      .eq('student_id', sId)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from('competition_records')
        .update(row)
        .eq('id', existing[0].id)
        .select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('competition_records')
        .insert([row])
        .select();
      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.warn('saveCompetitionRecordToSupabase failed:', err.message);
    return null;
  }
}

/**
 * Lưu hàng loạt bản ghi thi đua lên Supabase (phục vụ duyệt toàn bộ lớp)
 */
export async function bulkSaveCompetitionToSupabase(weekId, recordsMap) {
  if (!isSupabaseConfigured) return null;
  try {
    const entries = Object.entries(recordsMap || {});
    if (entries.length === 0) return true;

    const { data: existingList } = await supabase
      .from('competition_records')
      .select('id, student_id')
      .eq('week_id', weekId);

    const existingMap = {};
    (existingList || []).forEach(item => {
      existingMap[item.student_id] = item.id;
    });

    const updates = [];
    const inserts = [];

    entries.forEach(([sid, record]) => {
      const sId = parseInt(sid, 10);
      const row = packSupabaseRecord(weekId, sId, record);
      if (existingMap[sId]) {
        updates.push({ ...row, id: existingMap[sId] });
      } else {
        inserts.push(row);
      }
    });

    if (inserts.length > 0) {
      await supabase.from('competition_records').insert(inserts);
    }
    for (const u of updates) {
      await supabase.from('competition_records').update(u).eq('id', u.id);
    }
    return true;
  } catch (err) {
    console.warn('bulkSaveCompetitionToSupabase failed:', err.message);
    return false;
  }
}

/**
 * Đăng ký lắng nghe thay đổi thời gian thực cho bảng competition_records theo tuần
 */
export function subscribeToCompetitionChanges(weekId, onRecordChange) {
  if (!isSupabaseConfigured) return null;
  try {
    const channelName = `competition-${weekId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_records', filter: `week_id=eq.${weekId}` },
        (payload) => {
          if (payload.new && typeof onRecordChange === 'function') {
            const unpacked = unpackSupabaseRecord(payload.new);
            onRecordChange({
              eventType: payload.eventType,
              record: unpacked,
              raw: payload.new
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Supabase Realtime] Đã kết nối theo dõi thi đua tuần ${weekId}`);
        }
      });

    return channel;
  } catch (err) {
    console.warn('subscribeToCompetitionChanges error:', err.message);
    return null;
  }
}

