import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';
import { INITIAL_STUDENTS } from '../../data/initialStudents';

export default function ParentPortal({ students = INITIAL_STUDENTS, attendance = {} }) {
  const { user, isTeacher } = useAuth();
  const { settings } = useClassSettings();

  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    if (user && user.role === 'student') return String(user.id);
    return '1';
  });

  const student = students.find(s => s.id === parseInt(selectedStudentId, 10)) || students[0] || INITIAL_STUDENTS[0];

  // Local storage persistence for Teacher Weekly Comments
  const [weeklyComments, setWeeklyComments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qlcn_parent_comments') || '{}');
    } catch {
      return {};
    }
  });

  const [currentComment, setCurrentComment] = useState('');
  const [conductRating, setConductRating] = useState('Xuất sắc');

  useEffect(() => {
    const savedData = weeklyComments[selectedStudentId] || {};
    setCurrentComment(savedData.comment || 'Em ngoan, lễ phép, chấp hành tốt mọi nội quy học tập và sinh hoạt nội trú KTX. Tự giác học tập và tham gia tích cực các hoạt động tập thể.');
    setConductRating(savedData.rating || 'Xuất sắc');
  }, [selectedStudentId, weeklyComments]);

  const handleSaveComment = () => {
    const updated = {
      ...weeklyComments,
      [selectedStudentId]: {
        comment: currentComment,
        rating: conductRating,
        updatedAt: new Date().toISOString()
      }
    };
    setWeeklyComments(updated);
    localStorage.setItem('qlcn_parent_comments', JSON.stringify(updated));
    toast.success(`Đã lưu nhận xét Sổ Liên Lạc cho em ${student.name}!`);
  };

  // 5 Attendance Sessions Summary
  const sessionsList = [
    { key: 'morning', label: '1. Buổi Sáng (7h00)', icon: '☀️' },
    { key: 'afternoon', label: '2. Buổi Chiều (13h30)', icon: '🌤️' },
    { key: 'night_study', label: '3. Tự Học Tối (19h30)', icon: '📖' },
    { key: 'dorm_night', label: '4. Đi Ngủ KTX (22h30)', icon: '🛏️' },
    { key: 'activity', label: '5. HĐ Tập Thể & Thể Thao', icon: '⚽' },
  ];

  // Helper status badge getter
  const getSessionStatus = (sessionKey) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = attendance[today] || {};
    const sessMap = todayAtt.sessions && todayAtt.sessions[sessionKey];
    const st = sessMap ? sessMap[student.id] : 'present';

    if (st === 'absent') return { text: '🔴 KP (Vắng không phép)', bg: '#fee2e2', color: '#dc2626' };
    if (st === 'permit') return { text: '📝 Có phép', bg: '#dbeafe', color: '#1e40af' };
    if (st === 'late') return { text: '⏰ Đi trễ', bg: '#fef3c7', color: '#b45309' };
    return { text: '✓ Có mặt', bg: '#dcfce7', color: '#166534' };
  };

  // Export / Print Printable PDF Sổ Liên Lạc
  const handlePrintReportCard = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) { toast.error('Trình duyệt chặn pop-up'); return; }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sổ Liên Lạc Điện Tử - Lớp ${settings.className} - ${student.name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 30px; color: #111; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20pt; font-weight: bold; text-transform: uppercase; margin: 10px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .info-table td { padding: 6px 10px; font-size: 11pt; }
          .section-title { font-size: 12pt; font-weight: bold; margin-top: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .box { border: 1px solid #333; padding: 12px; border-radius: 6px; background: #fafafa; margin-top: 10px; font-size: 11pt; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 11pt; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">TRƯỜNG THPT NỘI TRÚ • LỚP ${settings.className}</div>
          <div class="title">SỔ LIÊN LẠC ĐIỆN TỬ HÀNG TUẦN</div>
          <div style="font-size: 11pt; font-style: italic;">${settings.currentWeek} • Năm học ${settings.schoolYear}</div>
        </div>

        <table class="info-table">
          <tr>
            <td><strong>Họ và tên học sinh:</strong> ${student.name}</td>
            <td><strong>Mã HS:</strong> ${student.studentCode || '—'}</td>
          </tr>
          <tr>
            <td><strong>Tổ học tập:</strong> ${student.group || '—'} (${student.position || 'Thành viên'})</td>
            <td><strong>Phòng KTX:</strong> ${student.dormRoom || '—'}</td>
          </tr>
          <tr>
            <td><strong>Họ tên Mẹ / SĐT:</strong> ${student.motherName || '—'} (${student.motherPhone || '—'})</td>
            <td><strong>Họ tên Cha / SĐT:</strong> ${student.fatherName || '—'} (${student.fatherPhone || '—'})</td>
          </tr>
        </table>

        <div class="section-title">I. ĐÁNH GIÁ NỀ NẾP & TÍCH CỰC TUẦN</div>
        <div class="box">
          <p style="margin: 0 0 6px 0;"><strong>Tổng điểm thi đua tuần:</strong> ${student.points || 98} / 100 điểm (Xếp loại: <strong>${conductRating}</strong>)</p>
          <p style="margin: 0;"><strong>Tình trạng điểm danh 5 buổi:</strong> Hoàn thành 100% đúng giờ | Nề nếp nội trú KTX 22h30 tắt đèn chấp hành tốt.</p>
        </div>

        <div class="section-title">II. NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM (GVCN)</div>
        <div class="box" style="min-height: 80px;">
          "${currentComment}"
        </div>

        <div class="footer">
          <div>
            <strong>Ý KIẾN PHỤ HUYNH HỌC SINH</strong><br /><br /><br />
            (Ký và ghi rõ họ tên)
          </div>
          <div>
            <em>Ngày ..... tháng ..... năm 2026</em><br />
            <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br /><br /><br />
            <strong>Cô ${settings.teacherName}</strong>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              📱 SỔ LIÊN LẠC ĐIỆN TỬ DÀNH CHO PHỤ HUYNH
            </span>
            <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '1.5rem', color: 'white', fontWeight: 900 }}>
              Trang Tra Cứu Kết Quả Học Tập & Nề Nếp Con Em — Lớp {settings.className}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#dbeafe', marginTop: '0.3rem', margin: 0 }}>
              GVCN: Cô {settings.teacherName} | Hotline liên hệ: <strong>0987.654.321</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Student Selector */}
            {isTeacher && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem', color: '#e0f2fe' }}>
                  Chọn con em phụ huynh:
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

            {/* Print / Export Report Card Button */}
            <button
              onClick={handlePrintReportCard}
              className="btn-primary"
              style={{
                background: '#ffffff', color: '#1e3a8a', border: 'none', fontWeight: 800,
                padding: '0.65rem 1.15rem', borderRadius: '0.75rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: isTeacher ? '1.2rem' : 0
              }}
            >
              📑 In / Xuất Phiếu Sổ Liên Lạc (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Grid Row 1: Student Profile, Parents Info, Conduct Score */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Student Profile */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 800 }}>👤 Thông Tin Học Sinh</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
            <div><strong>Họ và tên:</strong> <span style={{ color: '#0369a1', fontWeight: 700 }}>{student.name}</span></div>
            <div><strong>Giới tính / Dân tộc:</strong> {student.gender} | {student.ethnicity}</div>
            <div><strong>Tổ học tập:</strong> {student.group} ({student.position || 'Thành viên'})</div>
            <div><strong>Phòng KTX:</strong> {student.dormRoom}</div>
            <div><strong>SĐT Học sinh:</strong> {student.phone || 'Chưa cập nhật'}</div>
            <div><strong>Địa chỉ:</strong> {student.address}</div>
          </div>
        </div>

        {/* Card 2: Contact Info Parents */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#166534', fontSize: '1.05rem', fontWeight: 800 }}>📞 Thông Tin Phụ Huynh Đã Đăng Ký</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
            <div><strong>Họ tên Mẹ:</strong> {student.motherName || 'Đang cập nhật'}</div>
            <div>
              <strong>SĐT Mẹ:</strong>{' '}
              {student.motherPhone ? (
                <a href={`tel:${student.motherPhone}`} style={{ color: '#16a34a', fontWeight: 800, textDecoration: 'none' }}>
                  {student.motherPhone}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            <div><strong>Họ tên Cha:</strong> {student.fatherName || 'Đang cập nhật'}</div>
            <div>
              <strong>SĐT Cha:</strong>{' '}
              {student.fatherPhone ? (
                <a href={`tel:${student.fatherPhone}`} style={{ color: '#16a34a', fontWeight: 800, textDecoration: 'none' }}>
                  {student.fatherPhone}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            <div style={{ marginTop: '0.4rem', padding: '0.55rem 0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', fontSize: '0.78rem', color: '#15803d', border: '1px solid #bbf7d0' }}>
              💡 Hệ thống liên thông tự động gửi thông báo trực tiếp qua Zalo / SMS theo SĐT đăng ký.
            </div>
          </div>
        </div>

        {/* Card 3: Conduct & Competition Score */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '1.05rem', fontWeight: 800 }}>🏆 Điểm Thi Đua & Nề Nếp Tuần</h4>
          <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#d97706' }}>
              {student.points || 98} / 100
            </div>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #fde68a' }}>
              Xếp loại nề nếp: {conductRating}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.75rem', lineHeight: 1.5 }}>
            • Điểm danh 5 buổi: <strong style={{ color: '#16a34a' }}>Đủ 100%</strong><br />
            • KTX 22:30 tắt đèn: <strong style={{ color: '#16a34a' }}>Đúng giờ</strong><br />
            • Lịch sử vi phạm tuần: <strong>Không có</strong>
          </div>
        </div>

      </div>

      {/* Grid Row 2: 5-Session Attendance Breakdown & GVCN Weekly Evaluation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)', gap: '1.25rem' }}>
        
        {/* Panel 1: 5-Session Attendance Summary */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📊 Điểm Danh Nề Nếp 5 Buổi Tuần Này
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {sessionsList.map(s => {
              const statusObj = getSessionStatus(s.key);
              return (
                <div key={s.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.7rem 0.9rem', background: '#f8fafc', borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                    {s.icon} {s.label}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px',
                    fontWeight: 800, background: statusObj.bg, color: statusObj.color
                  }}>
                    {statusObj.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: GVCN Weekly Commentary & Rating Box */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📝 Nhận Xét Của GVCN & Xếp Loại Hạnh Kiểm
              </h4>
              {isTeacher && (
                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                  ✏️ Quyền chỉnh sửa GVCN
                </span>
              )}
            </div>

            {/* Teacher Rating Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Xếp loại nề nếp tuần:</label>
              {isTeacher ? (
                <select
                  value={conductRating}
                  onChange={e => setConductRating(e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 800, padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                >
                  <option value="Xuất sắc">⭐ Xuất sắc</option>
                  <option value="Tốt">✅ Tốt</option>
                  <option value="Khá">👍 Khá</option>
                  <option value="Trung bình">⚠️ Trung bình</option>
                  <option value="Cần cố gắng">🔴 Cần cố gắng</option>
                </select>
              ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '0.2rem 0.7rem', borderRadius: '9999px' }}>
                  {conductRating}
                </span>
              )}
            </div>

            {/* Comment Textarea or Read-Only Display */}
            {isTeacher ? (
              <textarea
                value={currentComment}
                onChange={e => setCurrentComment(e.target.value)}
                className="form-input"
                style={{ width: '100%', minHeight: '110px', fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical' }}
                placeholder={`Nhập lời nhận xét tuần của GVCN Đỗ Kim Tuyền gửi đến phụ huynh em ${student.name}...`}
              />
            ) : (
              <div style={{
                background: '#f8fafc', padding: '1.1rem', borderRadius: '0.85rem',
                border: '1px solid #e2e8f0', fontStyle: 'italic', fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6
              }}>
                "{currentComment}"
                <div style={{ textAlign: 'right', marginTop: '0.75rem', fontStyle: 'normal', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                  — Cô Đỗ Kim Tuyền (GVCN Lớp {settings.className})
                </div>
              </div>
            )}
          </div>

          {/* Teacher Save Button */}
          {isTeacher && (
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button
                onClick={handleSaveComment}
                className="btn-primary"
                style={{ background: '#059669', padding: '0.55rem 1.35rem', fontSize: '0.85rem' }}
              >
                💾 Lưu Nhận Xét Sổ Liên Lạc
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
