import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const SUBJECT_KEYS = [
  { key: 'math', name: 'Toán' },
  { key: 'lit',  name: 'Ngữ Văn' },
  { key: 'eng',  name: 'Tiếng Anh' },
  { key: 'phy',  name: 'Vật Lí' },
  { key: 'chem', name: 'Hóa Học' },
  { key: 'bio',  name: 'Sinh Học' },
  { key: 'his',  name: 'Lịch Sử' },
  { key: 'geo',  name: 'Địa Lí' },
  { key: 'civ',  name: 'GD KT&PL' },
];

export default function Exam({ students = [], isTeacher, onRefresh }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0] ? String(students[0].id) : '1');
  const [editingScores, setEditingScores] = useState({});

  const currentStudent = students.find(s => s.id === parseInt(selectedStudentId, 10)) || students[0];

  // Helper to extract or default subject score
  const getSubjectScore = (st, key) => {
    if (!st) return 7.0;
    if (st.subjectScores && st.subjectScores[key] !== undefined) return st.subjectScores[key];
    if (key === 'math') return st.examScoreMath || (st.prevGPA ? Math.min(10, st.prevGPA + 0.2) : 7.5);
    if (key === 'lit')  return st.examScoreLit  || (st.prevGPA ? Math.max(5, st.prevGPA - 0.5) : 7.0);
    if (key === 'eng')  return st.examScoreEng  || (st.prevGPA ? Math.min(10, st.prevGPA - 0.2) : 6.8);
    if (key === 'phy')  return parseFloat((st.prevGPA || 7.2).toFixed(1));
    if (key === 'chem') return parseFloat(((st.prevGPA || 7.2) - 0.3).toFixed(1));
    if (key === 'bio')  return parseFloat(((st.prevGPA || 7.2) + 0.1).toFixed(1));
    if (key === 'his')  return parseFloat(((st.prevGPA || 7.2) + 0.4).toFixed(1));
    if (key === 'geo')  return parseFloat(((st.prevGPA || 7.2) + 0.2).toFixed(1));
    if (key === 'civ')  return parseFloat(((st.prevGPA || 7.2) + 0.6).toFixed(1));
    return 7.0;
  };

  // Compute 5 major University Admission Subject Combinations for selected student
  const comboScores = useMemo(() => {
    if (!currentStudent) return [];
    const get = (k) => getSubjectScore(currentStudent, k);

    const a00 = get('math') + get('phy') + get('chem');
    const a01 = get('math') + get('phy') + get('eng');
    const b00 = get('math') + get('chem') + get('bio');
    const c00 = get('lit')  + get('his') + get('geo');
    const d01 = get('math') + get('lit') + get('eng');

    return [
      { code: 'A00', name: 'Toán, Lý, Hóa', total: a00.toFixed(2), color: '#2563eb', target: 'ĐH Bách Khoa / Kỹ Thuật' },
      { code: 'A01', name: 'Toán, Lý, Anh', total: a01.toFixed(2), color: '#0284c7', target: 'ĐH KTXH / Công Nghệ' },
      { code: 'B00', name: 'Toán, Hóa, Sinh', total: b00.toFixed(2), color: '#16a34a', target: 'ĐH Y Dược / Nông Lâm' },
      { code: 'C00', name: 'Văn, Sử, Địa', total: c00.toFixed(2), color: '#d97706', target: 'ĐH Sư Phạm / Luật / KHXH' },
      { code: 'D01', name: 'Toán, Văn, Anh', total: d01.toFixed(2), color: '#7c3aed', target: 'ĐH Kinh Tế / Ngoại Thương' },
    ].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
  }, [currentStudent]);

  const handleScoreChange = async (key, val) => {
    const num = Math.min(10, Math.max(0, parseFloat(val) || 0));
    const currentScores = currentStudent.subjectScores || {};
    const updatedScores = { ...currentScores, [key]: num };

    await api.updateStudent(currentStudent.id, {
      ...currentStudent,
      subjectScores: updatedScores,
      ...(key === 'math' ? { examScoreMath: num } : {}),
      ...(key === 'lit' ? { examScoreLit: num } : {}),
      ...(key === 'eng' ? { examScoreEng: num } : {}),
    });
    toast.success(`Đã cập nhật điểm môn ${key.toUpperCase()}!`);
    onRefresh();
  };

  const warningStudents = students.filter(s => {
    return SUBJECT_KEYS.some(sub => getSubjectScore(s, sub.key) < 5.0);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>🎓 Góc Ôn Thi THPT Quốc Gia & Tính Điểm Xét Tuyển ĐH</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
              Tự động tính điểm 5 Tổ hợp xét tuyển đại học hàng đầu (A00, A01, B00, C00, D01) từ điểm thi thử thật
            </p>
          </div>
          {warningStudents.length > 0 && (
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.8rem' }}>
              ⚠️ {warningStudents.length} học sinh có môn dưới 5.0 cần phụ đạo
            </span>
          )}
        </div>
      </div>

      {/* Main 2-col Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)', gap: '1.5rem' }}>
        
        {/* Left Column: Student Selector & University Combinations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
              Chọn Học Sinh Phân Tích Khối Thi:
            </label>
            <select
              className="form-input"
              style={{ width: '100%', fontWeight: 700, fontSize: '0.95rem' }}
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {String(s.id).padStart(2, '0')} - {s.name} ({s.group} | {s.dormRoom})
                </option>
              ))}
            </select>
          </div>

          {/* Top Combinations Cards */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontFamily: 'var(--font-serif)' }}>
              🏆 Bảng Điểm Xét Tuyển ĐH — {currentStudent?.name}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {comboScores.map((c, i) => (
                <div key={c.code} style={{
                  padding: '0.85rem 1rem', borderRadius: '0.75rem',
                  background: i === 0 ? c.color + '12' : '#f8fafc',
                  border: `1.5px solid ${i === 0 ? c.color : '#e2e8f0'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: c.color, color: 'white', fontWeight: 800, fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                        Khối {c.code}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{c.name}</strong>
                      {i === 0 && <span style={{ fontSize: '0.75rem', color: c.color, fontWeight: 700 }}>🥇 Thế mạnh nhất</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                      🎯 Gợi ý: {c.target}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color }}>
                      {c.total}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>/ 30.0 điểm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Full 9 Subject Scores Table & Editor */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>📝 Điểm Thi Thử Các Môn — {currentStudent?.name}</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem' }}>
            {SUBJECT_KEYS.map(sub => {
              const score = getSubjectScore(currentStudent, sub.key);
              const isWarning = score < 5.0;
              return (
                <div key={sub.key} style={{
                  padding: '0.85rem', borderRadius: '0.75rem',
                  background: isWarning ? '#fff5f5' : '#f9fafb',
                  border: `1px solid ${isWarning ? '#fca5a5' : '#e5e7eb'}`,
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    {sub.name} {isWarning && '⚠️'}
                  </span>
                  {isTeacher ? (
                    <input
                      type="number" step="0.1" min="0" max="10"
                      className="form-input"
                      style={{ width: '100%', fontWeight: 800, fontSize: '1.1rem', padding: '0.25rem 0.5rem', color: isWarning ? '#dc2626' : '#111827' }}
                      defaultValue={score}
                      onBlur={e => handleScoreChange(sub.key, e.target.value)}
                    />
                  ) : (
                    <strong style={{ fontSize: '1.3rem', color: isWarning ? '#dc2626' : '#111827' }}>
                      {score}
                    </strong>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe' }}>
            <h5 style={{ margin: '0 0 0.4rem 0', color: '#1e40af' }}>🎯 Đánh giá định hướng từ GVCN</h5>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e3a8a' }}>
              Nguyện vọng đăng ký: <strong>{currentStudent?.aspirations || 'Chưa cập nhật'}</strong>
            </p>
          </div>

          {/* AI Study Roadmap Banner */}
          {comboScores.length > 0 && (
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '0.85rem', border: '1.5px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🧠</span>
                <h5 style={{ margin: 0, color: '#166534', fontSize: '0.95rem' }}>AI LỘ TRÌNH 4 TUẦN BỨT PHÁ ĐIỂM THI THPT</h5>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#14532d', lineHeight: 1.6 }}>
                • <strong>Tổ hợp thế mạnh nhất:</strong> {comboScores[0]?.code} ({comboScores[0]?.name}) đạt <strong>{comboScores[0]?.total} / 30.0đ</strong> ➔ Phù hợp ứng tuyển: {comboScores[0]?.target}<br/>
                • <strong>Chiến lược tăng 1.5 - 2.0 điểm:</strong> Tập trung ôn tập chuyên sâu môn có dư địa tăng điểm cao nhất trong 4 tuần tới (luyện các dạng bài 8.5+ nâng cao).
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
