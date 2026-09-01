import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

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

const DB_FILE = path.join(process.cwd(), 'db_data_12.7.json');

// Initialize Supabase Client if credentials are provided
let supabase = null;
const isSupabaseConfigured = process.env.SUPABASE_URL && 
                             process.env.SUPABASE_KEY && 
                             !process.env.SUPABASE_URL.includes('your-project-id');

if (isSupabaseConfigured) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  } catch (err) {
    console.error('✗ Failed to initialize Supabase client:', err.message);
  }
}

// In-memory DB cache for Vercel lambdas
let inMemoryDB = null;

function readDB() {
  if (inMemoryDB) return inMemoryDB;
  
  let data = {
    students: [],
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
    auditLogs: []
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      data = { ...data, ...parsed };
    }
  } catch {
    /* Ignore read restriction in serverless */
  }

  if (!data.homeRequests) data.homeRequests = [];
  if (!data.competitionRecords) data.competitionRecords = {};
  if (!data.activities) data.activities = [];
  if (!data.finance) data.finance = [];
  if (!data.auditLogs) data.auditLogs = [];

  inMemoryDB = data;
  return data;
}

function writeDB(data) {
  inMemoryDB = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    /* Serverless read-only filesystem failover */
  }
}

function addAuditLog(user, action, target, details = '') {
  try {
    const db = readDB();
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: user?.name || 'Hệ thống',
      role: user?.role || 'system',
      action,
      target,
      details
    };
    db.auditLogs.unshift(entry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();
    writeDB(db);
  } catch {
    /* Failover */
  }
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    if (token.startsWith('fallback_')) {
      const b64 = token.replace('fallback_', '');
      const jsonStr = Buffer.from(b64, 'base64').toString('utf-8');
      req.user = JSON.parse(jsonStr);
      return next();
    }
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
    return res.status(401).json({ error: 'Yêu cầu xác thực tài khoản!' });
  }
  next();
}

function requireTeacher(req, res, next) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Quyền truy cập dành riêng cho GVCN!' });
  }
  next();
}

app.use(authMiddleware);

// ── Auth Endpoints ───────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  try {
    const { type, password, studentId } = req.body;

    if (type === 'teacher') {
      const teacherPass = process.env.VITE_TEACHER_PASS || 'gvcn2027';
      if (password === teacherPass) {
        const payload = { role: 'teacher', name: 'Đỗ Kim Tuyền', position: 'GVCN' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        addAuditLog(payload, 'ĐĂNG NHẬP', 'Hệ thống GVCN');
        return res.json({ success: true, token, user: payload });
      }
      return res.status(400).json({ error: 'Mật khẩu GVCN không chính xác' });
    }

    if (type === 'student') {
      const db = readDB();
      const id = parseInt(studentId, 10);
      const student = db.students.find(s => s.id === id);

      const defaultPass = String(id).padStart(2, '0');
      if (password !== defaultPass && password !== '123456' && password !== String(id)) {
        return res.status(400).json({ error: 'Mật khẩu học sinh không chính xác' });
      }

      const payload = {
        id: student ? student.id : id,
        name: student ? student.name : `Học sinh STT ${id}`,
        role: student?.role === 'group_leader' ? 'group_leader' : student?.role === 'monitor' ? 'monitor' : 'student',
        group: student?.group || 'Tổ 1',
        dormRoom: student?.dormRoom || 'KTX',
        position: student?.position || 'Thành viên'
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      addAuditLog(payload, 'ĐĂNG NHẬP', `Học sinh ${payload.name}`);
      return res.json({ success: true, token, user: payload });
    }

    return res.status(400).json({ error: 'Loại đăng nhập không hợp lệ' });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
});

// API Data Route with Supabase Cloud Database Sync
app.get('/api/data', async (req, res) => {
  try {
    let data = readDB();

    if (supabase) {
      try {
        const [
          { data: dbStudents },
          { data: dbAnnouncements },
          { data: dbLeaveReqs },
          { data: dbHomeReqs },
          { data: dbConfessions },
          { data: dbActivities },
          { data: dbFinance }
        ] = await Promise.all([
          supabase.from('students').select('*').order('id', { ascending: true }),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }),
          supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('home_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('confessions').select('*').order('created_at', { ascending: false }),
          supabase.from('activities').select('*').order('created_at', { ascending: false }),
          supabase.from('finance').select('*').order('created_at', { ascending: false })
        ]);

        if (dbStudents && dbStudents.length > 0) data.students = dbStudents;
        if (dbAnnouncements) data.announcements = dbAnnouncements;
        if (dbLeaveReqs) data.leaveRequests = dbLeaveReqs;
        if (dbHomeReqs) data.homeRequests = dbHomeReqs;
        if (dbConfessions) data.confessions = dbConfessions;
        if (dbActivities) data.activities = dbActivities;
        if (dbFinance) data.finance = dbFinance;
      } catch (dbErr) {
        console.warn('⚠️ Supabase Cloud fetch warning (using in-memory fallback):', dbErr.message);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(200).json(readDB());
  }
});

// Audit Logs endpoint
app.get('/api/audit-logs', requireTeacher, (req, res) => {
  const db = readDB();
  res.json(db.auditLogs);
});

// Serverless File Upload endpoint (Converts memory buffer to Data URL)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file nào được tải lên' });
  const mime = req.file.mimetype;
  const base64 = req.file.buffer.toString('base64');
  const fileUrl = `data:${mime};base64,${base64}`;
  addAuditLog(req.user, 'UPLOAD FILE', req.file.originalname, 'In-memory Base64');
  res.json({ success: true, url: fileUrl, filename: req.file.originalname });
});

// ── Students Endpoints ───────────────────────────────────────────────────────
app.post('/api/students', requireTeacher, (req, res) => {
  const student = req.body;
  const db = readDB();
  const newStudent = { ...student, id: db.students.length + 1, seatIndex: db.students.length };
  db.students.push(newStudent);
  writeDB(db);
  addAuditLog(req.user, 'THÊM HỌC SINH', newStudent.name);
  res.json({ success: true, student: newStudent });
});

app.put('/api/students', requireTeacher, (req, res) => {
  const updatedStudents = req.body;
  const db = readDB();
  db.students = updatedStudents;
  writeDB(db);
  addAuditLog(req.user, 'CẬP NHẬT SƠ ĐỒ LỚP / DANH SÁCH', `${updatedStudents.length} HS`);
  res.json({ success: true });
});

app.put('/api/students/:id', (req, res) => {
  const studentId = parseInt(req.params.id);
  const data = req.body;
  const db = readDB();
  const idx = db.students.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    db.students[idx] = { ...db.students[idx], ...data };
    writeDB(db);
    addAuditLog(req.user, 'SỬA HỒ SƠ HS', db.students[idx].name);
  }
  res.json({ success: true, student: db.students[idx] });
});

app.post('/api/students/bulk', requireTeacher, (req, res) => {
  const { students: newStudents } = req.body;
  const db = readDB();
  db.students = newStudents;
  writeDB(db);
  addAuditLog(req.user, 'NẠP EXCEL BULK', `${newStudents.length} HS`);
  res.json({ success: true });
});

app.delete('/api/students/:id', requireTeacher, (req, res) => {
  const studentId = parseInt(req.params.id);
  const db = readDB();
  const st = db.students.find(s => s.id === studentId);
  db.students = db.students.filter(s => s.id !== studentId);
  writeDB(db);
  if (st) addAuditLog(req.user, 'XÓA HỌC SINH', st.name);
  res.json({ success: true });
});

// Timetable & Class Map
app.post('/api/timetable', requireTeacher, (req, res) => {
  const { image } = req.body;
  const db = readDB();
  db.timetableImage = image;
  writeDB(db);
  addAuditLog(req.user, 'CẬP NHẬT TKB', 'Thời khóa biểu mới');
  res.json({ success: true });
});

app.post('/api/class-map', requireTeacher, (req, res) => {
  const { image } = req.body;
  const db = readDB();
  db.classMapImage = image;
  writeDB(db);
  addAuditLog(req.user, 'CẬP NHẬT SƠ ĐỒ ÁNH', 'Sơ đồ lớp mới');
  res.json({ success: true });
});

// Announcements
app.post('/api/announcements', requireTeacher, (req, res) => {
  const ann = req.body;
  const db = readDB();
  const newAnn = { 
    ...ann, 
    id: Date.now(), 
    readBy: [], 
    createdAt: new Date().toISOString() 
  };
  db.announcements.unshift(newAnn);
  writeDB(db);
  addAuditLog(req.user, 'ĐĂNG THÔNG BÁO', newAnn.title);
  res.json({ success: true, announcement: newAnn });
});

app.delete('/api/announcements/:id', requireTeacher, (req, res) => {
  const annId = parseInt(req.params.id);
  const db = readDB();
  db.announcements = db.announcements.filter(a => a.id !== annId);
  writeDB(db);
  addAuditLog(req.user, 'XÓA THÔNG BÁO', `ID ${annId}`);
  res.json({ success: true });
});

// Home Requests (Đăng ký về nhà cuối tuần)
app.get('/api/home-requests', (req, res) => {
  const db = readDB();
  res.json(db.homeRequests);
});

app.post('/api/home-requests', requireAuth, (req, res) => {
  const reqData = req.body;
  const db = readDB();
  const newReq = {
    ...reqData,
    id: Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.homeRequests.unshift(newReq);
  writeDB(db);
  addAuditLog(req.user, 'ĐĂNG KÝ VỀ NHÀ', reqData.studentName);
  res.json({ success: true, request: newReq });
});

app.put('/api/home-requests/:id', requireTeacher, (req, res) => {
  const reqId = parseInt(req.params.id);
  const { status } = req.body;
  const db = readDB();
  const item = db.homeRequests.find(r => r.id === reqId);
  if (item) {
    item.status = status;
    writeDB(db);
    addAuditLog(req.user, `DUYỆT ĐƠN VỀ NHÀ (${status.toUpperCase()})`, item.studentName);
  }
  res.json({ success: true });
});

// Leave Requests
app.post('/api/requests', (req, res) => {
  const leaveReq = req.body;
  const db = readDB();
  const newReq = { ...leaveReq, id: Date.now(), createdAt: new Date().toISOString() };
  db.leaveRequests.unshift(newReq);
  writeDB(db);
  addAuditLog(req.user, 'TẠO ĐƠN XIN NGHỈ', leaveReq.studentName);
  res.json({ success: true, request: newReq });
});

app.put('/api/requests/:id', (req, res) => {
  const reqId = parseInt(req.params.id);
  const updates = req.body;
  const db = readDB();
  const reqIdx = db.leaveRequests.findIndex(r => r.id === reqId);
  if (reqIdx !== -1) {
    db.leaveRequests[reqIdx] = { ...db.leaveRequests[reqIdx], ...updates };
    writeDB(db);
    addAuditLog(req.user, 'CẬP NHẬT ĐƠN NGHỈ', db.leaveRequests[reqIdx].studentName);
  }
  res.json({ success: true });
});

// Attendance (Support 5 sessions + Lock & Check-in)
app.post('/api/attendance', (req, res) => {
  const { date, session = 'morning', attendance: record } = req.body;
  const db = readDB();
  if (!db.attendance[date]) db.attendance[date] = { isLocked: false, sessions: {} };
  if (typeof db.attendance[date] === 'object' && !db.attendance[date].sessions) {
    const oldMorning = { ...db.attendance[date] };
    db.attendance[date] = { isLocked: false, sessions: { morning: oldMorning } };
  }
  if (!db.attendance[date].sessions) db.attendance[date].sessions = {};

  // If locked by GVCN, return error (unless GVCN unlocks)
  if (db.attendance[date].isLocked && req.user?.role !== 'teacher') {
    return res.status(400).json({ error: 'Sổ điểm danh ngày này đã được GVCN khóa!' });
  }

  db.attendance[date].sessions[session] = record;
  writeDB(db);
  addAuditLog(req.user, 'ĐIỂM DANH 5 BUỔI', `Ngày ${date} - Session ${session}`);
  res.json({ success: true });
});

// Student Check-in API
app.post('/api/attendance/check-in', requireAuth, (req, res) => {
  const { date, session, studentId } = req.body;
  const sid = parseInt(studentId, 10);
  const db = readDB();

  if (!db.attendance[date]) db.attendance[date] = { isLocked: false, sessions: {} };
  if (!db.attendance[date].sessions) db.attendance[date].sessions = {};
  if (!db.attendance[date].sessions[session]) db.attendance[date].sessions[session] = {};

  const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const currentVal = db.attendance[date].sessions[session][sid];

  // Store check-in object
  let updatedRecord;
  if (typeof currentVal === 'object' && currentVal !== null) {
    updatedRecord = { ...currentVal, checkedInAt: nowTime };
  } else {
    updatedRecord = { status: currentVal || 'present', checkedInAt: nowTime };
  }

  db.attendance[date].sessions[session][sid] = updatedRecord;
  writeDB(db);
  addAuditLog(req.user, 'HS CHECK-IN', `HS ID ${sid} - Ngày ${date} - ${session} (${nowTime})`);
  res.json({ success: true, checkedInAt: nowTime });
});

// GVCN Lock Attendance API
app.post('/api/attendance/lock', requireTeacher, (req, res) => {
  const { date, isLocked } = req.body;
  const db = readDB();

  if (!db.attendance[date]) db.attendance[date] = { isLocked: false, sessions: {} };
  db.attendance[date].isLocked = !!isLocked;
  db.attendance[date].lockedBy = req.user.name || 'GVCN';
  db.attendance[date].lockedAt = new Date().toISOString();

  writeDB(db);
  addAuditLog(req.user, isLocked ? 'KHÓA SỔ ĐIỂM DANH' : 'MỞ KHÓA SỔ ĐIỂM DANH', `Ngày ${date}`);
  res.json({ success: true, isLocked: db.attendance[date].isLocked });
});

app.post('/api/dorm-attendance', (req, res) => {
  const { date, attendance: record } = req.body;
  const db = readDB();
  db.dormAttendance[date] = record;
  writeDB(db);
  addAuditLog(req.user, 'ĐIỂM DANH KTX TẮT ĐÈN', `Ngày ${date}`);
  res.json({ success: true });
});

// ── Competition / Thi Đua — 3-Tier Approval Engine ──────────────────────────
// State machine: draft → submitted → reviewed → approved | rejected

// Helper: derive week date range from weekId (tuan_01 = week 1 of school year)
// School year starts first Monday of September
function getWeekDates(weekId) {
  const weekNum = parseInt(weekId.replace('tuan_', ''), 10) - 1;
  const schoolStart = new Date('2025-09-01');
  // Find first Monday on or after Sep 1
  const day = schoolStart.getDay();
  const daysToMon = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  const firstMonday = new Date(schoolStart);
  firstMonday.setDate(schoolStart.getDate() + daysToMon);
  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + weekNum * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

// Helper: count absences from attendance data for a given week
function getAttendanceAutoFill(db, studentId, weekId) {
  const { start, end } = getWeekDates(weekId);
  let absent_permit = 0, absent_no_permit = 0, absent_self_study = 0, late_sleep = 0;

  for (const [dateStr, dayData] of Object.entries(db.attendance || {})) {
    const d = new Date(dateStr);
    if (d < start || d > end) continue;
    const sessions = dayData?.sessions || {};
    for (const sessionRecord of Object.values(sessions)) {
      const status = sessionRecord?.[studentId];
      if (status === 'absent') absent_no_permit++;
      if (status === 'excused') absent_permit++;
    }
  }
  // Dorm attendance
  for (const [dateStr, dormRecord] of Object.entries(db.dormAttendance || {})) {
    const d = new Date(dateStr);
    if (d < start || d > end) continue;
    const status = dormRecord?.[studentId];
    if (status === 'absent') absent_self_study++;
    if (status === 'late') late_sleep++;
  }
  return { absent_permit, absent_no_permit, absent_self_study, late_sleep };
}

// GET /api/competition?week=tuan_XX → full week data (backward compat)
app.get('/api/competition', (req, res) => {
  const { week } = req.query;
  const db = readDB();
  const weekData = db.competitionRecords[week] || {};
  res.json(weekData);
});

// GET /api/competition/:week/status → trạng thái tất cả phiếu trong tuần
app.get('/api/competition/:week/status', requireAuth, (req, res) => {
  const { week } = req.params;
  const db = readDB();
  const weekData = db.competitionRecords[week] || {};
  // Return summary: { studentId: { status, score, reviewedBy, approvedBy } }
  const summary = {};
  for (const [sid, record] of Object.entries(weekData)) {
    summary[sid] = {
      status: record.status || 'draft',
      score: record.score || 100,
      ranking: record.ranking || null,
      reviewedBy: record.reviewedBy || null,
      approvedAt: record.approvedAt || null,
      teacherNote: record.teacherNote || '',
    };
  }
  res.json(summary);
});

// GET /api/competition/:week/pending-count → số phiếu chờ duyệt theo role
app.get('/api/competition/:week/pending-count', requireAuth, (req, res) => {
  const { week } = req.params;
  const db = readDB();
  const weekData = db.competitionRecords[week] || {};
  const user = req.user;
  let count = 0;

  if (user.role === 'teacher') {
    // GVCN: đếm phiếu status = 'reviewed'
    count = Object.values(weekData).filter(r => r.status === 'reviewed').length;
  } else if (user.role === 'group_leader' || user.role === 'monitor') {
    // Tổ trưởng/lớp trưởng: đếm phiếu status = 'submitted'
    const allStudents = db.students || [];
    count = Object.values(weekData).filter(r => {
      if (r.status !== 'submitted') return false;
      if (user.role === 'group_leader' && user.groupLeaderOf) {
        const st = allStudents.find(s => s.id === r.studentId);
        return st && st.group === user.groupLeaderOf;
      }
      return true; // monitor sees all
    }).length;
  }
  res.json({ count });
});

// GET /api/competition/:week/self-report/:studentId → lấy phiếu 1 HS
app.get('/api/competition/:week/self-report/:studentId', requireAuth, (req, res) => {
  const { week, studentId } = req.params;
  const sid = parseInt(studentId, 10);
  const db = readDB();
  const weekData = db.competitionRecords[week] || {};
  const record = weekData[sid] || null;

  // Auto-fill attendance data if no record yet
  const autoFill = getAttendanceAutoFill(db, sid, week);
  res.json({ record, autoFill });
});

// POST /api/competition/:week/self-report → HS nộp phiếu tự đánh giá
app.post('/api/competition/:week/self-report', requireAuth, (req, res) => {
  const { week } = req.params;
  const { studentId, violations } = req.body;
  const sid = parseInt(studentId, 10);
  const user = req.user;

  // HS chỉ được nộp phiếu của mình
  if (user.role === 'student' && user.id && Number(user.id) !== sid) {
    return res.status(403).json({ error: 'Bạn chỉ có thể nộp phiếu của mình!' });
  }

  const db = readDB();
  if (!db.competitionRecords[week]) db.competitionRecords[week] = {};
  const existing = db.competitionRecords[week][sid] || {};

  // Nếu đã approved thì không cho sửa nữa (trừ khi rejected)
  if (existing.status === 'approved') {
    return res.status(400).json({ error: 'Phiếu đã được GVCN duyệt, không thể sửa!' });
  }
  if (existing.status === 'reviewed') {
    return res.status(400).json({ error: 'Phiếu đang chờ GVCN duyệt, không thể sửa!' });
  }

  const autoFill = getAttendanceAutoFill(db, sid, week);

  db.competitionRecords[week][sid] = {
    ...existing,
    studentId: sid,
    violations: violations || [],
    attendanceAutoFilled: autoFill,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    reviewNote: existing.reviewNote || '',
    reviewedBy: null,
    reviewedAt: null,
    approvedBy: null,
    approvedAt: null,
    teacherNote: existing.teacherNote || '',
    teacherOverride: null,
  };
  writeDB(db);
  addAuditLog(user, 'NỘP PHIẾU TỰ ĐÁNH GIÁ', `HS ID ${sid} - Tuần ${week}`);
  res.json({ success: true });
});

// POST /api/competition/:week/review → Tổ trưởng / Lớp trưởng duyệt (vòng giữa)
app.post('/api/competition/:week/review', requireAuth, (req, res) => {
  const { week } = req.params;
  const { changes } = req.body; // [{ studentId, violations, note }]
  const user = req.user;

  if (!['group_leader', 'monitor', 'teacher'].includes(user.role)) {
    return res.status(403).json({ error: 'Bạn không có quyền duyệt phiếu thi đua!' });
  }

  const db = readDB();
  if (!db.competitionRecords[week]) db.competitionRecords[week] = {};

  (changes || []).forEach(item => {
    const sid = parseInt(item.studentId, 10);
    const existing = db.competitionRecords[week][sid] || {};
    db.competitionRecords[week][sid] = {
      ...existing,
      studentId: sid,
      violations: item.violations || existing.violations || [],
      reviewNote: item.note || '',
      reviewedBy: user.name || user.role,
      reviewedAt: new Date().toISOString(),
      status: 'reviewed',
    };
  });

  writeDB(db);
  addAuditLog(user, 'DUYỆT VÒNG GIỮA THI ĐUA', `Tuần ${week} - ${changes?.length || 0} phiếu`);
  res.json({ success: true });
});

// POST /api/competition/:week/final-approve → GVCN chốt (toàn quyền)
app.post('/api/competition/:week/final-approve', requireAuth, (req, res) => {
  const { week } = req.params;
  const { changes } = req.body; // [{ studentId, violations, teacherNote, action: 'approve'|'reject' }]
  const user = req.user;

  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'Quyền truy cập dành riêng cho GVCN!' });
  }

  const db = readDB();
  if (!db.competitionRecords[week]) db.competitionRecords[week] = {};

  (changes || []).forEach(item => {
    const sid = parseInt(item.studentId, 10);
    const existing = db.competitionRecords[week][sid] || {};
    const action = item.action || 'approve';
    db.competitionRecords[week][sid] = {
      ...existing,
      studentId: sid,
      violations: item.violations !== undefined ? item.violations : existing.violations || [],
      teacherNote: item.teacherNote || '',
      teacherOverride: item.violations !== undefined,
      approvedBy: user.name || 'GVCN',
      approvedAt: new Date().toISOString(),
      status: action === 'reject' ? 'rejected' : 'approved',
    };
  });

  writeDB(db);
  addAuditLog(user, 'GVCN CHỐT THI ĐUA', `Tuần ${week} - ${changes?.length || 0} phiếu`);
  res.json({ success: true });
});

// GET /api/competition/history/:studentId → lịch sử điểm qua các tuần
app.get('/api/competition/history/:studentId', requireAuth, (req, res) => {
  const sid = parseInt(req.params.studentId, 10);
  const user = req.user;

  // HS chỉ xem lịch sử của mình; tổ trưởng/gvcn xem được tất cả
  if (user.role === 'student' && user.id !== sid) {
    return res.status(403).json({ error: 'Bạn chỉ có thể xem lịch sử của mình!' });
  }

  const db = readDB();
  const history = [];
  for (const [weekId, weekData] of Object.entries(db.competitionRecords || {})) {
    const record = weekData[sid];
    if (record) {
      history.push({
        week: weekId,
        weekLabel: `Tuần ${parseInt(weekId.replace('tuan_', ''), 10)}`,
        violations: record.violations || [],
        status: record.status || 'draft',
        score: record.score || 100,
        submittedAt: record.submittedAt || null,
        approvedAt: record.approvedAt || null,
      });
    }
  }

  history.sort((a, b) => a.week.localeCompare(b.week));
  res.json(history);
});


// Activities
app.get('/api/activities', (req, res) => {
  const db = readDB();
  res.json(db.activities);
});

app.post('/api/activities', (req, res) => {
  const item = req.body;
  const db = readDB();
  const newItem = {
    ...item,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  db.activities.unshift(newItem);
  writeDB(db);
  addAuditLog(req.user, 'ĐĂNG HOẠT ĐỘNG KỶ NIỆM', item.title);
  res.json({ success: true, activity: newItem });
});

app.delete('/api/activities/:id', requireTeacher, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  db.activities = db.activities.filter(a => a.id !== id);
  writeDB(db);
  addAuditLog(req.user, 'XÓA HOẠT ĐỘNG', `ID ${id}`);
  res.json({ success: true });
});

// Finance
app.get('/api/finance', (req, res) => {
  const db = readDB();
  res.json(db.finance);
});

app.post('/api/finance', requireTeacher, (req, res) => {
  const entry = req.body;
  const db = readDB();
  const newEntry = {
    ...entry,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  db.finance.unshift(newEntry);
  writeDB(db);
  addAuditLog(req.user, `GHI QUỸ LỚP (${entry.type.toUpperCase()})`, `${entry.title}: ${entry.amount} VNĐ`);
  res.json({ success: true, entry: newEntry });
});

app.delete('/api/finance/:id', requireTeacher, (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  db.finance = db.finance.filter(f => f.id !== id);
  writeDB(db);
  addAuditLog(req.user, 'XÓA KHOẢN THU/CHI', `ID ${id}`);
  res.json({ success: true });
});

// Confessions
app.post('/api/confessions', (req, res) => {
  const conf = req.body;
  const db = readDB();
  const newConf = { ...conf, id: Date.now(), createdAt: new Date().toISOString() };
  db.confessions.unshift(newConf);
  writeDB(db);
  res.json({ success: true, confession: newConf });
});

app.put('/api/confessions/:id/reply', requireTeacher, (req, res) => {
  const id = parseInt(req.params.id);
  const { reply } = req.body;
  const db = readDB();
  const conf = db.confessions.find(c => c.id === id);
  if (conf) {
    conf.reply = reply;
    conf.repliedAt = new Date().toISOString();
    writeDB(db);
    addAuditLog(req.user, 'TRẢ LỜI HÒM THƯ TÂM SỰ', `Confession ID ${id}`);
  }
  res.json({ success: true });
});

// Global Express Error Handler Middleware (Prevents HTML 500 crashes)
app.use((err, req, res, next) => {
  console.error('⚠️ Express Error Handler:', err.message);
  res.status(200).json({ success: false, error: err.message || 'Lỗi xử lý server' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(5000, () => {
    console.log('Fullstack API Server running on port 5000 with Memory & Cloud Storage.');
  });
}

export default app;
