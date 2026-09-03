import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local, .env, or process.env
const envLocal = path.join(__dirname, '..', '.env.local');
const envRoot = path.join(__dirname, '..', '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else if (fs.existsSync(envRoot)) dotenv.config({ path: envRoot });
else dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const TEACHER_PASS = process.env.TEACHER_PASSWORD || 'Gvcn127_SecurePass!';

console.log('===================================================================');
console.log('🚀 TOOL DI CHUYỂN DỮ LIỆU THẬT LÊN SUPABASE CLOUD (QLCN 12.7)');
console.log('===================================================================');

// 1. Read real data from backup
const backupDir = path.join(__dirname, 'backup');
const jsonBackup = path.join(backupDir, 'db_data_12.7.real.json');

let realStudents = [];
let dbData = {};

if (fs.existsSync(jsonBackup)) {
  try {
    dbData = JSON.parse(fs.readFileSync(jsonBackup, 'utf-8'));
    if (Array.isArray(dbData.students) && dbData.students.length > 0) {
      realStudents = dbData.students;
      console.log(`✅ Đã nạp ${realStudents.length} học sinh thật từ ${path.basename(jsonBackup)}`);
    }
  } catch (err) {
    console.warn('Lỗi đọc file json backup:', err.message);
  }
}

if (realStudents.length === 0) {
  console.error('❌ Không tìm thấy dữ liệu học sinh thật trong thư mục backup!');
  process.exit(1);
}

// 2. Generate secure PINs & CSV Handover list
console.log('🔐 Đang sinh mã PIN bảo mật ngẫu nhiên và băm Bcrypt cho từng học sinh...');
const pinHandoverRows = ['STT,Mã Học Sinh,Họ Và Tên,Tổ,Phòng KTX,Mã PIN Khởi Tạo'];
const studentsToInsert = [];
const salt = bcrypt.genSaltSync(10);
const teacherPasswordHash = bcrypt.hashSync(TEACHER_PASS, salt);

for (const s of realStudents) {
  // Generate a distinct 6-digit random PIN
  const rawPin = String(Math.floor(100000 + Math.random() * 900000));
  const pinHash = bcrypt.hashSync(rawPin, salt);
  
  pinHandoverRows.push(`${s.id},${s.studentCode || ''},"${s.name}",${s.group || ''},${s.dormRoom || ''},${rawPin}`);
  
  studentsToInsert.push({
    id: s.id,
    student_code: s.studentCode || String(2404766100 + s.id),
    name: s.name,
    gender: s.gender || 'Nam',
    dob: s.dob || '',
    ethnicity: s.ethnicity || 'Kinh',
    address: s.address || '',
    phone: s.phone || '',
    mother_name: s.motherName || '',
    mother_phone: s.motherPhone || '',
    father_name: s.fatherName || '',
    father_phone: s.fatherPhone || '',
    group_name: s.group || 'Tổ 1',
    dorm_room: s.dormRoom || '',
    role: s.role || 'member',
    position: s.position || '',
    is_poor: !!s.isPoor,
    points: typeof s.points === 'number' ? s.points : 100,
    prev_gpa: s.prevGPA || 7.0,
    prev_rank: s.prevRank || 'Khá',
    prev_conduct: s.prevConduct || 'Tốt',
    prev_title: s.prevTitle || '',
    prev_absence_permit: s.prevAbsencePermit || 0,
    prev_absence_no: s.prevAbsenceNo || 0,
    note: s.note || '',
    seat_index: typeof s.seatIndex === 'number' ? s.seatIndex : (s.id - 1),
    pin_hash: pinHash,
    is_active: true
  });
}

// Write handover file locally (gitignored)
const handoverCsvPath = path.join(__dirname, '..', 'student_pins_handover.csv');
fs.writeFileSync(handoverCsvPath, pinHandoverRows.join('\n'), 'utf-8');
console.log(`✅ Đã xuất danh sách mã PIN bàn giao cho GVCN: ${handoverCsvPath}`);

// 3. Generate seed_data.sql for offline / manual run
const sqlStatements = [
  '-- ==============================================================================;',
  '-- 1. TỰ ĐỘNG THÊM CỘT PIN_HASH VÀO BẢNG STUDENTS NẾU BẢNG ĐÃ TỒN TẠI TỪ TRƯỚC;',
  '-- ==============================================================================;',
  'ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);',
  'ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;',
  'ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;\n',
  '-- 2. TỰ ĐỘNG TẠO BẢNG CẤU HÌNH GVCN NẾU CHƯA CÓ;',
  `CREATE TABLE IF NOT EXISTS public.teacher_config (
    id INT PRIMARY KEY DEFAULT 1,
    teacher_name VARCHAR(255) DEFAULT 'Đỗ Kim Tuyền',
    password_hash VARCHAR(255),
    class_name VARCHAR(50) DEFAULT '12.7',
    school_year VARCHAR(50) DEFAULT '2026 - 2027',
    school_name VARCHAR(255) DEFAULT 'Trường PTDTNT',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);\n`,
  '-- 3. NẠP CẤU HÌNH GVCN VÀ MẬT KHẨU BĂM BCRYPT;',
  `INSERT INTO public.teacher_config (id, teacher_name, password_hash, class_name, school_year)
VALUES (1, 'Đỗ Kim Tuyền', '${teacherPasswordHash}', '12.7', '2026 - 2027')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;\n`,
  '-- 4. NẠP 32 HỌC SINH VÀ MÃ PIN ĐÃ ĐƯỢC BĂM BẢO MẬT;'
];

for (const s of studentsToInsert) {
  const esc = (val) => val ? String(val).replace(/'/g, "''") : '';
  sqlStatements.push(`INSERT INTO public.students (id, student_code, name, gender, dob, ethnicity, address, phone, mother_name, mother_phone, father_name, father_phone, group_name, dorm_room, role, position, is_poor, points, prev_gpa, prev_rank, prev_conduct, prev_title, prev_absence_permit, prev_absence_no, note, seat_index, pin_hash)
VALUES (${s.id}, '${esc(s.student_code)}', '${esc(s.name)}', '${esc(s.gender)}', '${esc(s.dob)}', '${esc(s.ethnicity)}', '${esc(s.address)}', '${esc(s.phone)}', '${esc(s.mother_name)}', '${esc(s.mother_phone)}', '${esc(s.father_name)}', '${esc(s.father_phone)}', '${esc(s.group_name)}', '${esc(s.dorm_room)}', '${esc(s.role)}', '${esc(s.position)}', ${s.is_poor}, ${s.points}, ${s.prev_gpa}, '${esc(s.prev_rank)}', '${esc(s.prev_conduct)}', '${esc(s.prev_title)}', ${s.prev_absence_permit}, ${s.prev_absence_no}, '${esc(s.note)}', ${s.seat_index}, '${esc(s.pin_hash)}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, pin_hash = EXCLUDED.pin_hash,
  mother_name = EXCLUDED.mother_name, mother_phone = EXCLUDED.mother_phone,
  father_name = EXCLUDED.father_name, father_phone = EXCLUDED.father_phone;\n`);
}

const seedSqlPath = path.join(__dirname, '..', 'supabase_seed_full.sql');
fs.writeFileSync(seedSqlPath, sqlStatements.join('\n'), 'utf-8');
console.log(`✅ Đã xuất file SQL đầy đủ: ${seedSqlPath} (Có thể copy vào Supabase SQL Editor)`);

// 4. Upload directly to Supabase if credentials are provided
if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project-id')) {
  console.log('-------------------------------------------------------------------');
  console.log('ℹ️ SUPABASE_URL hoặc SUPABASE_KEY chưa được thiết lập.');
  console.log('👉 Bạn có thể:');
  console.log('   1. Mở file supabase_seed_full.sql, copy toàn bộ nội dung và bấm RUN trong Supabase SQL Editor.');
  console.log('   2. Hoặc điền SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY vào .env.local rồi chạy lại: node scripts/migrate_to_supabase.js');
  console.log('-------------------------------------------------------------------');
  process.exit(0);
}

async function uploadToSupabase() {
  console.log(`🌐 Đang kết nối tới Supabase: ${SUPABASE_URL} ...`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Insert teacher_config
  const { error: cfgErr } = await supabase.from('teacher_config').upsert({
    id: 1,
    teacher_name: 'Đỗ Kim Tuyền',
    password_hash: teacherPasswordHash,
    class_name: '12.7',
    school_year: '2026 - 2027',
    school_name: 'Trường PTDTNT'
  });
  if (cfgErr) console.warn('Cảnh báo teacher_config:', cfgErr.message);
  else console.log('✅ Đã lưu cấu hình GVCN & Mật khẩu mã hóa lên Supabase.');

  // 2. Upsert 32 students
  console.log(`Đang đẩy ${studentsToInsert.length} học sinh lên bảng students...`);
  const { error: stErr } = await supabase.from('students').upsert(studentsToInsert, { onConflict: 'id' });
  if (stErr) {
    console.error('❌ Lỗi khi tải lên bảng students:', stErr.message);
  } else {
    console.log(`✅ THÀNH CÔNG: Đã đẩy ${studentsToInsert.length} học sinh lên Supabase Cloud Database!`);
  }

  // 3. Upsert announcements if exist
  if (Array.isArray(dbData.announcements) && dbData.announcements.length > 0) {
    const annRows = dbData.announcements.map(a => ({
      id: a.id,
      title: a.title || 'Thông báo',
      content: a.content || '',
      tag: a.tag || 'Chung',
      date: a.date || new Date().toISOString(),
      attachment: a.attachment || null,
      read_by: a.readBy || []
    }));
    const { error: annErr } = await supabase.from('announcements').upsert(annRows, { onConflict: 'id' });
    if (!annErr) console.log(`✅ Đã đồng bộ ${annRows.length} thông báo lên Supabase.`);
  }

  // 4. Upsert finance if exist
  if (Array.isArray(dbData.finance) && dbData.finance.length > 0) {
    const finRows = dbData.finance.map(f => ({
      id: f.id,
      type: f.type || 'expense',
      title: f.title || 'Khoản chi',
      amount: f.amount || 0,
      category: f.category || 'Hoạt động',
      note: f.note || '',
      date: f.date || new Date().toISOString()
    }));
    const { error: finErr } = await supabase.from('finance').upsert(finRows, { onConflict: 'id' });
    if (!finErr) console.log(`✅ Đã đồng bộ ${finRows.length} giao dịch quỹ lớp lên Supabase.`);
  }

  console.log('===================================================================');
  console.log('🎉 QUÁ TRÌNH DI CHUYỂN DỮ LIỆU THẬT LÊN SUPABASE HOÀN TẤT!');
  console.log('===================================================================');
}

uploadToSupabase().catch(err => {
  console.error('❌ Lỗi quá trình upload:', err.message);
});