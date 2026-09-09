-- SQL Schema for Supabase Cloud Database - QLCN 12.7 App
-- Chạy script này trong Supabase -> SQL Editor -> Run

-- 1. Table Học sinh
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    student_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10),
    dob VARCHAR(50),
    ethnicity VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    mother_name VARCHAR(255),
    mother_phone VARCHAR(50),
    father_name VARCHAR(255),
    father_phone VARCHAR(50),
    group_name VARCHAR(50),
    dorm_room VARCHAR(50),
    role VARCHAR(50),
    position VARCHAR(255),
    is_poor BOOLEAN DEFAULT FALSE,
    points INT DEFAULT 100,
    prev_gpa NUMERIC(4,2),
    prev_rank VARCHAR(50),
    prev_conduct VARCHAR(50),
    prev_title VARCHAR(100),
    prev_absence_permit INT DEFAULT 0,
    prev_absence_no INT DEFAULT 0,
    note TEXT,
    seat_index INT
);

-- 2. Table Thời khóa biểu (Lưu cả URL ảnh và bảng tiết học có cấu trúc)
CREATE TABLE IF NOT EXISTS public.timetable (
    id INT PRIMARY KEY DEFAULT 1,
    image TEXT,
    data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS image TEXT;

-- 3. Table Sơ đồ lớp
CREATE TABLE IF NOT EXISTS public.class_map (
    id INT PRIMARY KEY DEFAULT 1,
    image TEXT
);
ALTER TABLE public.class_map ADD COLUMN IF NOT EXISTS image TEXT;

-- 4. Table Thông báo
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tag VARCHAR(50),
    date VARCHAR(50),
    attachment JSONB,
    read_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table Đơn xin phép nghỉ học
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id BIGINT PRIMARY KEY,
    student_id INT,
    student_name VARCHAR(255),
    type VARCHAR(50),
    reason TEXT,
    date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    confirmed_by_officer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table Đăng ký về nhà cuối tuần
CREATE TABLE IF NOT EXISTS public.home_requests (
    id BIGINT PRIMARY KEY,
    student_id INT,
    student_name VARCHAR(255),
    leave_date VARCHAR(50),
    return_date VARCHAR(50),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table Hòm thư tâm sự
CREATE TABLE IF NOT EXISTS public.confessions (
    id BIGINT PRIMARY KEY,
    content TEXT NOT NULL,
    reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    replied_at TIMESTAMP WITH TIME ZONE
);

-- 8. Table Điểm danh 5 buổi
CREATE TABLE IF NOT EXISTS public.attendance (
    date VARCHAR(50) PRIMARY KEY,
    record JSONB NOT NULL
);

-- 9. Table Điểm danh KTX tắt đèn
CREATE TABLE IF NOT EXISTS public.dorm_attendance (
    date VARCHAR(50) PRIMARY KEY,
    record JSONB NOT NULL
);

-- 10. Table Chấm thi đua 47 tiêu chí
CREATE TABLE IF NOT EXISTS public.competition_records (
    id SERIAL PRIMARY KEY,
    week_id VARCHAR(50) NOT NULL,
    student_id INT NOT NULL,
    violations JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'draft',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Table Nhật ký hoạt động lớp
CREATE TABLE IF NOT EXISTS public.activities (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    image TEXT,
    date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Table Quản lý Thu - Chi Quỹ Lớp
CREATE TABLE IF NOT EXISTS public.finance (
    id BIGINT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50),
    note TEXT,
    date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Table Nhật ký thao tác (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(255),
    role VARCHAR(50),
    action VARCHAR(255),
    target VARCHAR(255),
    details TEXT
);

-- 14. Thiết lập Quyền Truy Cập (Tắt RLS để đọc/ghi thông suốt qua API Key Anon)
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 15. KÍCH HOẠT SUPABASE REALTIME (WEBSOCKETS) CẬP NHẬT TỨC THÌ
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timetable;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_map;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.home_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dorm_attendance;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_records;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finance;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.confessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 16. TẠO BUCKET LƯU ẢNH TRÊN SUPABASE STORAGE (class-media)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('class-media', 'class-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    CREATE POLICY "Allow public all access on class-media"
    ON storage.objects FOR ALL
    USING (bucket_id = 'class-media')
    WITH CHECK (bucket_id = 'class-media');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
