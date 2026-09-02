import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qlcn-app.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verify GVCN Login credentials against Supabase 'teachers' table or Supabase Auth
 */
export async function verifyTeacherSupabase(password) {
  try {
    // Attempt Supabase database query for teacher credentials
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
    console.warn('Supabase authentication check failed, using secure fallback:', err);
  }
  return null;
}
