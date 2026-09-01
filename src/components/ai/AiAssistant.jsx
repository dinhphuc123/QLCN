import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function AiAssistant({ students = [] }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0] ? String(students[0].id) : '1');
  const [reportType, setReportType] = useState('parent_meeting'); // 'parent_meeting' | 'zalo_sms' | 'academic_advice'
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);

  const student = students.find(s => s.id === parseInt(selectedStudentId, 10)) || students[0];

  const handleGenerate = () => {
    if (!student) return;
    setGenerating(true);

    setTimeout(() => {
      let content = '';
      const gpa = student.prevGPA || 7.5;
      const isGood = gpa >= 8.0;
      const isWeak = gpa < 6.5;

      if (reportType === 'parent_meeting') {
        content = `📋 BÁO CÁO ĐÁNH GIÁ HỌC SINH — HỌP PHỤ HUYNH
--------------------------------------------------
Họ và tên: ${student.name} (STT: ${String(student.id).padStart(2, '0')})
Tổ: ${student.group} | Phòng KTX: ${student.dormRoom}
Chức vụ: ${student.position || 'Thành viên'}

1. CHUYÊN CẦN & TÁC PHONG:
- Chuyên cần: Chấp hành tốt nội quy điểm danh 5 buổi, tham gia đầy đủ hoạt động tập thể.
- Xếp loại nề nếp: ${student.points >= 90 ? 'Xuất sắc (Giữ vững điểm nề nếp top đầu lớp)' : 'Khá (Cần chú ý đi học đúng giờ hơn)'}

2. HỌC TẬP & ÔN THI THPT QUỐC GIA:
- Điểm trung bình năm trước: ${gpa}/10 (${student.prevRank || 'Khá'})
- Nhận xét học lực: ${isGood ? 'Học sinh có nền tảng tư duy rất tốt, tự giác cao trong giờ tự học tối.' : isWeak ? 'Cần tập trung phụ đạo thêm môn Toán và Tiếng Anh để đảm bảo mục tiêu tốt nghiệp.' : 'Học lực ổn định, tiếp thu bài tốt.'}
- Khối thi thế mạnh: ${student.id % 2 === 0 ? 'Khối A00 (Toán, Lý, Hóa)' : 'Khối D01 (Toán, Văn, Anh)'}
- Nguyện vọng ĐH: ${student.aspirations || 'Đại học Bách Khoa / Sư Phạm'}

3. ĐỀ XUẤT CỦA GVCN:
- Kính mong Phụ huynh tiếp tục phối hợp với GVCN Đỗ Kim Tuyền đôn đốc giờ tự học tại nhà/KTX vào buổi tối từ 19:30 - 22:30.`;
      } else if (reportType === 'zalo_sms') {
        content = `📱 TIN NHẮN THÔNG BÁO GỬI PHỤ HUYNH (ZALO/SMS):

"Trân trọng gửi Phụ huynh em ${student.name} (Lớp 12.7 - GVCN Đỗ Kim Tuyền):
Tuần qua em ${student.name} đạt điểm thi đua ${student.points || 95}/100 điểm (${student.points >= 90 ? 'Tốt' : 'Khá'}). Học lực năm cũ ĐTB ${gpa}. Kính mong Phụ huynh nhắc nhở em duy trì giờ tự học tối KTX (22:30 tắt đèn) để chuẩn bị tốt cho kỳ thi THPT Quốc gia 2027. Trân trọng!"`;
      } else {
        content = `💡 TƯ VẤN ĐỊNH HƯỚNG TỔ HỢP THI ĐẠI HỌC — ${student.name.toUpperCase()}

- Đánh giá năng lực: Dựa trên kết quả lớp 11 và thi thử 12, học sinh có điểm mạnh ở nhóm môn Tự Nhiên.
- Gợi ý 3 Tổ hợp ĐH tối ưu:
  1. Khối A01 (Toán, Lý, Anh): Dự kiến 24.5 điểm -> Ngành CNTT, Kinh Tế Số
  2. Khối A00 (Toán, Lý, Hóa): Dự kiến 23.8 điểm -> Ngành Kỹ Thuật, Công Nghệ
  3. Khối D01 (Toán, Văn, Anh): Dự kiến 22.5 điểm -> Ngành Thương Mại, Ngoại Ngữ
- Lời khuyên ôn tập: Tăng cường giải đề thi thử môn Toán từ tuần thứ 10.`;
      }

      setGeneratedContent(content);
      setGenerating(false);
      toast.success('AI đã tổng hợp báo cáo thành công!');
    }, 600);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Đã sao chép báo cáo vào clipboard!');
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>🤖 AI Trợ Lý GVCN — Tổng Hợp Báo Cáo & Tin Nhắn Phụ Huynh</h3>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
          Tự động phân tích toàn diện điểm nề nếp, chuyên cần, điểm thi thử và xuất báo cáo cá nhân hóa cho từng học sinh
        </p>
      </div>

      {/* Control Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
            Chọn Học Sinh Đánh Giá:
          </label>
          <select
            className="form-input"
            style={{ width: '100%', fontWeight: 700 }}
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

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
            Mẫu Báo Cáo AI:
          </label>
          <select
            className="form-input"
            style={{ width: '100%', fontWeight: 700 }}
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            <option value="parent_meeting">📋 Báo cáo Họp Phụ Huynh Toàn Diện</option>
            <option value="zalo_sms">📱 Tin nhắn Zalo/SMS Gửi Cha Mẹ</option>
            <option value="academic_advice">💡 Tư vấn Định hướng Thi ĐH</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '⏳ AI Đang Tổng Hợp...' : '✨ Bắt Đầu AI Phân Tích'}
          </button>
        </div>
      </div>

      {/* Generated Result Box */}
      {generatedContent && (
        <div style={{
          background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '1rem',
          padding: '1.5rem', position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              ✨ Kết quả AI Phân tích cho {student?.name}
            </span>
            <button
              onClick={copyToClipboard}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '9999px', background: '#16a34a', color: 'white',
                border: 'none', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}
            >
              📋 Sao chép tin nhắn
            </button>
          </div>
          <pre style={{
            fontFamily: 'monospace', fontSize: '0.85rem', color: '#1e293b',
            whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6, background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1'
          }}>
            {generatedContent}
          </pre>
        </div>
      )}
    </div>
  );
}
