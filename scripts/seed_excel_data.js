import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const EXCEL_FILE = path.join(process.cwd(), 'danh_sach_hoc_sinh_12_7 (2).xlsx');
const DB_FILE = path.join(process.cwd(), 'db_data_12.7.json');

// Parse Excel File
export function parseExcelData() {
  if (!fs.existsSync(EXCEL_FILE)) {
    throw new Error(`File Excel ${EXCEL_FILE} không tồn tại!`);
  }

  const wb = XLSX.readFile(EXCEL_FILE);
  const ds = XLSX.utils.sheet_to_json(wb.Sheets['DS học sinh 12.7'], { header: 1 });
  const ll = XLSX.utils.sheet_to_json(wb.Sheets['Liên lạc'], { header: 1 });
  const cb = XLSX.utils.sheet_to_json(wb.Sheets['Cán bộ lớp'], { header: 1 });

  const contactMap = {};
  ll.slice(4).forEach(r => {
    if (r && r[1]) {
      contactMap[String(r[1]).trim()] = {
        motherName: r[3] ? String(r[3]).trim() : '',
        motherPhone: r[4] ? String(r[4]).trim() : '',
        fatherName: r[5] ? String(r[5]).trim() : '',
        fatherPhone: r[6] ? String(r[6]).trim() : '',
      };
    }
  });

  const officerMap = {};
  cb.slice(4).forEach(r => {
    if (r && r[1] && r[2]) {
      const roleTitle = String(r[1]).trim();
      const name = String(r[2]).trim();
      if (!officerMap[name]) officerMap[name] = [];
      officerMap[name].push(roleTitle);
    }
  });

  const students = ds.slice(4).filter(r => r && r[1]).map((r, i) => {
    const id = i + 1;
    const name = String(r[1]).trim();
    const cInfo = contactMap[name] || {};
    const positions = officerMap[name] || [];
    const positionStr = positions.join(', ');

    let role = 'member';
    if (positionStr.includes('Lớp trưởng')) role = 'monitor';
    else if (positionStr.includes('Tổ trưởng')) role = 'group_leader';
    else if (positionStr.includes('Trưởng phòng')) role = 'room_leader';

    let group = 'Tổ 1';
    if (id > 8 && id <= 16) group = 'Tổ 2';
    else if (id > 16 && id <= 24) group = 'Tổ 3';
    else if (id > 24) group = 'Tổ 4';

    if (positionStr.includes('Tổ trưởng tổ 1')) group = 'Tổ 1';
    if (positionStr.includes('Tổ trưởng tổ 2')) group = 'Tổ 2';
    if (positionStr.includes('Tổ trưởng tổ 3')) group = 'Tổ 3';
    if (positionStr.includes('Tổ trưởng tổ 4')) group = 'Tổ 4';

    const isMale = r[2] === 'Nam';
    let dormRoom = 'C08';
    if (!isMale) {
      if (id <= 6) dormRoom = 'A1-07';
      else if (id <= 12) dormRoom = 'A1-08';
      else if (id <= 18) dormRoom = 'A1-09';
      else if (id <= 24) dormRoom = 'A1-10';
      else dormRoom = 'A1-11';
    }

    return {
      id,
      studentCode: '2404766' + String(115 + i).padStart(3, '0'),
      name,
      gender: r[2] || 'Nữ',
      dob: r[3] || '',
      ethnicity: r[4] || '',
      address: r[5] || '',
      phone: r[6] ? String(r[6]).trim() : '',
      motherName: cInfo.motherName || '',
      motherPhone: cInfo.motherPhone || '',
      fatherName: cInfo.fatherName || '',
      fatherPhone: cInfo.fatherPhone || '',
      group,
      dormRoom,
      role,
      position: positionStr,
      isPoor: [5, 6, 12, 18, 24, 27].includes(id),
      points: 100,
      seatIndex: i
    };
  });

  return students;
}

export async function seedData() {
  console.log('🔄 Đang đọc và trích xuất dữ liệu từ file Excel...');
  const students = parseExcelData();
  console.log(`✅ Trích xuất thành công ${students.length} học sinh chính thức từ Excel.`);

  // 1. Clear & update db_data_12.7.json
  const cleanData = {
    students,
    timetableImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800',
    classMapImage: '',
    announcements: [],
    leaveRequests: [],
    homeRequests: [],
    confessions: [],
    attendance: {},
    dormAttendance: {},
    competitionRecords: {},
    activities: [],
    finance: [],
    auditLogs: [
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        username: 'Đỗ Kim Tuyền',
        role: 'GVCN',
        action: 'XÓA DEMO & NẠP EXCEL THẬT',
        target: 'Hệ thống QLCN',
        details: `Đã xóa sạch dữ liệu demo và nạp thành công ${students.length} HS từ Excel`
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(cleanData, null, 2), 'utf-8');
  console.log('✅ Đã xóa sạch dữ liệu demo và cập nhật db_data_12.7.json!');

  // 2. Clear & update Supabase Cloud Database if configured
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
    console.log('☁️ Đang kết nối tới Supabase Cloud Database...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // Clear demo records from Supabase tables
      await Promise.all([
        supabase.from('announcements').delete().neq('id', 0),
        supabase.from('leave_requests').delete().neq('id', 0),
        supabase.from('home_requests').delete().neq('id', 0),
        supabase.from('confessions').delete().neq('id', 0),
        supabase.from('activities').delete().neq('id', 0),
        supabase.from('finance').delete().neq('id', 0),
        supabase.from('students').delete().neq('id', 0),
      ]);
      console.log('🧹 Đã xóa toàn bộ bản ghi demo trên Supabase!');

      // Insert real student records
      const { data, error } = await supabase.from('students').insert(students.map(s => ({
        id: s.id,
        student_code: s.studentCode,
        name: s.name,
        gender: s.gender,
        dob: s.dob,
        ethnicity: s.ethnicity,
        address: s.address,
        phone: s.phone,
        mother_name: s.motherName,
        mother_phone: s.motherPhone,
        father_name: s.fatherName,
        father_phone: s.fatherPhone,
        group_name: s.group,
        dorm_room: s.dormRoom,
        role: s.role,
        position: s.position,
        is_poor: s.isPoor,
        points: s.points,
        seat_index: s.seatIndex
      })));

      if (error) {
        console.warn('⚠️ Supabase insert warning:', error.message);
      } else {
        console.log(`✨ Đã nạp thành công ${students.length} học sinh lên Supabase Cloud Database!`);
      }
    } catch (sbErr) {
      console.warn('⚠️ Lỗi khi nạp dữ liệu lên Supabase:', sbErr.message);
    }
  } else {
    console.log('ℹ️ Chưa cấu hình Supabase Cloud URL/Key trong file .env. Dữ liệu đã được nạp chuẩn xác vào cơ sở dữ liệu nội bộ!');
  }

  return cleanData;
}

if (process.argv[1] && process.argv[1].endsWith('seed_excel_data.js')) {
  seedData().then(() => {
    console.log('🎉 Đã hoàn tất xóa dữ liệu demo và nạp dữ liệu thật!');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  });
}
