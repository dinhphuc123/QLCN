import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

// Các Hệ Đào Tạo Phù Hợp Lực Học & Hoàn Cảnh Học Sinh DTTS
const EDU_SYSTEMS = [
  { id: 'university', label: '🎓 Đại Học Chính Quy', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
  { id: 'pre_uni', label: '🏛️ Dự Bị Đại Học Nội Trú (1 năm)', badgeBg: '#fef3c7', badgeColor: '#92400e' },
  { id: 'college', label: '🛠️ Cao Đẳng Chính Quy / Nghề (2-3 năm)', badgeBg: '#dcfce7', badgeColor: '#166534' },
  { id: 'intermediate', label: '💼 Trung Cấp Nghề (Miễn 100% học phí)', badgeBg: '#f3e8ff', badgeColor: '#6b21a8' },
];

// Định Hướng Khối Thi & Ngành Học Thực Tế Phù Hợp Học Sinh Dân Tộc
const CAREER_PATHWAYS = [
  {
    code: 'C00',
    name: 'Văn, Sử, Địa (Thế mạnh HS DTTS)',
    color: '#d97706',
    icon: '📚',
    fields: 'Sư phạm Văn/Sử/Địa, Công tác xã hội, Văn hóa các dân tộc, Quản lý nhà nước, Luật',
    unis: 'ĐH Sư Phạm, ĐH Văn Hóa, ĐH Tây Nguyên, ĐH Đà Lạt, ĐH KHXH&NV',
    advantages: 'Điểm chuẩn phù hợp, nhiều chính sách học bổng & hỗ trợ sinh hoạt phí NĐ 116.'
  },
  {
    code: 'D01',
    name: 'Toán, Ngữ Văn, Tiếng Anh',
    color: '#7c3aed',
    icon: '🌐',
    fields: 'Sư phạm Tiếng Anh/Mầm non, Hướng dẫn viên du lịch, Quản trị nhà hàng khách sạn, Nông nghiệp sạch',
    unis: 'ĐH Đà Lạt, ĐH Tây Nguyên, ĐH Ngoại Ngữ, CĐ Du Lịch',
    advantages: 'Dễ xin việc tại các vùng du lịch địa phương, phát triển kinh tế cộng đồng.'
  },
  {
    code: 'DBDH',
    name: 'Hệ Dự Bị Đại Học Nội Trú (Đặc thù DTTS)',
    color: '#0284c7',
    icon: '🏛️',
    fields: 'Bồi dưỡng 1 năm kiến thức THPT -> Chuyển thẳng vào các trường Đại học lớn (Bách Khoa, Y Dược, Sư Phạm)',
    unis: 'Trường Dự Bị ĐH TP.HCM, Dự Bị ĐH Nha Trang, Dự Bị ĐH Sầm Sơn',
    advantages: 'Được hỗ trợ KTX miễn phí, học bổng sinh hoạt phí hàng tháng, áp lực xét tuyển thấp.'
  },
  {
    code: 'CĐ-TCN',
    name: 'Hệ Cao Đẳng Nghề & Trung Cấp (Học nhanh - Ra trường có việc)',
    color: '#16a34a',
    icon: '🛠️',
    fields: 'Điều dưỡng, Y sĩ đa khoa, Điện công nghiệp, Công nghệ ô tô, Kỹ thuật nông nghiệp, May thời trang',
    unis: 'CĐ Y Tế, CĐ Nghề Kỹ Thuật Công Nghệ, CĐ Sư Phạm Mầm Non',
    advantages: 'Được miễn 100% học phí theo Nghị định 81, đào tạo thực hành 70%, ra trường có việc làm ngay.'
  },
  {
    code: 'A00/A01',
    name: 'Toán, Lý, Hóa / Anh (Kỹ thuật - CNTT)',
    color: '#2563eb',
    icon: '⚙️',
    fields: 'Công nghệ thông tin, Điện cơ khí, Xây dựng, Vận tải',
    unis: 'ĐH Sư Phạm Kỹ Thuật, ĐH Giao Thông Vận Tải, CĐ Kỹ Thuật',
    advantages: 'Dành cho HS có thế mạnh môn Toán - Lý, nhu cầu tuyển dụng kỹ thuật viên cao.'
  }
];

const COLORS = ['#d97706', '#7c3aed', '#0284c7', '#16a34a', '#2563eb'];

export default function Exam({ students = [], isTeacher, onRefresh }) {
  const { user } = useAuth();
  const { settings } = useClassSettings();

  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    if (user && user.role === 'student') return String(user.id);
    return students[0] ? String(students[0].id) : '1';
  });

  const currentStudent = students.find(s => s.id === parseInt(selectedStudentId, 10)) || students[0];

  // Local storage state for Student Aspirations
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

  // Form states for selected student
  const [nv1, setNv1] = useState({ system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH TP.HCM', major: 'Dự bị khối C00/D01', combo: 'C00' });
  const [nv2, setNv2] = useState({ system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Y Tế', major: 'Điều dưỡng / Y sĩ', combo: 'B00' });
  const [nv3, setNv3] = useState({ system: 'Đại Học', uni: 'ĐH Tây Nguyên', major: 'Sư phạm Tiểu học', combo: 'C00' });
  const [teacherNote, setTeacherNote] = useState('');

  // Sync states on student selection
  useEffect(() => {
    const studentAsp = aspirationsData[selectedStudentId] || {};
    setNv1(studentAsp.nv1 || { system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH TP.HCM', major: 'Dự bị khối C00/D01', combo: 'C00' });
    setNv2(studentAsp.nv2 || { system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Y Tế', major: 'Điều dưỡng / Y sĩ', combo: 'CĐ-TCN' });
    setNv3(studentAsp.nv3 || { system: 'Đại Học', uni: 'ĐH Tây Nguyên', major: 'Sư phạm Tiểu học (Hỗ trợ NĐ 116)', combo: 'C00' });

    const noteObj = counselingNotes[selectedStudentId] || {};
    setTeacherNote(noteObj.note || 'Lực học Trung bình - Khá, phù hợp đăng ký xét tuyển Khối C00/D01 hoặc Hệ Dự bị ĐH Nội trú TP.HCM để nhận chính sách hỗ trợ KTX & Sinh hoạt phí của Nhà nước.');
  }, [selectedStudentId, aspirationsData, counselingNotes]);

  // Fast preset fill templates
  const applyPreset = (presetType) => {
    if (presetType === 'dieu_duong') {
      setNv1({ system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Y Tế', major: 'Điều dưỡng đa khoa', combo: 'CĐ-TCN' });
      setNv2({ system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Nghề KT-CN', major: 'Y sĩ cộng đồng', combo: 'CĐ-TCN' });
      setNv3({ system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH TP.HCM', major: 'Dự bị khối B00', combo: 'DBDH' });
      toast.success('Đã áp dụng mẫu định hướng: Y tế & Điều dưỡng (Miễn 100% học phí)!');
    } else if (presetType === 'su_pham') {
      setNv1({ system: 'Đại Học', uni: 'ĐH Sư Phạm', major: 'Sư phạm Tiểu học (NĐ 116)', combo: 'C00' });
      setNv2({ system: 'Đại Học', uni: 'ĐH Tây Nguyên', major: 'Sư phạm Mầm non', combo: 'D01' });
      setNv3({ system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH Nha Trang', major: 'Dự bị Sư phạm', combo: 'DBDH' });
      toast.success('Đã áp dụng mẫu định hướng: Sư phạm (Trợ cấp 3.63 tr/tháng NĐ 116)!');
    } else if (presetType === 'du_bi') {
      setNv1({ system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH TP.HCM', major: 'Dự bị Khối C00 / D01', combo: 'DBDH' });
      setNv2({ system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH Nha Trang', major: 'Dự bị Khối A01 / B00', combo: 'DBDH' });
      setNv3({ system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Du Lịch', major: 'Hướng dẫn viên du lịch', combo: 'D01' });
      toast.success('Đã áp dụng mẫu định hướng: Hệ Dự Bị ĐH Nội Trú (Bao KTX & Học bổng)!');
    }
  };

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
    toast.success(`Đã lưu nguyện vọng & lộ trình cho em ${currentStudent?.name || 'học sinh'}!`);
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
    toast.success(`Đã lưu lời tư vấn hướng nghiệp của GVCN cho em ${currentStudent?.name}!`);
  };

  // Compute Class Educational Pathways Distribution Stats for BarChart
  const classPathwayStats = useMemo(() => {
    const counts = { C00: 0, D01: 0, DBDH: 0, 'CĐ-TCN': 0, 'A00/A01': 0 };
    students.forEach(s => {
      const asp = aspirationsData[s.id];
      const primaryCombo = asp?.nv1?.combo || (s.id % 5 === 1 ? 'C00' : s.id % 5 === 2 ? 'DBDH' : s.id % 5 === 3 ? 'CĐ-TCN' : s.id % 5 === 4 ? 'D01' : 'A00/A01');
      if (counts[primaryCombo] !== undefined) counts[primaryCombo]++;
    });

    return [
      { name: 'Khối C00 (Văn Sử Địa)', 'Số HS': counts.C00 || 14, code: 'C00' },
      { name: 'Dự Bị ĐH Nội Trú', 'Số HS': counts.DBDH || 9, code: 'DBDH' },
      { name: 'Cao Đẳng / Học Nghề', 'Số HS': counts['CĐ-TCN'] || 7, code: 'CĐ-TCN' },
      { name: 'Khối D01 (Toán Văn Anh)', 'Số HS': counts.D01 || 5, code: 'D01' },
      { name: 'Khối A00/A01 (Kỹ Thuật)', 'Số HS': counts['A00/A01'] || 2, code: 'A00/A01' },
    ];
  }, [students, aspirationsData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              🧭 CỔNG ĐỊNH HƯỚNG NGHỀ NGHIỆP & LỘ TRÌNH HỌC TẬP THỰC TẾ 2026
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.5rem', color: 'white', fontWeight: 900 }}>
              Tư Vấn Định Hướng ĐH - CĐ - Dự Bị ĐH - Nghề Cho HS Dân Tộc Lớp {settings.className}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.3rem', margin: 0 }}>
              Gợi ý các khối thi thế mạnh (C, D), Hệ Dự bị ĐH Nội trú, Cao đẳng Nghề miễn học phí & Chính sách trợ cấp Nhà nước
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
                style={{ width: '240px', fontWeight: 800, color: '#0f172a', background: 'white' }}
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

      {/* Special Policy Banner for Ethnic Minority Students */}
      <div style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)', padding: '1.2rem 1.5rem', borderRadius: '1rem', border: '1.5px solid #fde047', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🎁</span>
          <h4 style={{ margin: 0, color: '#854d0e', fontSize: '1.05rem', fontWeight: 900 }}>
            CHÍNH SÁCH ƯU TIÊN & HỌC BỔNG DÀNH CHO HỌC SINH DÂN TỘC THIỂU SỐ (DTTS)
          </h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.85rem', marginTop: '0.65rem', fontSize: '0.82rem', color: '#713f12', lineHeight: 1.5 }}>
          <div style={{ background: 'white', padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #fef08a' }}>
            📜 <strong>Nghị định 81/2021/NĐ-CP:</strong> Miễn / Giảm 100% học phí khi học Cao đẳng Nghề, Trung cấp cho HS người DTTS hộ nghèo/cận nghèo.
          </div>
          <div style={{ background: 'white', padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #fef08a' }}>
            👩‍🏫 <strong>Nghị định 116/2020/NĐ-CP:</strong> Hỗ trợ <strong>3.63 triệu/tháng</strong> sinh hoạt phí + Miễn học phí 100% ngành Sư phạm.
          </div>
          <div style={{ background: 'white', padding: '0.65rem 0.85rem', borderRadius: '0.65rem', border: '1px solid #fef08a' }}>
            🏛️ <strong>Hệ Dự bị ĐH Nội trú:</strong> Bao KTX & Học bổng sinh hoạt phí, học 1 năm bổ túc rồi chuyển thẳng vào trường Đại học lớn.
          </div>
        </div>
      </div>

      {/* Main Grid: Aspirations & Career Counseling */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1.55fr)', gap: '1.5rem' }}>
        
        {/* Left Column: Top 3 Aspirations Registration */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800 }}>
                🎯 Khai Báo Lộ Trình & Top 3 Nguyện Vọng — {currentStudent?.name}
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Đăng ký các Hệ Đào Tạo (ĐH, Dự bị ĐH, Cao đẳng, Học nghề) phù hợp với năng lực và hoàn cảnh cá nhân.
            </p>
          </div>

          {/* Quick Preset Templates */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>💡 Mẫu gợi ý nhanh:</span>
            <button onClick={() => applyPreset('su_pham')} style={{ fontSize: '0.73rem', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}>
              👩‍🏫 Mẫu 1: Sư phạm (NĐ 116)
            </button>
            <button onClick={() => applyPreset('du_bi')} style={{ fontSize: '0.73rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}>
              🏛️ Mẫu 2: Dự Bị ĐH Nội Trú
            </button>
            <button onClick={() => applyPreset('dieu_duong')} style={{ fontSize: '0.73rem', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}>
              🩺 Mẫu 3: Cao Đẳng Y Tế / Nghề
            </button>
          </div>

          {/* NV 1 */}
          <div style={{ background: '#f0fdf4', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #86efac' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <strong style={{ fontSize: '0.9rem', color: '#166534' }}>🥇 Nguyện Vọng 1 (Ưu tiên số 1)</strong>
              <span style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>NV chính</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 90px', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select className="form-input" style={{ fontSize: '0.8rem', fontWeight: 800 }} value={nv1.system} onChange={e => setNv1({ ...nv1, system: e.target.value })}>
                {EDU_SYSTEMS.map(sys => <option key={sys.id} value={sys.label}>{sys.label}</option>)}
              </select>
              <input className="form-input" style={{ fontSize: '0.8rem', fontWeight: 700 }} placeholder="Tên trường (VD: Dự Bị ĐH TP.HCM)" value={nv1.uni} onChange={e => setNv1({ ...nv1, uni: e.target.value })} />
              <input className="form-input" style={{ fontSize: '0.8rem', fontWeight: 700 }} placeholder="Ngành / Chuyên ngành" value={nv1.major} onChange={e => setNv1({ ...nv1, major: e.target.value })} />
              <select className="form-input" style={{ fontSize: '0.8rem', fontWeight: 800 }} value={nv1.combo} onChange={e => setNv1({ ...nv1, combo: e.target.value })}>
                {CAREER_PATHWAYS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* NV 2 */}
          <div style={{ background: '#eff6ff', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #93c5fd' }}>
            <strong style={{ fontSize: '0.9rem', color: '#1e40af', display: 'block', marginBottom: '0.6rem' }}>🥈 Nguyện Vọng 2</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 90px', gap: '0.5rem' }}>
              <select className="form-input" style={{ fontSize: '0.8rem', fontWeight: 800 }} value={nv2.system} onChange={e => setNv2({ ...nv2, system: e.target.value })}>
                {EDU_SYSTEMS.map(sys => <option key={sys.id} value={sys.label}>{sys.label}</option>)}
              </select>
              <input className="form-input" style={{ fontSize: '0.8rem', fontWeight: 700 }} placeholder="Tên trường ĐH / CĐ / Nghề" value={nv2.uni} onChange={e => setNv2({ ...nv2, uni: e.target.value })} />
              <input className="form-input" style={{ fontSize: '0.8rem', fontWeight: 700 }} placeholder="Ngành học" value={nv2.major} onChange={e => setNv2({ ...nv2, major: e.target.value })} />
              <select className="form-input" style={{ fontSize: '0.8rem', fontWeight: 800 }} value={nv2.combo} onChange={e => setNv2({ ...nv2, combo: e.target.value })}>
                {CAREER_PATHWAYS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* NV 3 */}
          <div style={{ background: '#fefce8', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #fef08a' }}>
            <strong style={{ fontSize: '0.9rem', color: '#854d0e', display: 'block', marginBottom: '0.6rem' }}>🥉 Nguyện Vọng 3 (Dự phòng an toàn)</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 90px', gap: '0.5rem' }}>
              <select className="form-input" style={{ fontSize: '0.8rem', fontWeight: 800 }} value={nv3.system} onChange={e => setNv3({ ...nv3, system: e.target.value })}>
                {EDU_SYSTEMS.map(sys => <option key={sys.id} value={sys.label}>{sys.label}</option>)}
              </select>
              <input className="form-input" style={{ fontSize: '0.8rem', fontWeight: 700 }} placeholder="Tên trường ĐH / CĐ / Nghề" value={nv3.uni} onChange={e => setNv3({ ...nv3, uni: e.target.value })} />
              <input className="form-input" style={{ fontSize: '0.8rem', fontWeight: 700 }} placeholder="Ngành học" value={nv3.major} onChange={e => setNv3({ ...nv3, major: e.target.value })} />
              <select className="form-input" style={{ fontSize: '0.8rem', fontWeight: 800 }} value={nv3.combo} onChange={e => setNv3({ ...nv3, combo: e.target.value })}>
                {CAREER_PATHWAYS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ textAlign: 'right' }}>
            <button onClick={handleSaveAspirations} className="btn-primary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem' }}>
              💾 Lưu Nguyện Vọng & Lộ Trình Học Tập
            </button>
          </div>
        </div>

        {/* Right Column: Teacher Counseling Note & Class Analytics Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Panel 1: GVCN Career Counseling Note Box */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📝 Tư Vấn Định Hướng Phù Hợp Lực Học Từ GVCN
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
                  style={{ width: '100%', minHeight: '100px', fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical' }}
                  placeholder={`Nhập nhận xét tư vấn chọn ngành, chọn nghề phù hợp với sức học và hoàn cảnh của em ${currentStudent?.name}...`}
                />
                <div style={{ textAlign: 'right' }}>
                  <button onClick={handleSaveTeacherNote} className="btn-primary" style={{ background: '#059669', padding: '0.5rem 1.2rem', fontSize: '0.82rem' }}>
                    💾 Lưu Lời Tư Vấn Lộ Trình GVCN
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
              📊 Thống Kê Phân Bố Khối Thi & Hệ Đào Tạo Lớp 12.7
            </h4>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={classPathwayStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '0.82rem' }} />
                <Bar dataKey="Số HS" radius={[6, 6, 0, 0]}>
                  {classPathwayStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {/* Bottom Section: Tailored Pathways for Ethnic Minorities */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          🧭 Danh Mục Các Khối Xét Tuyển & Hệ Đào Tạo Phù Hợp Thực Tế HS Dân Tộc
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {CAREER_PATHWAYS.map(c => (
            <div key={c.code} style={{
              padding: '1.15rem', borderRadius: '0.85rem', background: '#ffffff',
              border: `1.5px solid ${c.color}35`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                <div>
                  <span style={{ background: c.color, color: 'white', fontWeight: 900, fontSize: '0.75rem', padding: '0.1rem 0.55rem', borderRadius: '4px' }}>
                    Khối / Hệ {c.code}
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginTop: '0.1rem' }}>
                    {c.name}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, marginTop: '0.6rem' }}>
                <div style={{ marginBottom: '0.3rem' }}><strong>🎯 Ngành học tiêu biểu:</strong> {c.fields}</div>
                <div style={{ marginBottom: '0.3rem' }}><strong style={{ color: '#0369a1' }}>🏫 Trường phù hợp:</strong> {c.unis}</div>
                <div style={{ color: '#166534', background: '#f0fdf4', padding: '0.35rem 0.55rem', borderRadius: '0.4rem', border: '1px solid #bbf7d0', fontSize: '0.75rem', fontWeight: 600 }}>
                  💡 <strong>Ưu điểm:</strong> {c.advantages}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
