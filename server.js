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

// Attendance (Support 5 sessions)
app.post('/api/attendance', (req, res) => {
  const { date, session = 'morning', attendance: record } = req.body;
  const db = readDB();
  if (!db.attendance[date]) db.attendance[date] = {};
  if (typeof db.attendance[date] === 'object' && !db.attendance[date].sessions) {
    const oldMorning = { ...db.attendance[date] };
    db.attendance[date] = { sessions: { morning: oldMorning } };
  }
  if (!db.attendance[date].sessions) db.attendance[date].sessions = {};
  db.attendance[date].sessions[session] = record;
  writeDB(db);
  addAuditLog(req.user, 'ĐIỂM DANH 5 BUỔI', `Ngày ${date} - Session ${session}`);
  res.json({ success: true });
});

app.post('/api/dorm-attendance', (req, res) => {
  const { date, attendance: record } = req.body;
  const db = readDB();
  db.dormAttendance[date] = record;
  writeDB(db);
  addAuditLog(req.user, 'ĐIỂM DANH KTX TẮT ĐÈN', `Ngày ${date}`);
  res.json({ success: true });
});

// Competition Engine Endpoints
app.get('/api/competition', (req, res) => {
  const { week } = req.query;
  const db = readDB();
  const weekData = db.competitionRecords[week] || {};
  res.json(weekData);
});

app.post('/api/competition', (req, res) => {
  const { weekId, studentId, violations } = req.body;
  const db = readDB();
  if (!db.competitionRecords[weekId]) db.competitionRecords[weekId] = {};
  
  db.competitionRecords[weekId][studentId] = {
    studentId,
    violations,
    status: 'draft',
    updatedAt: new Date().toISOString()
  };
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/competition/:weekId/approve', (req, res) => {
  const { weekId } = req.params;
  const { changes } = req.body;
  const db = readDB();
  if (!db.competitionRecords[weekId]) db.competitionRecords[weekId] = {};

  (changes || []).forEach(item => {
    db.competitionRecords[weekId][item.studentId] = {
      ...db.competitionRecords[weekId][item.studentId],
      violations: item.violations,
      status: item.status || 'approved',
      approvedAt: new Date().toISOString()
    };
  });
  writeDB(db);
  addAuditLog(req.user, 'DUYỆT THI ĐỦA', `Tuần ${weekId}`);
  res.json({ success: true });
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
