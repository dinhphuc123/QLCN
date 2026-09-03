import React, { useState, useMemo, useEffect } from 'react';
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

// Holland Code (RIASEC) Chuẩn Quốc Tế Cho Hướng Nghiệp
const HOLLAND_TRAITS = [
  { code: 'S', name: 'Social (Xã Hội / Giao Tiếp)', icon: '🤝', desc: 'Thích giúp đỡ, dạy học, chăm sóc người khác', matchFields: 'Sư phạm, Y tế, Du lịch, Công tác xã hội' },
  { code: 'R', name: 'Realistic (Thực Tế / Khéo Tay)', icon: '🛠️', desc: 'Thích làm việc với công cụ, máy móc, ngoài trời', matchFields: 'Nông lâm nghiệp, Ô tô, Điện tử, Kỹ thuật' },
  { code: 'I', name: 'Investigative (Nghiên Cứu / Phân Tích)', icon: '🧠', desc: 'Thích suy nghĩ, tìm hiểu, giải quyết vấn đề', matchFields: 'CNTT, Dược học, Y khoa, Khoa học' },
  { code: 'A', name: 'Artistic (Nghệ Thuật / Sáng Tạo)', icon: '🎨', desc: 'Thích sáng tạo, tự do, thiết kế, âm nhạc', matchFields: 'Báo chí, Truyền thông, Thiết kế, Văn hóa' },
  { code: 'E', name: 'Enterprising (Quản Lý / Thuyết Phục)', icon: '💼', desc: 'Thích lãnh đạo, thuyết phục, kinh doanh', matchFields: 'Kinh doanh, Quản trị, Marketing, Khách sạn' },
  { code: 'C', name: 'Conventional (Nghiệp Vụ / Gọn Gàng)', icon: '📋', desc: 'Thích trật tự, tỉ mỉ, làm việc với số liệu', matchFields: 'Kế toán, Hành chính, Quản lý hồ sơ' },
];

// Năng Lực & Sở Thích Nổi Bật
const STRENGTH_OPTIONS = [
  'Giao tiếp & Thuyết phục tốt',
  'Khéo tay, thích làm thực hành',
  'Chăm chỉ, chịu khó, kiên trì',
  'Thích chăm sóc & Giúp đỡ mọi người',
  'Tư duy logic & Tính toán tốt',
  'Thích hoạt động ngoài trời / Thiên nhiên',
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

  // Local storage state for Student Holland / Profiling Data
  const [profilingData, setProfilingData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qlcn_student_profiling') || '{}');
    } catch {
      return {};
    }
  });

  // Form states for selected student
  const [nv1, setNv1] = useState({ system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH TP.HCM', major: 'Dự bị khối C00/D01', combo: 'C00' });
  const [nv2, setNv2] = useState({ system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Y Tế', major: 'Điều dưỡng / Y sĩ', combo: 'CĐ-TCN' });
  const [nv3, setNv3] = useState({ system: 'Đại Học', uni: 'ĐH Tây Nguyên', major: 'Sư phạm Tiểu học', combo: 'C00' });
  const [teacherNote, setTeacherNote] = useState('');
  
  // Profiling state
  const [hollandTrait, setHollandTrait] = useState('S');
  const [academicRating, setAcademicRating] = useState('Trung bình - Khá');
  const [selectedStrengths, setSelectedStrengths] = useState(['Chăm chỉ, chịu khó, kiên trì', 'Giao tiếp & Thuyết phục tốt']);

  // Sync states on student selection
  useEffect(() => {
    const studentAsp = aspirationsData[selectedStudentId] || {};
    setNv1(studentAsp.nv1 || { system: 'Dự Bị ĐH Nội Trú', uni: 'Trường Dự Bị ĐH TP.HCM', major: 'Dự bị khối C00/D01', combo: 'C00' });
    setNv2(studentAsp.nv2 || { system: 'Cao Đẳng Nghề', uni: 'Trường CĐ Y Tế', major: 'Điều dưỡng / Y sĩ', combo: 'CĐ-TCN' });
    setNv3(studentAsp.nv3 || { system: 'Đại Học', uni: 'ĐH Tây Nguyên', major: 'Sư phạm Tiểu học (Hỗ trợ NĐ 116)', combo: 'C00' });

    const noteObj = counselingNotes[selectedStudentId] || {};
    setTeacherNote(noteObj.note || 'Lực học Trung bình - Khá, tính cách hòa đồng, kiên trì. Rất phù hợp với Hệ Dự bị ĐH Nội trú TP.HCM hoặc Sư phạm / Y tế cộng đồng.');

    const prof = profilingData[selectedStudentId] || {};
    setHollandTrait(prof.hollandTrait || 'S');
    setAcademicRating(prof.academicRating || 'Trung bình - Khá');
    setSelectedStrengths(prof.selectedStrengths || ['Chăm chỉ, chịu khó, kiên trì', 'Giao tiếp & Thuyết phục tốt']);
  }, [selectedStudentId, aspirationsData, counselingNotes, profilingData]);

  // Save Student Aspirations
  const handleSaveAspirations = () => {
    const updated = {
      ...aspirationsData,
      [selectedStudentId]: { nv1, nv2, nv3, updatedAt: new Date().toISOString() }
    };
    setAspirationsData(updated);
    localStorage.setItem('qlcn_student_aspirations', JSON.stringify(updated));
    toast.success(`Đã lưu nguyện vọng & lộ trình cho em ${currentStudent?.name || 'học sinh'}!`);
  };

  // Save Teacher Counseling Note
  const handleSaveTeacherNote = () => {
    const updated = {
      ...counselingNotes,
      [selectedStudentId]: { note: teacherNote, teacherName: settings.teacherName, updatedAt: new Date().toISOString() }
    };
    setCounselingNotes(updated);
    localStorage.setItem('qlcn_career_counseling', JSON.stringify(updated));
    toast.success(`Đã lưu lời tư vấn hướng nghiệp của GVCN cho em ${currentStudent?.name}!`);
  };

  // Save Profiling Data
  const handleSaveProfiling = (trait, rating, strengths) => {
    const updated = {
      ...profilingData,
      [selectedStudentId]: { hollandTrait: trait, academicRating: rating, selectedStrengths: strengths, updatedAt: new Date().toISOString() }
    };
    setProfilingData(updated);
    localStorage.setItem('qlcn_student_profiling', JSON.stringify(updated));
  };

  const handleToggleStrength = (str) => {
    const next = selectedStrengths.includes(str)
      ? selectedStrengths.filter(s => s !== str)
      : [...selectedStrengths, str];
    setSelectedStrengths(next);
    handleSaveProfiling(hollandTrait, academicRating, next);
  };

  // Calculate Match Score %
  const matchScore = useMemo(() => {
    let base = 85;
    if (hollandTrait === 'S' || hollandTrait === 'R') base += 8;
    if (selectedStrengths.length >= 2) base += 5;
    return Math.min(99, base);
  }, [hollandTrait, selectedStrengths]);

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

  const activeHollandObj = HOLLAND_TRAITS.find(h => h.code === hollandTrait) || HOLLAND_TRAITS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              🧭 CỔNG ĐỊNH HƯỚNG NGHỀ NGHIỆP & LỘ TRÌNH HỌC TẬP QUỐC TẾ 2026
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.5rem', color: 'white', fontWeight: 900 }}>
              Tư Vấn Hướng Nghiệp Chuẩn Quốc Tế (RIASEC) Cho HS Lớp {settings.className}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.3rem', margin: 0 }}>
              Phân tích tính cách Holland, năng lực nổi trội, học lực thực tế và gợi ý lộ trình trúng tuyển cao nhất
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

      {/* Main Grid: Aspirations (Left) & International Profiling (Right) */}
      <div className="career-main-grid">
        
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
          <div className="mobile-scroll-x" style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', alignItems: 'center', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', flexShrink: 0 }}>💡 Mẫu gợi ý nhanh:</span>
            <button onClick={() => applyPreset('su_pham')} style={{ fontSize: '0.73rem', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              👩‍🏫 Mẫu 1: Sư phạm (NĐ 116)
            </button>
            <button onClick={() => applyPreset('du_bi')} style={{ fontSize: '0.73rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              🏛️ Mẫu 2: Dự Bị ĐH Nội Trú
            </button>
            <button onClick={() => applyPreset('dieu_duong')} style={{ fontSize: '0.73rem', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              🩺 Mẫu 3: Cao Đẳng Y Tế / Nghề
            </button>
          </div>

          {/* NV 1 */}
          <div style={{ background: '#f0fdf4', padding: '1.1rem', borderRadius: '0.85rem', border: '1.5px solid #86efac' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <strong style={{ fontSize: '0.9rem', color: '#166534' }}>🥇 Nguyện Vọng 1 (Ưu tiên số 1)</strong>
              <span style={{ fontSize: '0.72rem', background: '#16a34a', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>NV chính</span>
            </div>
            <div className="nv-input-grid">
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
            <div className="nv-input-grid">
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
            <div className="nv-input-grid">
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

        {/* Right Column: International Profiling Card (Holland RIASEC + Strengths + Match Score) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* International Profiling Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Header Match Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)', padding: '0.85rem 1.1rem', borderRadius: '0.85rem', border: '1px solid #bae6fd' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CHỈ SỐ TƯƠNG THÍCH LỘ TRÌNH</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f766e', marginTop: '0.1rem' }}>
                  🎯 Độ Phù Hợp: <span style={{ color: '#16a34a' }}>{matchScore}%</span> (Rất Cao)
                </div>
              </div>
              <span style={{ background: '#16a34a', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.78rem' }}>
                ✅ Lộ trình tối ưu
              </span>
            </div>

            {/* Holland Code Selection */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                🧠 Nhóm Tính Cách Hướng Nghiệp Holland (RIASEC):
              </label>
              <select
                className="form-input"
                style={{ width: '100%', fontWeight: 800, fontSize: '0.88rem', padding: '0.45rem 0.75rem' }}
                value={hollandTrait}
                onChange={e => {
                  setHollandTrait(e.target.value);
                  handleSaveProfiling(e.target.value, academicRating, selectedStrengths);
                }}
              >
                {HOLLAND_TRAITS.map(h => (
                  <option key={h.code} value={h.code}>
                    {h.icon} {h.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.78rem', color: '#0369a1', background: '#e0f2fe', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', marginTop: '0.4rem', border: '1px solid #7dd3fc' }}>
                💡 <strong>Đặc điểm:</strong> {activeHollandObj.desc}<br />
                🎯 <strong>Ngành nghề phù hợp:</strong> {activeHollandObj.matchFields}
              </div>
            </div>

            {/* Academic Rating Selector */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                📈 Đánh Giá Mức Học Lực Thực Tế:
              </label>
              <select
                className="form-input"
                style={{ width: '100%', fontWeight: 800, fontSize: '0.85rem' }}
                value={academicRating}
                onChange={e => {
                  setAcademicRating(e.target.value);
                  handleSaveProfiling(hollandTrait, e.target.value, selectedStrengths);
                }}
              >
                <option value="Giỏi">⭐ Giỏi (Thi ĐH top đầu)</option>
                <option value="Khá - Giỏi">✅ Khá - Giỏi (Thi ĐH & Dự bị ĐH)</option>
                <option value="Trung bình - Khá">👍 Trung bình - Khá (Khối C/D, Dự bị ĐH, Cao đẳng)</option>
                <option value="Trung bình">⚠️ Trung bình (Cao đẳng Nghề, Trung cấp nghề)</option>
              </select>
            </div>

            {/* Strengths & Interests Selection */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '0.4rem' }}>
                💡 Năng Lực Nổi Trội & Sở Thích Cá Nhân:
              </label>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {STRENGTH_OPTIONS.map(str => {
                  const isChecked = selectedStrengths.includes(str);
                  return (
                    <button
                      key={str}
                      onClick={() => handleToggleStrength(str)}
                      style={{
                        fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '9999px',
                        border: `1.5px solid ${isChecked ? '#16a34a' : '#cbd5e1'}`,
                        background: isChecked ? '#f0fdf4' : '#f8fafc',
                        color: isChecked ? '#15803d' : '#475569',
                        fontWeight: isChecked ? 800 : 600, cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      {isChecked ? '✓ ' : '+ '}{str}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Panel 2: GVCN Career Counseling Note Box */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📝 Tư Vấn Định Hướng Lộ Trình Từ GVCN
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
