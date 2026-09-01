import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

// Default Timetable Data
const DEFAULT_TIMETABLE = {
  'Thứ 2': { morning: ['Chào cờ', 'Toán', 'Toán', 'Văn', 'Tiếng Anh'], afternoon: ['Lịch sử', 'Địa lý', 'Sinh học'] },
  'Thứ 3': { morning: ['Vật lý', 'Vật lý', 'Hóa học', 'Toán', 'Tin học'], afternoon: ['Thể dục', 'Thể dục'] },
  'Thứ 4': { morning: ['Văn', 'Văn', 'Toán', 'Tiếng Anh', 'GDCD'], afternoon: ['Hóa học', 'Sinh học'] },
  'Thứ 5': { morning: ['Toán', 'Toán', 'Vật lý', 'Văn', 'Công nghệ'], afternoon: ['Tiếng Anh', 'Hoạt động trải nghiệm'] },
  'Thứ 6': { morning: ['Tiếng Anh', 'Tiếng Anh', 'Hóa học', 'Toán', 'Sinh học'], afternoon: ['Lịch sử', 'Địa lý'] },
  'Thứ 7': { morning: ['Toán', 'Văn', 'Vật lý', 'Sinh hoạt lớp', 'Sinh hoạt Đoàn'], afternoon: [] },
};

// 6 Cành rèn luyện với thang 100 điểm/tuần
const TREE_BRANCHES = [
  {
    id: 'academic',
    title: 'Học tập chủ động',
    maxScore: 25,
    icon: '📚',
    color: '#0284c7',
    items: ['Tham gia giờ tự học', 'Hoàn thành bài tập', 'Có tiến bộ trong môn học', 'Biết lập kế hoạch học tập']
  },
  {
    id: 'dorm',
    title: 'Nề nếp nội trú',
    maxScore: 25,
    icon: '🏠',
    color: '#16a34a',
    items: ['Đúng giờ ngủ, giờ thức', 'Giữ gìn phòng ở sạch sẽ', 'Bảo quản tài sản chung', 'Thực hiện tốt nội quy']
  },
  {
    id: 'independence',
    title: 'Tự lập và trách nhiệm',
    maxScore: 20,
    icon: '🎒',
    color: '#7c3aed',
    items: ['Tự chăm sóc bản thân', 'Sắp xếp đồ dùng gọn gàng', 'Chủ động giải quyết công việc', 'Nhận lỗi và sửa lỗi']
  },
  {
    id: 'culture',
    title: 'Đoàn kết & ứng xử',
    maxScore: 15,
    icon: '🤝',
    color: '#d97706',
    items: ['Tôn trọng bạn bè', 'Biết chia sẻ, giúp đỡ', 'Không gây mất đoàn kết', 'Giao tiếp lịch sự']
  },
  {
    id: 'health',
    title: 'Sức khỏe & an toàn',
    maxScore: 10,
    icon: '⚽',
    color: '#059669',
    items: ['Ăn uống, nghỉ ngơi đúng giờ', 'Tham gia thể dục & hoạt động tập thể', 'Giữ vệ sinh cá nhân', 'Tuân thủ quy định an toàn']
  },
  {
    id: 'community',
    title: 'Đóng góp cộng đồng',
    maxScore: 5,
    icon: '🌟',
    color: '#db2777',
    items: ['Trực nhật, vệ sinh khu KTX', 'Tham gia hoạt động chung', 'Hỗ trợ bạn hoặc tập thể', 'Có sáng kiến cải thiện đời sống']
  }
];

// 5 Trạng thái ghi nhận
const GROWTH_MARKERS = [
  { icon: '🍃', name: 'Lá xanh', desc: 'Hoàn thành tốt trong tuần', color: '#16a34a' },
  { icon: '🍂', name: 'Lá vàng', desc: 'Có tiến bộ rõ rệt', color: '#d97706' },
  { icon: '🌸', name: 'Hoa', desc: 'Việc tốt / đóng góp nổi bật tháng', color: '#ec4899' },
  { icon: '🍎', name: 'Quả', desc: 'Thành tích & trưởng thành cuối năm', color: '#dc2626' },
  { icon: '🌱', name: 'Chồi non', desc: 'Mục tiêu cá nhân tiếp theo', color: '#10b981' }
];

// 6 Danh hiệu tháng
const MONTHLY_TITLES = [
  { title: '🤝 Người bạn nội trú tích cực', desc: 'Luôn sẵn sàng giúp đỡ bạn bè trong KTX', bg: '#e0f2fe', color: '#0369a1' },
  { title: '🌟 Gương tự lập', desc: 'Gọn gàng, ngăn nắp và có tinh thần tự giác cao', bg: '#fef3c7', color: '#b45309' },
  { title: '🏠 Phòng ở văn minh', desc: 'Giữ gìn vệ sinh phòng sạch sẽ và kỷ luật', bg: '#dcfce7', color: '#166534' },
  { title: '📚 Bước tiến học tập', desc: 'Nỗ lực bứt phá trong học tập & giờ tự học', bg: '#faf5ff', color: '#6b21a8' },
  { title: '⚡ Truyền năng lượng tốt', desc: 'Vui vẻ, hòa đồng, xây dựng tập thể vững mạnh', bg: '#ffe4e6', color: '#be123c' },
  { title: '🏆 Tập thể tiến bộ', desc: 'Đồng lòng cùng phòng/tổ hoàn thành xuất sắc mục tiêu', bg: '#ccfbf1', color: '#0f766e' }
];

export default function StudentDashboard({ students = [], attendance = {}, setActiveTab, announcements = [], onRefresh }) {
  const { user } = useAuth();
  const { settings } = useClassSettings();

  const [wateredToday, setWateredToday] = useState(false);
  const [activeBranch, setActiveBranch] = useState(null);
  // Combine prop announcements with localStorage announcements posted by GVCN
  const activeAnnouncements = useMemo(() => {
    let localAnns = [];
    try {
      localAnns = JSON.parse(localStorage.getItem('qlcn_announcements') || '[]');
    } catch {}
    const combined = [...(Array.isArray(announcements) ? announcements : [])];
    localAnns.forEach(la => {
      if (!combined.some(a => String(a.id) === String(la.id))) {
        combined.push(la);
      }
    });

    if (combined.length === 0) {
      return [
        {
          id: 101,
          title: 'Nhắc nhở nề nếp KTX tuần 01',
          content: 'Các phòng ở duy trì sinh hoạt đúng giờ, tự học từ 19h30 đến 21h30 và tắt đèn lúc 22h30.',
          tag: 'Ký túc xá',
          createdAt: new Date().toISOString()
        },
        {
          id: 102,
          title: 'Đăng ký thi đua "Phòng ở văn minh"',
          content: 'Trưởng phòng KTX hoàn thành kiểm tra và tự đánh giá thi đua tuần trước 17h thứ 6.',
          tag: 'Kế hoạch tuần',
          createdAt: new Date().toISOString()
        }
      ];
    }
    return combined;
  }, [announcements]);

  // Combine Timetable data from localStorage or fallback
  const timetableData = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qlcn_timetable_data') || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch {}
    return DEFAULT_TIMETABLE;
  }, []);

  // ANNOUNCEMENT TAG STYLES
  const ANNOUNCEMENT_TAG_COLORS = {
    '🚨 KHẨN': { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
    'Học tập': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'Nề nếp':  { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    'Kế hoạch tuần': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
    'Kế hoạch tháng': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
    'Ký túc xá': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  };

  const [selectedDay, setSelectedDay] = useState(() => {
    const dayIndex = new Date().getDay();
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const todayName = days[dayIndex];
    return todayName && timetableData[todayName] ? todayName : 'Thứ 2';
  });

  // Current student record
  const currentStudent = useMemo(() => {
    if (!user) return null;
    return students.find(s => s.id === user.id) || {
      id: user.id || 1,
      name: user.name || 'Học sinh',
      points: 95,
      group: user.group || 'Tổ 1',
      dormRoom: user.dormRoom || 'A1-07',
      position: user.position || 'Học sinh',
    };
  }, [user, students]);

  const studentScore = currentStudent?.points || 95;

  const today = new Date().toISOString().split('T')[0];
  const todayAtt = attendance[today] || {};
  const isCheckedInToday = todayAtt[user?.id] === 'present' || (todayAtt.sessions && todayAtt.sessions.morning && todayAtt.sessions.morning[user?.id] === 'present');

  const handleWaterTree = () => {
    if (wateredToday) {
      toast('Hôm nay bạn đã chăm sóc cây rèn luyện rồi! 🍃', { icon: '💧' });
      return;
    }
    setWateredToday(true);
    toast.success('🎉 Bạn đã tưới nước rèn luyện! (+2 điểm tinh thần tích cực)');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Personalized Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, #1B4D53, #2D6A70)',
        color: 'white',
        borderRadius: '1.25rem',
        boxShadow: '0 10px 25px rgba(27,77,83,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'white', color: '#1B4D53',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2.5px solid rgba(255,255,255,0.8)'
          }}>
            {user?.name ? user.name.split(' ').pop()[0] : '🎓'}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#e0f2fe', fontWeight: 600 }}>
              👋 Chào mừng trở lại, {user?.position || 'Học sinh Nội Trú'}!
            </div>
            <h2 style={{ margin: '0.2rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {user?.name || 'Học sinh 12.7'}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 700, color: '#ffffff' }}>
                📍 {user?.group || 'Tổ 1'} • Phòng KTX {user?.dormRoom || 'A1-07'}
              </span>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                🏆 {studentScore}/100 Điểm Tuần
              </span>
              <span style={{ fontSize: '0.72rem', background: isCheckedInToday ? '#dcfce7' : '#fef3c7', color: isCheckedInToday ? '#166534' : '#b45309', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                {isCheckedInToday ? '✅ Đã Check-in Hôm Nay' : '⏳ Chưa Check-in'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Monthly Honor Title */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.25)', padding: '0.75rem 1.25rem',
          borderRadius: '1rem', textAlign: 'center', minWidth: '170px'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Danh Hiệu Tháng 09</div>
          <div style={{ fontSize: '1rem', fontWeight: 900, margin: '0.2rem 0', color: '#fef08a', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            🌟 Gương Tự Lập
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ffffff', opacity: 0.95 }}>Học sinh KTX Xuất Sắc</div>
        </div>
      </div>

      {/* 4 Quick Action Buttons Hero Bar (Horizontal 4-card grid on desktop, 2x2 on mobile) */}
      <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('attendance')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.2rem', borderRadius: '1.1rem', border: '1.5px solid #7dd3fc',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(2,132,199,0.08)'
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>📌</div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0369a1' }}>Tự Check-in</div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.15rem', fontWeight: 600 }}>Điểm danh 5 buổi học</div>
        </button>

        <button
          onClick={() => setActiveTab('evaluation')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.2rem', borderRadius: '1.1rem', border: '1.5px solid #fde68a',
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(217,119,6,0.08)'
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>📝</div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#b45309' }}>Tự Đánh Giá</div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.15rem', fontWeight: 600 }}>Nề nếp & Thi đua tuần</div>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.2rem', borderRadius: '1.1rem', border: '1.5px solid #c084fc',
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(126,34,206,0.08)'
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>✉️</div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#6b21a8' }}>Đơn Xin Nghỉ</div>
          <div style={{ fontSize: '0.75rem', color: '#7e22ce', marginTop: '0.15rem', fontWeight: 600 }}>Gửi GVCN phê duyệt</div>
        </button>

        <button
          onClick={() => setActiveTab('confessions')}
          className="glass-panel"
          style={{
            padding: '1.1rem 1.2rem', borderRadius: '1.1rem', border: '1.5px solid #fbcfe8',
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(190,24,93,0.08)'
          }}
        >
          <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>💬</div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#9d174d' }}>Hòm Tâm Sự</div>
          <div style={{ fontSize: '0.75rem', color: '#be185d', marginTop: '0.15rem', fontWeight: 600 }}>Chia sẻ riêng với thầy cô</div>
        </button>
      </div>

      {/* Balanced 2-Column Section: Class Announcements (Left) & Smart Timetable (Right) */}
      <div className="eval-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.25rem' }}>
        
        {/* Left Column: Class Announcements (Linked directly from GVCN Portal) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📢 Thông Báo Mới
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '0.15rem' }}>
                  ⚡ Đã đồng bộ trực tiếp từ GVCN Lớp 12.7
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                {activeAnnouncements.length} Thông Báo
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activeAnnouncements.slice(0, 3).map((item, idx) => {
                const tagConfig = ANNOUNCEMENT_TAG_COLORS[item.tag] || { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
                const isUrgent = item.tag === '🚨 KHẨN';
                return (
                  <div key={idx} style={{
                    padding: '0.85rem 1rem', background: tagConfig.bg, borderRadius: '0.85rem',
                    border: `1.5px solid ${tagConfig.border}`,
                    boxShadow: isUrgent ? '0 4px 12px rgba(220,38,38,0.15)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: tagConfig.text }}>
                        {isUrgent ? '🚨' : '📌'} {item.title || 'Thông báo lớp'}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'white', color: tagConfig.text, padding: '0.1rem 0.45rem', borderRadius: '9999px', border: `1px solid ${tagConfig.border}` }}>
                        {item.tag || 'Chung'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.45 }}>
                      {item.content || item.body}
                    </div>
                    {item.fileUrl && (
                      <a href={item.fileUrl} download={item.fileName || 'file_dinh_kem'} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                        📎 Tải file đính kèm: {item.fileName || 'Tài liệu'}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Smart Timetable Widget (Linked directly from GVCN Portal) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800 }}>📅 Thời Khóa Biểu</h3>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '0.15rem' }}>
                ⚡ Cập nhật theo lịch học GVCN Lớp 12.7
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {Object.keys(timetableData).map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                    background: selectedDay === day ? '#1B4D53' : '#f3f4f6',
                    color: selectedDay === day ? 'white' : '#4b5563',
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Timetable Table */}
          <div style={{ background: '#f9fafb', borderRadius: '0.85rem', padding: '0.85rem 1rem', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1B4D53', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Lịch Học: {selectedDay}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700 }}>
                Sáng {(timetableData[selectedDay]?.morning || []).length} Tiết • Chiều {(timetableData[selectedDay]?.afternoon || []).length} Tiết
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>☀️ Buổi Sáng (07:00 - 11:30)</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max((timetableData[selectedDay]?.morning || []).length, 1)}, 1fr)`, gap: '0.4rem' }}>
                {(timetableData[selectedDay]?.morning || []).map((sub, i) => (
                  <div key={i} style={{
                    padding: '0.5rem 0.2rem', textAlign: 'center', background: 'white',
                    border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, color: '#1f2937'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>T{i+1}</div>
                    {sub}
                  </div>
                ))}
              </div>

              {(timetableData[selectedDay]?.afternoon || []).length > 0 && (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginTop: '0.4rem' }}>⛅ Buổi Chiều (13:30 - 17:00)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max((timetableData[selectedDay]?.afternoon || []).length, 1)}, 1fr)`, gap: '0.4rem' }}>
                    {timetableData[selectedDay].afternoon.map((sub, i) => (
                      <div key={i} style={{
                        padding: '0.5rem 0.2rem', textAlign: 'center', background: 'white',
                        border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, color: '#1f2937'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700 }}>T{i+6}</div>
                        {sub}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
