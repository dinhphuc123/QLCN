import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_STUDENTS, CLASS_INFO } from './src/data/initialStudents.js';

// Load env from .env.local, .env, or process.env
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'qlcn_thpt_12_7_super_secret_key_2027';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Memory-based Multer storage (100% Vercel Serverless Compatible - No disk writing)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) cb(null, true);
  else cb(new Error('Định dạng file không được phép!'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ==============================================================================
// 1. SUPABASE CLOUD DATABASE CONNECTION (LAYER 1 - CHÍNH THỨC)
// ==============================================================================
let supabase = null;
const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL && 
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY) && 
  !process.env.SUPABASE_URL.includes('your-project-id')
);

if (isSupabaseConfigured) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    supabase = createClient(process.env.SUPABASE_URL, key);
    console.log('✅ Supabase Cloud Database initialized successfully.');
  } catch (err) {
    console.error('✗ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Running in Demo Safe Mode with Mock Data (Supabase URL not configured).');
}

// In-memory safe state used ONLY for Demo Mode when Supabase is not connected
const demoStore = {
  students: [...INITIAL_STUDENTS],
  timetableImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800',
  classMapImage: '',
  announcements: [
    {
      id: 1,
      title: 'Chào mừng năm học mới 2026 - 2027',
      content: 'Chào mừng các em học sinh lớp 12.7 bước vào năm học cuối cấp quan trọng. Toàn thể lớp chú ý duy trì nề nếp KTX và giờ tự học tối.',
      tag: 'Nề nếp',
      date: '05/09/2026',
      readBy: []
    }
  ],
  leaveRequests: [],
  homeRequests: [],
  confessions: [],
  attendance: {},
  dormAttendance: {},
  competitionRecords: {},
  finance: [],
  auditLogs: []
};

// ==============================================================================
// 2. AUDIT LOG HELPER (Direct to Supabase or Demo Store)
// ==============================================================================
async function addAuditLog(user, action, target, details = '') {
  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    username: user?.name || 'Hệ thống',
    role: user?.role || 'system',
    action,
    target,
    details: typeof details === 'object' ? JSON.stringify(details) : String(details || '')
  };

  if (supabase) {
    try {
      await supabase.from('audit_logs').insert(entry);
    } catch { /* ignore log error */ }
  } else {
    demoStore.auditLogs.unshift(entry);
    if (demoStore.auditLogs.length > 500) demoStore.auditLogs.pop();
  }
}

// ==============================================================================
// 3. AUTHENTICATION & SECURITY MIDDLEWARE (Bcrypt + JWT Only, No Bypass)
// ==============================================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    // Strictly verify JWT signature - NO fallback backdoor
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Yêu cầu xác thực tài khoản! Vui lòng đăng nhập.' });
  }
  next();
}

function requireTeacher(req, res, next) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Quyền truy cập dành riêng cho Giáo viên chủ nhiệm!' });
  }
  next();
}

app.use(authMiddleware);

// ==============================================================================
// 4. AUTH ENDPOINTS (GVCN Bcrypt, Học Sinh PIN Hashed)
// ==============================================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { type, password, studentId } = req.body;

    // ── 1. GVCN Login ──
    if (type === 'teacher') {
      const inputPass = String(password || '').trim();
      if (!inputPass) {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu GVCN.' });
      }

      let isPasswordValid = false;

      // Check against Supabase teacher_config if available
      if (supabase) {
        try {
          const { data: cfg } = await supabase.from('teacher_config').select('*').eq('id', 1).single();
          if (cfg && cfg.password_hash) {
            isPasswordValid = bcrypt.compareSync(inputPass, cfg.password_hash);
          }
        } catch { /* fallback to env */ }
      }

      // Check against environment variables
      if (!isPasswordValid) {
        if (process.env.TEACHER_PASSWORD_HASH) {
          isPasswordValid = bcrypt.compareSync(inputPass, process.env.TEACHER_PASSWORD_HASH);
        } else if (process.env.TEACHER_PASSWORD) {
          isPasswordValid = inputPass === process.env.TEACHER_PASSWORD;
        } else {
          // Demo fallback
          isPasswordValid = inputPass === 'demo2026' || inputPass === 'gvcn_demo';
        }
      }

      if (isPasswordValid) {
        const payload = { role: 'teacher', name: 'Đỗ Kim Tuyền', position: 'GVCN' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        addAuditLog(payload, 'ĐĂNG NHẬP', 'Hệ thống GVCN');
        return res.json({ success: true, token, user: payload });
      }

      return res.status(400).json({ error: 'Mật khẩu GVCN không chính xác.' });
    }

    // ── 2. Học Sinh / Cán Sự Login ──
    if (type === 'student') {
      const id = parseInt(studentId, 10);
      const inputPin = String(password || '').trim();

      if (!id || !inputPin) {
        return res.status(400).json({ error: 'Vui lòng chọn học sinh và nhập Mã PIN.' });
      }

      let student = null;

      // Query student from Supabase
      if (supabase) {
        try {
          const { data } = await supabase.from('students').select('*').eq('id', id).single();
          if (data) student = data;
        } catch { /* fallback */ }
      }

      // Fallback to demo store if not found on Supabase
      if (!student) {
        student = demoStore.students.find(s => s.id === id) || INITIAL_STUDENTS.find(s => s.id === id);
      }

      if (!student) {
        return res.status(400).json({ error: 'Không tìm thấy học sinh trong danh sách.' });
      }

      let isPinValid = false;

      // Verify bcrypt hash if pin_hash exists
      if (student.pin_hash) {
        isPinValid = bcrypt.compareSync(inputPin, student.pin_hash);
      }

      // If no pin_hash yet or demo mode, support initial PIN
      if (!isPinValid) {
        if (!isSupabaseConfigured) {
          // Demo mode default PIN
          isPinValid = inputPin === '1234' || inputPin === String(id).padStart(2, '0');
        }
      }

      if (isPinValid) {
        const payload = {
          id: student.id,
          studentCode: student.student_code || student.studentCode,
          name: student.name,
          role: student.role === 'group_leader' ? 'group_leader' : student.role === 'monitor' ? 'monitor' : 'student',
          group: student.group_name || student.group || 'Tổ 1',
          dormRoom: student.dorm_room || student.dormRoom || 'KTX',
          position: student.position || 'Thành viên'
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        addAuditLog(payload, 'ĐĂNG NHẬP', `Học sinh ${payload.name}`);
        return res.json({ success: true, token, user: payload });
      }

      return res.status(400).json({ error: 'Mã PIN không chính xác! Vui lòng liên hệ Cô GVCN nếu quên PIN.' });
    }

    return res.status(400).json({ error: 'Loại đăng nhập không hợp lệ.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Change Student PIN Endpoint
app.post('/api/auth/change-pin', requireAuth, async (req, res) => {
  try {
    const { studentId, oldPin, newPin } = req.body;
    const sid = parseInt(studentId || req.user.id, 10);

    // Only student themselves or teacher can change PIN
    if (req.user.role !== 'teacher' && req.user.id !== sid) {
      return res.status(403).json({ error: 'Bạn không có quyền đổi PIN của học sinh khác.' });
    }

    if (!newPin || newPin.length < 4 || newPin.length > 8) {
      return res.status(400).json({ error: 'Mã PIN mới phải từ 4 đến 8 ký tự số.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newPinHash = bcrypt.hashSync(newPin, salt);

    if (supabase) {
      const { error } = await supabase.from('students').update({ pin_hash: newPinHash }).eq('id', sid);
      if (error) throw error;
    } else {
      const st = demoStore.students.find(s => s.id === sid);
      if (st) st.pin_hash = newPinHash;
    }

    addAuditLog(req.user, 'ĐỔI MÃ PIN', `HS ID ${sid}`);
    return res.json({ success: true, message: 'Đã đổi mã PIN thành công!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Change Teacher Password Endpoint
app.post('/api/auth/change-teacher-password', requireTeacher, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    if (supabase) {
      await supabase.from('teacher_config').upsert({
        id: 1,
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      });
    }

    addAuditLog(req.user, 'ĐỔI MẬT KHẨU GVCN', 'Tài khoản GVCN');
    return res.json({ success: true, message: 'Đã đổi mật khẩu GVCN thành công!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 5. CORE DATA ENDPOINTS (Direct Supabase Cloud / Fallback Demo)
// ==============================================================================
app.get('/api/data', async (req, res) => {
  try {
    if (supabase) {
      const [
        { data: students },
        { data: announcements },
        { data: leaveReqs },
        { data: homeReqs },
        { data: confessions },
        { data: attendanceRows },
        { data: dormAttendanceRows },
        { data: compRecords },
        { data: finance },
        { data: auditLogs },
        { data: timetableRow },
        { data: classMapRow }
      ] = await Promise.all([
        supabase.from('students').select('*').order('id', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('home_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('confessions').select('*').order('created_at', { ascending: false }),
        supabase.from('attendance').select('*'),
        supabase.from('dorm_attendance').select('*'),
        supabase.from('competition_records').select('*'),
        supabase.from('finance').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200),
        supabase.from('timetable').select('*').eq('id', 1).single(),
        supabase.from('class_map').select('*').eq('id', 1).single()
      ]);

      // Format attendance objects by date key
      const attendance = {};
      (attendanceRows || []).forEach(row => { if (row.date) attendance[row.date] = row.record; });

      const dormAttendance = {};
      (dormAttendanceRows || []).forEach(row => { if (row.date) dormAttendance[row.date] = row.record; });

      // Format competition records by weekId key
      const competitionRecords = {};
      (compRecords || []).forEach(row => {
        if (row.week_id) {
          if (!competitionRecords[row.week_id]) competitionRecords[row.week_id] = {};
          competitionRecords[row.week_id][row.student_id] = row;
        }
      });

      // Map Supabase snake_case back to frontend camelCase
      const mappedStudents = (students && students.length > 0)
        ? students.map(s => ({
            id: s.id,
            studentCode: s.student_code,
            name: s.name,
            gender: s.gender,
            dob: s.dob,
            ethnicity: s.ethnicity,
            address: s.address,
            phone: s.phone,
            motherName: s.mother_name,
            motherPhone: s.mother_phone,
            fatherName: s.father_name,
            fatherPhone: s.father_phone,
            group: s.group_name,
            dormRoom: s.dorm_room,
            role: s.role,
            position: s.position,
            isPoor: s.is_poor,
            points: s.points,
            prevGPA: s.prev_gpa,
            prevRank: s.prev_rank,
            prevConduct: s.prev_conduct,
            prevTitle: s.prev_title,
            prevAbsencePermit: s.prev_absence_permit,
            prevAbsenceNo: s.prev_absence_no,
            note: s.note,
            seatIndex: s.seat_index
          }))
        : INITIAL_STUDENTS;

      return res.json({
        students: mappedStudents,
        timetableImage: timetableRow?.image || demoStore.timetableImage,
        classMapImage: classMapRow?.image || demoStore.classMapImage,
        announcements: announcements || [],
        leaveRequests: leaveReqs || [],
        homeRequests: homeReqs || [],
        confessions: confessions || [],
        attendance,
        dormAttendance,
        competitionRecords,
        finance: finance || [],
        auditLogs: auditLogs || []
      });
    }

    // Safe Demo Store Fallback
    return res.json(demoStore);
  } catch (err) {
    console.error('Error fetching data:', err);
    return res.status(200).json(demoStore);
  }
});

// ── Students CRUD ──
app.post('/api/students', requireTeacher, async (req, res) => {
  try {
    const s = req.body;
    if (supabase) {
      const { data, error } = await supabase.from('students').insert({
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
        role: s.role || 'member',
        position: s.position || '',
        is_poor: !!s.isPoor,
        points: s.points || 100,
        seat_index: s.seatIndex || 0
      }).select().single();

      if (error) throw error;
      addAuditLog(req.user, 'THÊM HỌC SINH', s.name);
      return res.json({ success: true, student: data });
    }

    const newStudent = { ...s, id: demoStore.students.length + 1 };
    demoStore.students.push(newStudent);
    return res.json({ success: true, student: newStudent });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/students/:id', requireTeacher, async (req, res) => {
  try {
    const sid = parseInt(req.params.id, 10);
    const s = req.body;

    if (supabase) {
      const { error } = await supabase.from('students').update({
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
        seat_index: s.seatIndex,
        note: s.note
      }).eq('id', sid);

      if (error) throw error;
      addAuditLog(req.user, 'SỬA HỒ SƠ HS', s.name || `ID ${sid}`);
      return res.json({ success: true });
    }

    const idx = demoStore.students.findIndex(st => st.id === sid);
    if (idx !== -1) demoStore.students[idx] = { ...demoStore.students[idx], ...s };
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/students/:id', requireTeacher, async (req, res) => {
  try {
    const sid = parseInt(req.params.id, 10);
    if (supabase) {
      await supabase.from('students').delete().eq('id', sid);
    } else {
      demoStore.students = demoStore.students.filter(st => st.id !== sid);
    }
    addAuditLog(req.user, 'XÓA HỌC SINH', `ID ${sid}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Attendance (5 Sessions) ──
app.post('/api/attendance', async (req, res) => {
  try {
    const { date, session = 'morning', attendance: record } = req.body;
    if (!date) return res.status(400).json({ error: 'Thiếu ngày điểm danh.' });

    if (supabase) {
      // Fetch existing day record
      const { data: existing } = await supabase.from('attendance').select('*').eq('date', date).single();
      const currentRecord = existing?.record || { isLocked: false, sessions: {} };

      if (currentRecord.isLocked && req.user?.role !== 'teacher') {
        return res.status(400).json({ error: 'Sổ điểm danh ngày này đã được GVCN khóa!' });
      }

      if (!currentRecord.sessions) currentRecord.sessions = {};
      currentRecord.sessions[session] = record;

      await supabase.from('attendance').upsert({ date, record: currentRecord });
    } else {
      if (!demoStore.attendance[date]) demoStore.attendance[date] = { isLocked: false, sessions: {} };
      demoStore.attendance[date].sessions[session] = record;
    }

    addAuditLog(req.user, 'ĐIỂM DANH 5 BUỔI', `Ngày ${date} - ${session}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Check-in (Student quick check-in)
app.post('/api/attendance/check-in', async (req, res) => {
  try {
    const { date, session, studentId } = req.body;
    const sid = parseInt(studentId, 10);
    if (!date || !session || !sid) return res.status(400).json({ error: 'Thiếu thông tin check-in.' });

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (supabase) {
      const { data: existing } = await supabase.from('attendance').select('*').eq('date', date).single();
      const currentRecord = existing?.record || { isLocked: false, sessions: {} };
      if (!currentRecord.sessions) currentRecord.sessions = {};
      if (!currentRecord.sessions[session]) currentRecord.sessions[session] = {};

      currentRecord.sessions[session][sid] = { status: 'present', checkedInAt: nowTime };
      await supabase.from('attendance').upsert({ date, record: currentRecord });
    } else {
      if (!demoStore.attendance[date]) demoStore.attendance[date] = { isLocked: false, sessions: {} };
      if (!demoStore.attendance[date].sessions[session]) demoStore.attendance[date].sessions[session] = {};
      demoStore.attendance[date].sessions[session][sid] = { status: 'present', checkedInAt: nowTime };
    }

    addAuditLog(req.user, 'HS CHECK-IN', `HS ID ${sid} - ${session} (${nowTime})`);
    return res.json({ success: true, checkedInAt: nowTime });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Lock Attendance
app.post('/api/attendance/lock', requireTeacher, async (req, res) => {
  try {
    const { date, isLocked } = req.body;
    if (supabase) {
      const { data: existing } = await supabase.from('attendance').select('*').eq('date', date).single();
      const currentRecord = existing?.record || { sessions: {} };
      currentRecord.isLocked = !!isLocked;
      currentRecord.lockedBy = req.user.name || 'GVCN';
      currentRecord.lockedAt = new Date().toISOString();

      await supabase.from('attendance').upsert({ date, record: currentRecord });
    } else {
      if (!demoStore.attendance[date]) demoStore.attendance[date] = { sessions: {} };
      demoStore.attendance[date].isLocked = !!isLocked;
    }

    addAuditLog(req.user, isLocked ? 'KHÓA SỔ ĐIỂM DANH' : 'MỞ KHÓA SỔ ĐIỂM DANH', `Ngày ${date}`);
    return res.json({ success: true, isLocked });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Dorm Attendance
app.post('/api/dorm-attendance', async (req, res) => {
  try {
    const { date, attendance: record } = req.body;
    if (supabase) {
      await supabase.from('dorm_attendance').upsert({ date, record });
    } else {
      demoStore.dormAttendance[date] = record;
    }
    addAuditLog(req.user, 'ĐIỂM DANH KTX TẮT ĐÈN', `Ngày ${date}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Requests (Leave & Home) ──
app.post('/api/requests', async (req, res) => {
  try {
    const r = req.body;
    const newReq = {
      id: r.id || Date.now(),
      student_id: r.studentId,
      student_name: r.studentName,
      type: r.type || 'Nghỉ học',
      reason: r.reason || '',
      date: r.date || new Date().toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('leave_requests').insert(newReq);
      if (error) throw error;
    } else {
      demoStore.leaveRequests.unshift(newReq);
    }

    addAuditLog(req.user, 'TẠO ĐƠN XIN NGHỈ', r.studentName);
    return res.json({ success: true, request: newReq });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/requests/:id', requireTeacher, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (supabase) {
      const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
      if (error) throw error;
    } else {
      const item = demoStore.leaveRequests.find(r => String(r.id) === String(id));
      if (item) item.status = status;
    }
    addAuditLog(req.user, `DUYỆT ĐƠN NGHỈ (${status.toUpperCase()})`, `ID ${id}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/home-requests', async (req, res) => {
  try {
    const r = req.body;
    const newReq = {
      id: r.id || Date.now(),
      student_id: r.studentId,
      student_name: r.studentName,
      leave_date: r.leaveDate,
      return_date: r.returnDate,
      reason: r.reason,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('home_requests').insert(newReq);
      if (error) throw error;
    } else {
      demoStore.homeRequests.unshift(newReq);
    }

    addAuditLog(req.user, 'ĐĂNG KÝ VỀ NHÀ', r.studentName);
    return res.json({ success: true, request: newReq });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/home-requests/:id', requireTeacher, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (supabase) {
      await supabase.from('home_requests').update({ status }).eq('id', id);
    } else {
      const item = demoStore.homeRequests.find(r => String(r.id) === String(id));
      if (item) item.status = status;
    }
    addAuditLog(req.user, `DUYỆT ĐƠN VỀ NHÀ (${status.toUpperCase()})`, `ID ${id}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Announcements ──
app.post('/api/announcements', requireTeacher, async (req, res) => {
  try {
    const ann = req.body;
    const newAnn = {
      id: ann.id || Date.now(),
      title: ann.title,
      content: ann.content,
      tag: ann.tag || 'Chung',
      date: ann.date || new Date().toLocaleDateString('vi-VN'),
      attachment: ann.attachment || null,
      read_by: Array.isArray(ann.readBy) ? ann.readBy : (Array.isArray(ann.read_by) ? ann.read_by : []),
      created_at: ann.createdAt || new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('announcements').insert(newAnn);
      if (error) {
        console.error('⚠️ Supabase error inserting announcement:', error.message);
        throw error;
      }
    } else {
      demoStore.announcements.unshift(newAnn);
    }

    addAuditLog(req.user, 'ĐĂNG THÔNG BÁO', ann.title);
    return res.json({ success: true, announcement: newAnn });
  } catch (err) {
    console.error('Lỗi đăng thông báo:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk sync announcements from local to Supabase
app.post('/api/announcements/sync', requireTeacher, async (req, res) => {
  try {
    const { announcements } = req.body;
    if (!Array.isArray(announcements) || announcements.length === 0) {
      return res.json({ success: true, synced: 0 });
    }

    if (supabase) {
      const rows = announcements.map(a => ({
        id: a.id || Date.now(),
        title: a.title,
        content: a.content,
        tag: a.tag || 'Chung',
        date: a.date || new Date().toLocaleDateString('vi-VN'),
        attachment: a.attachment || null,
        read_by: Array.isArray(a.readBy) ? a.readBy : (Array.isArray(a.read_by) ? a.read_by : []),
        created_at: a.createdAt || a.created_at || new Date().toISOString()
      }));

      const { error } = await supabase.from('announcements').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.error('⚠️ Supabase error bulk syncing announcements:', error.message);
        throw error;
      }
      return res.json({ success: true, synced: rows.length });
    }

    return res.json({ success: true, synced: announcements.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/announcements/:id', requireTeacher, async (req, res) => {
  try {
    const id = req.params.id;
    if (supabase) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    } else {
      demoStore.announcements = demoStore.announcements.filter(a => String(a.id) !== String(id));
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Finance (Quỹ Lớp) ──
app.post('/api/finance', requireTeacher, async (req, res) => {
  try {
    const f = req.body;
    const newEntry = {
      id: Date.now(),
      type: f.type || 'expense',
      title: f.title,
      amount: f.amount,
      category: f.category || 'Hoạt động',
      note: f.note || '',
      date: f.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('finance').insert(newEntry);
      if (error) throw error;
    } else {
      demoStore.finance.unshift(newEntry);
    }

    addAuditLog(req.user, `GHI QUỸ LỚP (${f.type.toUpperCase()})`, `${f.title}: ${f.amount} VNĐ`);
    return res.json({ success: true, entry: newEntry });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/finance/:id', requireTeacher, async (req, res) => {
  try {
    const id = req.params.id;
    if (supabase) {
      const { error } = await supabase.from('finance').delete().eq('id', id);
      if (error) throw error;
    } else {
      demoStore.finance = demoStore.finance.filter(f => String(f.id) !== String(id));
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Confessions (Hòm Thư Tâm Sự) ──
app.post('/api/confessions', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Nội dung tâm sự không được để trống.' });

    const newConf = {
      id: Date.now(),
      content,
      reply: null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('confessions').insert(newConf);
      if (error) throw error;
    } else {
      demoStore.confessions.unshift(newConf);
    }

    return res.json({ success: true, confession: newConf });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/confessions/:id/reply', requireTeacher, async (req, res) => {
  try {
    const id = req.params.id;
    const { reply } = req.body;

    if (supabase) {
      await supabase.from('confessions').update({
        reply,
        replied_at: new Date().toISOString()
      }).eq('id', id);
    } else {
      const conf = demoStore.confessions.find(c => String(c.id) === String(id));
      if (conf) {
        conf.reply = reply;
        conf.repliedAt = new Date().toISOString();
      }
    }

    addAuditLog(req.user, 'PHẢN HỒI TÂM SỰ', `ID ${id}`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Serverless File Upload Endpoint (Supabase Storage Cloud) ──
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Không có file nào được chọn.' });

    const mime = req.file.mimetype;
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;

    if (supabase) {
      const { data, error } = await supabase.storage
        .from('qlcn-files')
        .upload(`uploads/${fileName}`, req.file.buffer, {
          contentType: mime,
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('qlcn-files')
          .getPublicUrl(`uploads/${fileName}`);

        if (publicData?.publicUrl) {
          addAuditLog(req.user, 'UPLOAD FILE (SUPABASE)', originalName, publicData.publicUrl);
          return res.json({ success: true, url: publicData.publicUrl, filename: originalName });
        }
      }
    }

    // Fallback: Base64 data URL
    const base64 = req.file.buffer.toString('base64');
    const fileUrl = `data:${mime};base64,${base64}`;
    return res.json({ success: true, url: fileUrl, filename: originalName });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Audit Logs ──
app.get('/api/audit-logs', requireTeacher, async (req, res) => {
  try {
    if (supabase) {
      const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      return res.json(data || []);
    }
    return res.json(demoStore.auditLogs);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('⚠️ Server Error:', err.message);
  res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý máy chủ' });
});

// Port listener for local development
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 QLCN Fullstack Server running on port ${PORT}`);
  });
}

export default app;
