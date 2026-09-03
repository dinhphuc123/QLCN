import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function AiAssistant({ students = [] }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0] ? String(students[0].id) : '1');
  const [reportType, setReportType] = useState('parent_meeting'); // 'parent_meeting' | 'zalo_sms' | 'academic_advice'
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isRealAi, setIsRealAi] = useState(false);

  const student = students.find(s => s.id === parseInt(selectedStudentId, 10)) || students[0];

  const handleGenerate = async () => {
    if (!student) return;
    setGenerating(true);

    try {
      // Call Real Google Gemini AI through Serverless Backend
      const res = await api.generateAi({
        student,
        reportType,
        customPrompt: customPrompt.trim()
      });

      if (res && res.success && res.content) {
        setGeneratedContent(res.content);
        setIsRealAi(!res.isMock);
        toast.success(res.isMock ? 'Đã xuất dữ liệu đánh giá mẫu!' : '✨ Google Gemini AI đã phân tích thành công!');
      } else {
        throw new Error(res?.error || 'Không nhận được kết quả từ AI.');
      }
    } catch (err) {
      console.error('AI Error:', err);
      toast.error(`Lỗi AI: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Đã sao chép nội dung vào bộ nhớ tạm!');
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🤖</span> Trợ Lý Sư Phạm AI (Google Gemini 2.5 Flash)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
            Phân tích tự động hồ sơ 32 học sinh, chuyên cần 5 buổi và nề nếp KTX để soạn báo cáo họp và tin nhắn gửi phụ huynh
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '9999px',
            background: isRealAi ? '#dcfce7' : '#fef3c7',
            color: isRealAi ? '#166534' : '#92400e',
            border: isRealAi ? '1px solid #bbf7d0' : '1px solid #fde68a'
          }}>
            {isRealAi ? '⚡ Gemini Flash Live' : '💡 Sẵn sàng kết nối Gemini'}
          </span>
        </div>
      </div>

      {/* Control Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
            1. Chọn Học Sinh Đánh Giá:
          </label>
          <select
            className="form-input"
            style={{ width: '100%', fontWeight: 700 }}
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>
                STT {String(s.id).padStart(2, '0')} — {s.name} ({s.group || 'Tổ 1'} - KTX {s.dormRoom || 'KTX'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
            2. Loại Báo Cáo / Nhiệm Vụ:
          </label>
          <select
            className="form-input"
            style={{ width: '100%', fontWeight: 700 }}
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            <option value="parent_meeting">📋 Báo cáo Họp Phụ Huynh Toàn Diện</option>
            <option value="zalo_sms">📱 Tin nhắn Zalo/SMS Tuần Gửi Phụ Huynh</option>
          </select>
        </div>
      </div>

      {/* Custom Prompt / Notes */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem', color: '#374151' }}>
          3. Ghi chú thêm của Cô GVCN (Tùy chọn — AI sẽ điều chỉnh nhận xét theo ý cô):
        </label>
        <input
          type="text"
          className="form-input"
          style={{ width: '100%' }}
          placeholder="Ví dụ: Nhắc em chú ý môn Tiếng Anh, khen ngợi em vừa đạt giải văn nghệ KTX, v.v."
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
              <span>Đang kết nối Gemini AI phân tích hồ sơ...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Bắt Đầu Tổng Hợp Báo Cáo AI</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Result Box */}
      {generatedContent && (
        <div style={{
          background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '1rem',
          padding: '1.5rem', position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '0.3rem 0.8rem', borderRadius: '6px' }}>
              ✨ Kết quả AI Phân tích cho em {student?.name}
            </span>
            <button
              onClick={copyToClipboard}
              style={{
                padding: '0.45rem 1rem', borderRadius: '8px', background: '#16a34a', color: 'white',
                border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              📋 Sao chép nội dung
            </button>
          </div>
          <div style={{
            fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '0.9rem', color: '#1e293b',
            whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7, background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
            maxHeight: '500px', overflowY: 'auto'
          }}>
            {generatedContent}
          </div>
        </div>
      )}
    </div>
  );
}
