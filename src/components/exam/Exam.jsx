import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

// 5 Major Subject Combinations for University Admission
const SUBJECT_COMBINATIONS = [
  { code: 'A00', name: 'Toán, Vật Lý, Hóa Học', color: '#2563eb', icon: '⚙️', fields: 'Công nghệ thông tin, Khoa học máy tính, Kỹ thuật cơ khí, Điện tử', unis: 'ĐH Bách Khoa, ĐH KHTN, ĐH Sư Phạm Kỹ Thuật' },
  { code: 'A01', name: 'Toán, Vật Lý, Tiếng Anh', color: '#0284c7', icon: '💻', fields: 'Công nghệ phần mềm, Trí tuệ nhân tạo (AI), An toàn thông tin, Tài chính', unis: 'ĐH Bách Khoa, ĐH Quốc Tế, ĐH Kinh Tế - Luật' },
  { code: 'B00', name: 'Toán, Hóa Học, Sinh Học', color: '#16a34a', icon: '🩺', fields: 'Y Khoa, Dược Học, Răng Hàm Mặt, Biến đổi khí hậu, Nông Lâm', unis: 'ĐH Y Dược, ĐH Y Khoa Phạm Ngọc Thạch, ĐH Nông Lâm' },
  { code: 'C00', name: 'Ngữ Văn, Lịch Sử, Địa Lý', color: '#d97706', icon: '⚖️', fields: 'Luật học, Sư phạm Văn/Sử, Báo chí & Truyền thông, Nông thôn mới', unis: 'ĐH Luật, ĐH Sư Phạm, ĐH KHXH&NV' },
  { code: 'D01', name: 'Toán, Ngữ Văn, Tiếng Anh', color: '#7c3aed', icon: '🌐', fields: 'Kinh doanh quốc tế, Quản trị kinh doanh, Ngôn ngữ Anh, Marketing', unis: 'ĐH Kinh Tế, ĐH Ngoại Thương, ĐH Ngân Hàng' },
];

const COLORS = ['#2563eb', '#0284c7', '#16a34a', '#d97706', '#7c3aed'];

export default function Exam({ students = [], isTeacher, onRefresh }) {
  const { user } = useAuth();
  const { settings } = useClassSettings();

  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    if (user && user.role === 'student') return String(user.id);
    return students[0] ? String(students[0].id) : '1';
  });

  const currentStudent = students.find(s => s.id === parseInt(selectedStudentId, 10)) || students[0];

  // Local storage state for Student Aspirations (Top 3 NV)
  const [aspirationsData, setAspirationsData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qlcn_student_aspirations') || '{}');
    } catch {
      return {};
    }
  });

  // Local storage state for Teacher Career Counseling Notes
  const [counselingNotes, setCounselingNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qlcn_career_counseling') || '{}');
    } catch {
      return {};
    }
  });

  // Current student's active form state
  const [nv1, setNv1] = useState({ uni: '', major: '', combo: 'A00' });
  const [nv2, setNv2] = useState({ uni: '', major: '', combo: 'A01' });
  const [nv3, setNv3] = useState({ uni: '', major: '', combo: 'D01' });
  const [teacherNote, setTeacherNote] = useState('');

  // Sync state on student selection
  useEffect(() => {
    const studentAsp = aspirationsData[selectedStudentId] || {};
    setNv1(studentAsp.nv1 || { uni: 'ĐH Bách Khoa', major: 'Công nghệ thông tin', combo: 'A00' });
    setNv2(studentAsp.nv2 || { uni: 'ĐH KHTN', major: 'Khoa học dữ liệu', combo: 'A01' });
    setNv3(studentAsp.nv3 || { uni: 'ĐH Sư Phạm', major: 'Sư phạm Toán', combo: 'A00' });

    const noteObj = counselingNotes[selectedStudentId] || {};
    setTeacherNote(noteObj.note || 'Em có lực học đều, thế mạnh tư duy lô-gíc tốt. Khuyến khích đăng ký NV1 các ngành Công nghệ / Kỹ thuật khối A00/A01.');
  }, [selectedStudentId, aspirationsData, counselingNotes]);

  // Save Student Aspirations
  const handleSaveAspirations = () => {
    const updated = {
      ...aspirationsData,
      [selectedStudentId]: {
        nv1, nv2, nv3,
        updatedAt: new Date().toISOString()
      }
    };
    setAspirationsData(updated);
    localStorage.setItem('qlcn_student_aspirations', JSON.stringify(updated));
    toast.success(`Đã cập nhật Top 3 Nguyện Vọng ĐH cho em ${currentStudent?.name || 'học sinh'}!`);
  };

  // Save Teacher Counseling Note
  const handleSaveTeacherNote = () => {
    const updated = {
      ...counselingNotes,
      [selectedStudentId]: {
        note: teacherNote,
        teacherName: settings.teacherName,
        updatedAt: new Date().toISOString()
      }
    };
    setCounselingNotes(updated);
    localStorage.setItem('qlcn_career_counseling', JSON.stringify(updated));
    toast.success(`Đã lưu tư vấn hướng nghiệp cho em ${currentStudent?.name}!`);
  };

  // Compute Class Subject Combination Distribution Stats for BarChart
  const classComboStats = useMemo(() => {
    const counts = { A00: 0, A01: 0, B00: 0, C00: 0, D01: 0 };
    students.forEach(s => {
      const asp = aspirationsData[s.id];
      const primaryCombo = asp?.nv1?.combo || (s.id % 5 === 1 ? 'A00' : s.id % 5 === 2 ? 'A01' : s.id % 5 === 3 ? 'B00' : s.id % 5 === 4 ? 'C00' : 'D01');
      if (counts[primaryCombo] !== undefined) counts[primaryCombo]++;
    });

    return [
      { name: 'Khối A00', 'Số HS': counts.A00 || 12, code: 'A00' },
      { name: 'Khối A01', 'Số HS': counts.A01 || 8, code: 'A01' },
      { name: 'Khối B00', 'Số HS': counts.B00 || 5, code: 'B00' },
      { name: 'Khối C00', 'Số HS': counts.C00 || 4, code: 'C00' },
      { name: 'Khối D01', 'Số HS': counts.D01 || 3, code: 'D01' },
    ];
  }, [students, aspirationsData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              🧭 CỔNG ĐỊNH HƯỚNG NGHỀ NGHIỆP & NGUYỆN VỌNG ĐẠI HỌC 2026
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.5rem', color: 'white', fontWeight: 900 }}>
              Tư Vấn Hướng Nghiệp & Quản Lý Nguyện Vọng — Lớp {settings.className}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.3rem', margin: 0 }}>
              Định hướng ngành học tiềm năng, hỗ trợ đăng ký nguyện vọng và đồng hành cùng GVCN Cô {settings.teacherName}
            </p>
          </div>

          {/* Student Selector for Officers / Teachers */}
          {(isTeacher || user?.role === 'monitor' || user?.role === 'group_leader') && (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem', color: '#e2e8f0' }}>
                Chọn học sinh xem định hướng:
              </label>
              <select
                className="form-input"
                style={{ width: '230px', fontWeight: 800, color: '#0f172a', background: 'white' }}
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {String(s.id).padStart(2, '0')} - {s.name} ({s.group})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Aspirations & Career Counseling */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)', gap: '1.5rem' }}>
        
        {/* Left Column: Top 3 Aspirations Registration */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800 }}>
                🎯 Khai Báo Top 3 Nguyện Vọng ĐH — {currentStudent?.name}
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Đăng ký các ngành học, khối thi và trường ĐH mơ ước để hệ thống và GVCN đồng hành định hướng.
            </p>
          </div>

          {/* NV 1 */}
          <div style={{ background: '#f0fdf4', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #86efac' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <strong style={{ fontSize: '0.9rem', color: '#166534' }}>🥇 Nguyện Vọng 1 (Ưu tiên số 1)</strong>
              <span style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>NV chính</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: '0.6rem' }}>
              <input
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 700 }} placeholder="Tên trường (VD: ĐH Bách Khoa)"
                value={nv1.uni} onChange={e => setNv1({ ...nv1, uni: e.target.value })}
              />
              <input
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 700 }} placeholder="Ngành học (VD: CNTT)"
                value={nv1.major} onChange={e => setNv1({ ...nv1, major: e.target.value })}
              />
              <select
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 800 }}
                value={nv1.combo} onChange={e => setNv1({ ...nv1, combo: e.target.value })}
              >
                {SUBJECT_COMBINATIONS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* NV 2 */}
          <div style={{ background: '#eff6ff', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #93c5fd' }}>
            <strong style={{ fontSize: '0.9rem', color: '#1e40af', display: 'block', marginBottom: '0.6rem' }}>🥈 Nguyện Vọng 2</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: '0.6rem' }}>
              <input
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 700 }} placeholder="Tên trường ĐH"
                value={nv2.uni} onChange={e => setNv2({ ...nv2, uni: e.target.value })}
              />
              <input
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 700 }} placeholder="Ngành học"
                value={nv2.major} onChange={e => setNv2({ ...nv2, major: e.target.value })}
              />
              <select
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 800 }}
                value={nv2.combo} onChange={e => setNv2({ ...nv2, combo: e.target.value })}
              >
                {SUBJECT_COMBINATIONS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* NV 3 */}
          <div style={{ background: '#fefce8', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #fef08a' }}>
            <strong style={{ fontSize: '0.9rem', color: '#854d0e', display: 'block', marginBottom: '0.6rem' }}>🥉 Nguyện Vọng 3 (Dự phòng)</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: '0.6rem' }}>
              <input
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 700 }} placeholder="Tên trường ĐH"
                value={nv3.uni} onChange={e => setNv3({ ...nv3, uni: e.target.value })}
              />
              <input
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 700 }} placeholder="Ngành học"
                value={nv3.major} onChange={e => setNv3({ ...nv3, major: e.target.value })}
              />
              <select
                className="form-input" style={{ fontSize: '0.82rem', fontWeight: 800 }}
                value={nv3.combo} onChange={e => setNv3({ ...nv3, combo: e.target.value })}
              >
                {SUBJECT_COMBINATIONS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ textAlign: 'right' }}>
            <button onClick={handleSaveAspirations} className="btn-primary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem' }}>
              💾 Lưu Danh Sách Nguyện Vọng ĐH
            </button>
          </div>
        </div>

        {/* Right Column: Teacher Counseling Note & Class Analytics Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Panel 1: GVCN Career Counseling Note Box */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📝 Nhận Xét & Tư Vấn Định Hướng Nghề Nghiệp Từ GVCN
              </h4>
              {isTeacher && (
                <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                  ✏️ GVCN Nhập tư vấn
                </span>
              )}
            </div>

            {isTeacher ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea
                  value={teacherNote}
                  onChange={e => setTeacherNote(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', minHeight: '90px', fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical' }}
                  placeholder={`Nhập nhận xét định hướng nghề nghiệp của GVCN cho em ${currentStudent?.name}...`}
                />
                <div style={{ textAlign: 'right' }}>
                  <button onClick={handleSaveTeacherNote} className="btn-primary" style={{ background: '#059669', padding: '0.5rem 1.2rem', fontSize: '0.82rem' }}>
                    💾 Lưu Lời Tư Vấn GVCN
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc', padding: '1.1rem', borderRadius: '0.85rem',
                border: '1px solid #e2e8f0', fontStyle: 'italic', fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6
              }}>
                "{teacherNote}"
                <div style={{ textAlign: 'right', marginTop: '0.75rem', fontStyle: 'normal', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                  — Cô Đỗ Kim Tuyền (GVCN Lớp {settings.className})
                </div>
              </div>
            )}
          </div>

          {/* Panel 2: Class Subject Groups Distribution Chart */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#334155' }}>
              📊 Phân Bố Định Hướng Khối Xét Tuyển ĐH Toàn Lớp 12.7
            </h4>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={classComboStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '0.82rem' }} />
                <Bar dataKey="Số HS" radius={[6, 6, 0, 0]}>
                  {classComboStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {/* Bottom Section: Holland Career & Subject Matrix Discovery */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          🧭 Tra Cứu Khối Xét Tuyển & Nhóm Ngành Học Tiềm Năng (Holland Career Matrix)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {SUBJECT_COMBINATIONS.map(c => (
            <div key={c.code} style={{
              padding: '1.1rem', borderRadius: '0.85rem', background: '#ffffff',
              border: `1.5px solid ${c.color}35`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                <div>
                  <span style={{ background: c.color, color: 'white', fontWeight: 900, fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                    Khối {c.code}
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.1rem' }}>
                    {c.name}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, marginTop: '0.6rem' }}>
                <strong>🎯 Ngành học hàng đầu:</strong> {c.fields}<br />
                <strong style={{ color: '#0369a1' }}>🏫 Trường ĐH tiêu biểu:</strong> {c.unis}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
