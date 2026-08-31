// 100% Dynamic Web Application API Layer with JWT Authentication
const BASE = '';

function getToken() {
  try {
    return localStorage.getItem('qlcn_jwt_token') || '';
  } catch {
    return '';
  }
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(BASE + url, { ...options, headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi máy chủ API: ${res.status}`);
  }
  return res.json();
}

async function upload(url, formData) {
  const token = getToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(BASE + url, { method: 'POST', body: formData, headers });
  if (!res.ok) throw new Error(`Lỗi tải file: ${res.status}`);
  return res.json();
}

export const api = {
  // ── Auth & Audit Logs ──────────────────────────────────────────────────
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getAuditLogs: () => request('/api/audit-logs'),
  getData: () => request('/api/data'),

  // ── Students Dynamic CRUD ─────────────────────────────────────────────
  addStudent:     (student)  => request('/api/students', { method: 'POST', body: JSON.stringify(student) }),
  updateStudents: (students) => request('/api/students', { method: 'PUT',  body: JSON.stringify(students) }),
  updateStudent:  (id, data) => request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkImport:     (students) => request('/api/students/bulk', { method: 'POST', body: JSON.stringify({ students }) }),
  deleteStudent:  (id)       => request(`/api/students/${id}`, { method: 'DELETE' }),

  // ── Timetable & Sơ đồ lớp Dynamic Upload ──────────────────────────────
  uploadTimetable:  (image) => request('/api/timetable',  { method: 'POST', body: JSON.stringify({ image }) }),
  uploadClassMap:   (image) => request('/api/class-map',  { method: 'POST', body: JSON.stringify({ image }) }),

  // ── Announcements Dynamic API ──────────────────────────────────────────
  createAnnouncement: (ann) => request('/api/announcements', { method: 'POST', body: JSON.stringify(ann) }),
  updateAnnouncement: (id, data) => request(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markRead:           (id)  => request(`/api/announcements/${id}/read`, { method: 'POST' }),
  deleteAnnouncement: (id)  => request(`/api/announcements/${id}`, { method: 'DELETE' }),

  // ── Leave Requests Dynamic API ─────────────────────────────────────────
  createRequest: (req)      => request('/api/requests', { method: 'POST', body: JSON.stringify(req) }),
  updateRequest: (id, data) => request(`/api/requests/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),

  // ── Home Requests Dynamic API ──────────────────────────────────────────
  createHomeRequest: (req)  => request('/api/home-requests', { method: 'POST', body: JSON.stringify(req) }),
  approveHomeRequest:(id, status) => request(`/api/home-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getHomeRequests:   ()     => request('/api/home-requests'),

  // ── Attendance Dynamic API ─────────────────────────────────────────────
  saveAttendance:     (date, session, record) =>
    request('/api/attendance', { method: 'POST', body: JSON.stringify({ date, session, attendance: record }) }),
  saveDormAttendance: (date, record) =>
    request('/api/dorm-attendance', { method: 'POST', body: JSON.stringify({ date, attendance: record }) }),
  getAttendance:      (date) => request(`/api/attendance?date=${date}`),

  // ── Thi đua Dynamic API ────────────────────────────────────────────────
  getCompetition:       (weekId)  => request(`/api/competition?week=${weekId}`),
  saveCompetitionDraft: (weekId, studentId, violations) =>
    request('/api/competition', { method: 'POST', body: JSON.stringify({ weekId, studentId, violations }) }),
  approveCompetition:   (id, changes) =>
    request(`/api/competition/${id}/approve`, { method: 'PUT', body: JSON.stringify({ changes }) }),

  // ── Activities Dynamic API ────────────────────────────────────────────
  getActivities:    ()       => request('/api/activities'),
  createActivity:   (data)   => request('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
  deleteActivity:   (id)     => request(`/api/activities/${id}`, { method: 'DELETE' }),

  // ── Finance Dynamic API ────────────────────────────────────────────────
  getFinance:    ()           => request('/api/finance'),
  createFinance: (entry)      => request('/api/finance', { method: 'POST', body: JSON.stringify(entry) }),
  deleteFinance: (id)         => request(`/api/finance/${id}`, { method: 'DELETE' }),

  // ── File Upload Dynamic API ────────────────────────────────────────────
  uploadFile: (formData) => upload('/api/upload', formData),

  // ── Confessions Dynamic API ────────────────────────────────────────────
  createConfession: (conf) => request('/api/confessions', { method: 'POST', body: JSON.stringify(conf) }),
  replyConfession:  (id, reply) => request(`/api/confessions/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
};
