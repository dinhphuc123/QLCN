import { INITIAL_STUDENTS } from '../data/initialStudents';

// Centralized API layer with Dual Storage (Backend Server + localStorage Fallback)
const BASE = '';
const DB_KEY = 'qlcn_database_v3';

function getToken() {
  try {
    return localStorage.getItem('qlcn_jwt_token') || '';
  } catch {
    return '';
  }
}

function getLocalDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    students: INITIAL_STUDENTS,
    timetableImage: '',
    classMapImage: '',
    announcements: [
      { id: 1, title: '📢 Chuẩn bị họp Phụ huynh Đầu năm', content: 'Kính mời quý phụ huynh tham dự buổi họp phụ huynh học sinh đầu năm học 2026 - 2027.', createdAt: '2026-08-30', author: 'GVCN Đỗ Kim Tuyền' }
    ],
    leaveRequests: [],
    homeRequests: [],
    confessions: [],
    attendance: {},
    dormAttendance: {},
    activities: [],
    finance: [],
  };
}

function saveLocalDb(data) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch {}
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(BASE + url, { ...options, headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`[API Fallback] Endpoint ${url} unreachable, using local storage:`, e.message);
  }

  // Fallback to local storage if API backend server is disconnected / static deployment
  return handleLocalFallback(url, options);
}

function handleLocalFallback(url, options) {
  const db = getLocalDb();
  const body = options.body ? JSON.parse(options.body) : {};

  if (url === '/api/data') {
    return db;
  }

  if (url === '/api/students' && options.method === 'POST') {
    const newStudent = { id: Date.now(), ...body };
    db.students.push(newStudent);
    saveLocalDb(db);
    return newStudent;
  }

  if (url === '/api/students/bulk' && options.method === 'POST') {
    db.students = body.students || [];
    saveLocalDb(db);
    return { success: true, count: db.students.length };
  }

  if (url.startsWith('/api/students/') && options.method === 'DELETE') {
    const id = parseInt(url.split('/').pop());
    db.students = db.students.filter(s => s.id !== id);
    saveLocalDb(db);
    return { success: true };
  }

  if (url.startsWith('/api/students/') && options.method === 'PUT') {
    const id = parseInt(url.split('/').pop());
    db.students = db.students.map(s => s.id === id ? { ...s, ...body } : s);
    saveLocalDb(db);
    return { success: true };
  }

  if (url === '/api/announcements' && options.method === 'POST') {
    const newAnn = { id: Date.now(), createdAt: new Date().toISOString().split('T')[0], ...body };
    db.announcements.unshift(newAnn);
    saveLocalDb(db);
    return newAnn;
  }

  if (url.startsWith('/api/announcements/') && options.method === 'DELETE') {
    const id = parseInt(url.split('/').pop());
    db.announcements = db.announcements.filter(a => a.id !== id);
    saveLocalDb(db);
    return { success: true };
  }

  if (url === '/api/attendance' && options.method === 'POST') {
    const key = `${body.date}_${body.session || 'morning'}`;
    db.attendance[key] = body.attendance;
    saveLocalDb(db);
    return { success: true };
  }

  if (url === '/api/finance' && options.method === 'POST') {
    const newEntry = { id: Date.now(), date: new Date().toISOString().split('T')[0], ...body };
    db.finance.unshift(newEntry);
    saveLocalDb(db);
    return newEntry;
  }

  if (url.startsWith('/api/finance/') && options.method === 'DELETE') {
    const id = parseInt(url.split('/').pop());
    db.finance = db.finance.filter(f => f.id !== id);
    saveLocalDb(db);
    return { success: true };
  }

  if (url === '/api/activities' && options.method === 'POST') {
    const newAct = { id: Date.now(), ...body };
    db.activities.unshift(newAct);
    saveLocalDb(db);
    return newAct;
  }

  if (url.startsWith('/api/activities/') && options.method === 'DELETE') {
    const id = parseInt(url.split('/').pop());
    db.activities = db.activities.filter(a => a.id !== id);
    saveLocalDb(db);
    return { success: true };
  }

  if (url === '/api/confessions' && options.method === 'POST') {
    const newConf = { id: Date.now(), createdAt: new Date().toISOString().split('T')[0], ...body };
    db.confessions.unshift(newConf);
    saveLocalDb(db);
    return newConf;
  }

  if (url === '/api/requests' && options.method === 'POST') {
    const newReq = { id: Date.now(), status: 'pending', createdAt: new Date().toISOString().split('T')[0], ...body };
    db.leaveRequests.unshift(newReq);
    saveLocalDb(db);
    return newReq;
  }

  if (url.startsWith('/api/requests/') && options.method === 'PUT') {
    const id = parseInt(url.split('/').pop());
    db.leaveRequests = db.leaveRequests.map(r => r.id === id ? { ...r, ...body } : r);
    saveLocalDb(db);
    return { success: true };
  }

  return { success: true };
}

async function upload(url, formData) {
  const token = getToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(BASE + url, { method: 'POST', body: formData, headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`[Upload Fallback] Upload endpoint ${url} unreachable:`, e.message);
  }
  return { success: true, url: '' };
}

export const api = {
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getAuditLogs: () => request('/api/audit-logs'),
  getData: () => request('/api/data'),

  // Students
  addStudent:     (student)  => request('/api/students', { method: 'POST', body: JSON.stringify(student) }),
  updateStudents: (students) => request('/api/students', { method: 'PUT',  body: JSON.stringify(students) }),
  updateStudent:  (id, data) => request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkImport:     (students) => request('/api/students/bulk', { method: 'POST', body: JSON.stringify({ students }) }),
  deleteStudent:  (id)       => request(`/api/students/${id}`, { method: 'DELETE' }),

  // Timetable & Sơ đồ lớp
  uploadTimetable:  (image) => request('/api/timetable',  { method: 'POST', body: JSON.stringify({ image }) }),
  uploadClassMap:   (image) => request('/api/class-map',  { method: 'POST', body: JSON.stringify({ image }) }),

  // Announcements
  createAnnouncement: (ann) => request('/api/announcements', { method: 'POST', body: JSON.stringify(ann) }),
  updateAnnouncement: (id, data) => request(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markRead:           (id)  => request(`/api/announcements/${id}/read`, { method: 'POST' }),
  deleteAnnouncement: (id)  => request(`/api/announcements/${id}`, { method: 'DELETE' }),

  // Leave Requests
  createRequest: (req)      => request('/api/requests', { method: 'POST', body: JSON.stringify(req) }),
  updateRequest: (id, data) => request(`/api/requests/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),

  // Home Requests
  createHomeRequest: (req)  => request('/api/home-requests', { method: 'POST', body: JSON.stringify(req) }),
  approveHomeRequest:(id, status) => request(`/api/home-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getHomeRequests:   ()     => request('/api/home-requests'),

  // Attendance
  saveAttendance:     (date, session, record) =>
    request('/api/attendance', { method: 'POST', body: JSON.stringify({ date, session, attendance: record }) }),
  saveDormAttendance: (date, record) =>
    request('/api/dorm-attendance', { method: 'POST', body: JSON.stringify({ date, attendance: record }) }),
  getAttendance:      (date) => request(`/api/attendance?date=${date}`),

  // Thi đua
  getCompetition:       (weekId)  => request(`/api/competition?week=${weekId}`),
  saveCompetitionDraft: (weekId, studentId, violations) =>
    request('/api/competition', { method: 'POST', body: JSON.stringify({ weekId, studentId, violations }) }),
  approveCompetition:   (id, changes) =>
    request(`/api/competition/${id}/approve`, { method: 'PUT', body: JSON.stringify({ changes }) }),

  // Activities
  getActivities:    ()       => request('/api/activities'),
  createActivity:   (data)   => request('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
  deleteActivity:   (id)     => request(`/api/activities/${id}`, { method: 'DELETE' }),

  // Finance
  getFinance:    ()           => request('/api/finance'),
  createFinance: (entry)      => request('/api/finance', { method: 'POST', body: JSON.stringify(entry) }),
  deleteFinance: (id)         => request(`/api/finance/${id}`, { method: 'DELETE' }),

  // Upload file
  uploadFile: (formData) => upload('/api/upload', formData),

  // Confessions
  createConfession: (conf) => request('/api/confessions', { method: 'POST', body: JSON.stringify(conf) }),
  replyConfession:  (id, reply) => request(`/api/confessions/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
};
