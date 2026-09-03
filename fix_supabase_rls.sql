-- ==============================================================================
-- SCRIPT KHẮC PHỤC TRIỆT ĐỂ LỖI RLS SUPABASE (LỖI 42501)
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> Dán toàn bộ script này -> Bấm RUN
-- ==============================================================================

-- 1. BẢNG THÔNG BÁO (announcements)
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to announcements" ON public.announcements;
CREATE POLICY "Allow all access to announcements"
ON public.announcements
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 2. BẢNG ĐƠN XIN NGHỈ (leave_requests)
ALTER TABLE IF EXISTS public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests;
CREATE POLICY "Allow all access to leave_requests"
ON public.leave_requests
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 3. BẢNG ĐĂNG KÝ VỀ NHÀ (home_requests)
ALTER TABLE IF EXISTS public.home_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to home_requests" ON public.home_requests;
CREATE POLICY "Allow all access to home_requests"
ON public.home_requests
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. BẢNG HÒM THƯ TÂM SỰ (confessions)
ALTER TABLE IF EXISTS public.confessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to confessions" ON public.confessions;
CREATE POLICY "Allow all access to confessions"
ON public.confessions
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 5. BẢNG QUỸ LỚP (finance)
ALTER TABLE IF EXISTS public.finance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to finance" ON public.finance;
CREATE POLICY "Allow all access to finance"
ON public.finance
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 6. BẢNG ĐIỂM DANH LỚP & KTX (attendance, dorm_attendance)
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to attendance" ON public.attendance;
CREATE POLICY "Allow all access to attendance"
ON public.attendance
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

ALTER TABLE IF EXISTS public.dorm_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to dorm_attendance" ON public.dorm_attendance;
CREATE POLICY "Allow all access to dorm_attendance"
ON public.dorm_attendance
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 7. BẢNG THI ĐUA (competition_records)
ALTER TABLE IF EXISTS public.competition_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to competition_records" ON public.competition_records;
CREATE POLICY "Allow all access to competition_records"
ON public.competition_records
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 8. BẢNG HỌC SINH & CẤU HÌNH (students, teacher_config, timetable, class_map, audit_logs)
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to students" ON public.students;
CREATE POLICY "Allow all access to students"
ON public.students
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

ALTER TABLE IF EXISTS public.teacher_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to teacher_config" ON public.teacher_config;
CREATE POLICY "Allow all access to teacher_config"
ON public.teacher_config
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

ALTER TABLE IF EXISTS public.timetable ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to timetable" ON public.timetable;
CREATE POLICY "Allow all access to timetable"
ON public.timetable
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

ALTER TABLE IF EXISTS public.class_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to class_map" ON public.class_map;
CREATE POLICY "Allow all access to class_map"
ON public.class_map
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all access to audit_logs"
ON public.audit_logs
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);
