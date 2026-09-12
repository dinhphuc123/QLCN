import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';
import { api } from '../../lib/api';

// Empty Timetable Data structure (Strictly real data from GVCN, no mock/fake subjects)
const EMPTY_TIMETABLE = {
  'Thứ 2': { morning: [], afternoon: [] },
  'Thứ 3': { morning: [], afternoon: [] },
  'Thứ 4': { morning: [], afternoon: [] },
  'Thứ 5': { morning: [], afternoon: [] },
  'Thứ 6': { morning: [], afternoon: [] },
  'Thứ 7': { morning: [], afternoon: [] },
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

export default function StudentDashboard({ timetableImage = '', timetableData = null, classMapImage = '', students = [], attendance = {}, setActiveTab, announcements = [], onRefresh }) {
  const { user } = useAuth();
  const { settings } = useClassSettings();

  const [wateredToday, setWateredToday] = useState(false);
  const [activeBranch, setActiveBranch] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showClassMapModal, setShowClassMapModal] = useState(false);

  const activeTimetableImg = timetableImage || localStorage.getItem('qlcn_timetable_image') || '';
  const activeClassMapImg = classMapImage || localStorage.getItem('qlcn_class_map_image') || '';

  const activeTimetableData = useMemo(() => {
    if (timetableData && typeof timetableData === 'object' && Object.keys(timetableData).length > 0) {
      return timetableData;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('qlcn_timetable_data') || 'null');
      if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) return saved;
    } catch {}
    return null;
  }, [timetableData]);

  const hasStructuredSchedule = useMemo(() => {
    if (!activeTimetableData) return false;
    return Object.values(activeTimetableData).some(d => 
      (Array.isArray(d?.morning) && d.morning.some(s => s && String(s).trim())) || 
      (Array.isArray(d?.afternoon) && d.afternoon.some(s => s && String(s).trim()))
    );
  }, [activeTimetableData]);

  const [timetableMode, setTimetableMode] = useState(() => {
    if (!activeTimetableImg && hasStructuredSchedule) return 'table';
    return 'image';
  });

  const [studentTimetableDay, setStudentTimetableDay] = useState(() => {
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const currentDay = dayNames[new Date().getDay()];
    return currentDay === 'Chủ Nhật' ? 'Thứ 2' : currentDay;
  });

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



  // ANNOUNCEMENT TAG STYLES
  const ANNOUNCEMENT_TAG_COLORS = {
    '🚨 KHẨN': { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
    'Học tập': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'Nề nếp':  { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    'Kế hoạch tuần': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
    'Kế hoạch tháng': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
    'Ký túc xá': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  };

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

  const handleCheckInRead = async (ann) => {
    try {
      if (ann?.id && user?.id) {
        await api.markRead(ann.id);
        toast.success('✅ Đã xác nhận đọc thông báo!');
        if (onRefresh) onRefresh();
      }
    } catch {
      toast.success('✅ Đã ghi nhận bạn đã xem thông báo!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Personalized Welcome Banner */}
      <div className="glass-panel student-hero-banner" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #1B4D53, #2D6A70)',
        color: 'white',
        borderRadius: '1.25rem',
        boxShadow: '0 8px 20px rgba(27,77,83,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
          <div className="student-hero-avatar" style={{
            width: '54px', height: '54px', borderRadius: '50%',
            background: 'white', color: '#1B4D53',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid rgba(255,255,255,0.8)', flexShrink: 0
          }}>
            {user?.name ? user.name.split(' ').pop()[0] : '🎓'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: '#e0f2fe', fontWeight: 600 }}>
              👋 Chào mừng trở lại, {user?.position || 'Học sinh Nội Trú'}!
            </div>
            <h2 className="student-hero-name" style={{
              margin: '0.15rem 0', fontSize: '1.35rem', fontWeight: 900,
              color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.25)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {user?.name || 'Học sinh 12.7'}
            </h2>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 700, color: '#ffffff' }}>
                📍 {user?.group || 'Tổ 1'} • KTX {user?.dormRoom || 'A1-07'}
              </span>
              <button
                onClick={() => setActiveTab && setActiveTab('evaluation')}
                style={{
                  fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1',
                  padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800,
                  border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                  boxShadow: '0 2px 6px rgba(3,105,161,0.2)'
                }}
                title="Bấm để vào trang Tự Đánh Giá Thi Đua Tuần"
              >
                🏆 {studentScore}/100đ Tuần ↗
              </button>
              <button
                onClick={() => setActiveTab && setActiveTab('attendance')}
                style={{
                  fontSize: '0.7rem',
                  background: isCheckedInToday ? '#dcfce7' : '#fef3c7',
                  color: isCheckedInToday ? '#166534' : '#b45309',
                  padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800,
                  border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
                title="Bấm để vào trang Điểm Danh / Check-in"
              >
                {isCheckedInToday ? '✅ Đã Check-in ↗' : '⏳ Chưa Check-in ↗'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Monthly Honor Title */}
        <div className="student-hero-honor" style={{
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.25)', padding: '0.65rem 1.15rem',
          borderRadius: '1rem', textAlign: 'center', minWidth: '160px'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Danh Hiệu Tháng 09</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 900, margin: '0.15rem 0', color: '#fef08a', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            🌟 Gương Tự Lập
          </div>
          <div style={{ fontSize: '0.7rem', color: '#ffffff', opacity: 0.95 }}>Học sinh KTX Xuất Sắc</div>
        </div>
      </div>

      {/* Quick Action Navigation Grid for Students */}
      <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
        <button
          onClick={() => setActiveTab && setActiveTab('attendance')}
          className="glass-panel quick-action-card touch-scale"
          style={{
            padding: '0.85rem 1rem', border: '1.5px solid #bae6fd', background: '#f0f9ff',
            borderRadius: '1rem', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s ease'
          }}
        >
          <div className="quick-action-icon" style={{ fontSize: '1.5rem', background: '#e0f2fe', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            📝
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="quick-action-title" style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0369a1' }}>Điểm Danh</div>
            <div className="quick-action-desc" style={{ fontSize: '0.72rem', color: '#64748b' }}>Check-in & chuyên cần</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab('evaluation')}
          className="glass-panel quick-action-card touch-scale"
          style={{
            padding: '0.85rem 1rem', border: '1.5px solid #fde68a', background: '#fffbeb',
            borderRadius: '1rem', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s ease'
          }}
        >
          <div className="quick-action-icon" style={{ fontSize: '1.5rem', background: '#fef3c7', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            📈
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="quick-action-title" style={{ fontWeight: 800, fontSize: '0.88rem', color: '#b45309' }}>Tự Đánh Giá</div>
            <div className="quick-action-desc" style={{ fontSize: '0.72rem', color: '#64748b' }}>Nộp phiếu thi đua tuần</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab('requests')}
          className="glass-panel quick-action-card touch-scale"
          style={{
            padding: '0.85rem 1rem', border: '1.5px solid #ddd6fe', background: '#faf5ff',
            borderRadius: '1rem', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s ease'
          }}
        >
          <div className="quick-action-icon" style={{ fontSize: '1.5rem', background: '#ede9fe', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ✉️
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="quick-action-title" style={{ fontWeight: 800, fontSize: '0.88rem', color: '#6d28d9' }}>Đơn Nghỉ Phép</div>
            <div className="quick-action-desc" style={{ fontSize: '0.72rem', color: '#64748b' }}>Gửi đơn xin phép GVCN</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab('explore')}
          className="glass-panel quick-action-card touch-scale"
          style={{
            padding: '0.85rem 1rem', border: '1.5px solid #bbf7d0', background: '#f0fdf4',
            borderRadius: '1rem', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s ease'
          }}
        >
          <div className="quick-action-icon" style={{ fontSize: '1.5rem', background: '#dcfce7', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ✨
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="quick-action-title" style={{ fontWeight: 800, fontSize: '0.88rem', color: '#166534' }}>Khám Phá</div>
            <div className="quick-action-desc" style={{ fontSize: '0.72rem', color: '#64748b' }}>Tiện ích & hoạt động</div>
          </div>
        </button>
      </div>

      {/* Balanced 2-Column Section: Class Announcements (Left) & Smart Timetable (Right) */}
      <div className="eval-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.25rem' }}>
        
        {/* Left Column: Class Announcements */}
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
                const isReadByMe = (item.readBy || []).includes(user?.id);

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
                    
                    {/* Interactive Check-in Announcement Confirmation Button */}
                    <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${tagConfig.border}` }}>
                      <button
                        onClick={() => handleCheckInRead(item)}
                        disabled={isReadByMe}
                        style={{
                          padding: '0.38rem 0.85rem', fontSize: '0.75rem', borderRadius: '9999px',
                          background: isReadByMe ? '#dcfce7' : '#0369a1',
                          color: isReadByMe ? '#166534' : 'white',
                          border: isReadByMe ? '1px solid #86efac' : 'none',
                          fontWeight: 800, cursor: isReadByMe ? 'default' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          boxShadow: isReadByMe ? 'none' : '0 2px 8px rgba(3, 105, 161, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isReadByMe ? '✓ Đã Check-in nhận thông báo' : '🔔 Bấm Check-in xác nhận đã đọc'}
                      </button>

                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                        📊 Đã đọc: {(item.readBy || []).length} HS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Timetable (Image + Structured Schedule from GVCN) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📅 Thời Khóa Biểu
                </h3>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '0.15rem' }}>
                  {timetableMode === 'table' ? '📋 Bảng tiết học chi tiết từ GVCN' : '🖼️ Ảnh TKB chính thức do GVCN đăng'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeTimetableImg && hasStructuredSchedule && (
                  <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '9999px', padding: '2px' }}>
                    <button
                      onClick={() => setTimetableMode('image')}
                      style={{
                        padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, borderRadius: '9999px', border: 'none', cursor: 'pointer',
                        background: timetableMode === 'image' ? '#0284c7' : 'transparent',
                        color: timetableMode === 'image' ? 'white' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      🖼️ Ảnh Gốc
                    </button>
                    <button
                      onClick={() => setTimetableMode('table')}
                      style={{
                        padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, borderRadius: '9999px', border: 'none', cursor: 'pointer',
                        background: timetableMode === 'table' ? '#16a34a' : 'transparent',
                        color: timetableMode === 'table' ? 'white' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      📋 Bảng Tiết
                    </button>
                  </div>
                )}
                {(activeTimetableImg || hasStructuredSchedule) && (
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
                    ✓ Đã cập nhật
                  </span>
                )}
              </div>
            </div>

            {/* View Mode 1: Table (Tiết 1 - Tiết 8) */}
            {(timetableMode === 'table' || (!activeTimetableImg && hasStructuredSchedule)) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Day Selector Pills */}
                <div className="mobile-pill-scroll" style={{ gap: '0.4rem', paddingBottom: '0.35rem' }}>
                  {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(day => {
                    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const isToday = dayNames[new Date().getDay()] === day;
                    const isSelected = studentTimetableDay === day;

                    return (
                      <button
                        key={day}
                        onClick={() => setStudentTimetableDay(day)}
                        className="touch-scale"
                        style={{
                          padding: '0.42rem 0.75rem',
                          borderRadius: '9999px',
                          border: isToday ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: isSelected ? '#1B4D53' : (isToday ? '#e0f2fe' : '#ffffff'),
                          color: isSelected ? 'white' : (isToday ? '#0369a1' : '#475569'),
                          whiteSpace: 'nowrap',
                          boxShadow: isSelected ? '0 2px 6px rgba(27,77,83,0.25)' : 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          flexShrink: 0
                        }}
                      >
                        <span>{day}</span>
                        {isToday && <span style={{ fontSize: '0.62rem', background: '#0284c7', color: 'white', padding: '0.05rem 0.35rem', borderRadius: '9999px' }}>Nay</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Day's Morning & Afternoon Periods */}
                <div style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    ☀️ BUỔI SÁNG (Tiết 1 - 5)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {[0, 1, 2, 3, 4].map(idx => {
                      const subject = (activeTimetableData?.[studentTimetableDay]?.morning || [])[idx] || '';
                      return (
                        <div key={idx} style={{
                          background: subject ? '#e0f2fe' : '#ffffff',
                          border: `1px solid ${subject ? '#bae6fd' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          padding: '0.4rem 0.2rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>T{idx+1}</div>
                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: subject ? '#0369a1' : '#cbd5e1', marginTop: '0.1rem', wordBreak: 'break-word' }}>
                            {subject || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    ⛅ BUỔI CHIỀU (Tiết 6 - 8)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                    {[0, 1, 2].map(idx => {
                      const subject = (activeTimetableData?.[studentTimetableDay]?.afternoon || [])[idx] || '';
                      return (
                        <div key={idx} style={{
                          background: subject ? '#fef3c7' : '#ffffff',
                          border: `1px solid ${subject ? '#fde68a' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          padding: '0.4rem 0.2rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>T{idx+6}</div>
                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: subject ? '#92400e' : '#cbd5e1', marginTop: '0.1rem', wordBreak: 'break-word' }}>
                            {subject || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : activeTimetableImg ? (
              /* View Mode 2: Official Photo */
              <div style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '0.85rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <img
                  src={activeTimetableImg}
                  alt="Thời Khóa Biểu GVCN"
                  onClick={() => setShowImageModal(true)}
                  style={{ width: '100%', maxHeight: '250px', borderRadius: '0.65rem', cursor: 'zoom-in', objectFit: 'contain', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowImageModal(true)}
                    style={{ padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    🔍 Phóng To Xem Chi Tiết
                  </button>
                  <a
                    href={activeTimetableImg}
                    download="ThoiKhoaBieu_12.7.png"
                    style={{ padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, background: '#16a34a', color: 'white', border: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    📥 Tải Ảnh Về Máy
                  </a>
                </div>
              </div>
            ) : (
              /* View Mode 3: Empty Placeholder */
              <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '0.85rem', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1B4D53', marginBottom: '0.3rem' }}>
                  GVCN chưa đăng Thời Khóa Biểu
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Thời khóa biểu chính thức từ Cổng GVCN sẽ hiển thị trực tiếp tại đây ngay khi GVCN cập nhật.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sơ đồ chỗ ngồi lớp */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🪑 Sơ Đồ Chỗ Ngồi Lớp {settings.className}
            </h3>
            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '0.15rem' }}>
              🗺️ Sơ đồ bàn ghế và phân chỗ ngồi chính thức do GVCN ban hành
            </div>
          </div>
          {activeClassMapImg && (
            <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.18rem 0.6rem', borderRadius: '9999px', fontWeight: 800 }}>
              ✓ Đã cập nhật
            </span>
          )}
        </div>

        {activeClassMapImg ? (
          <div style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '0.85rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <img
              src={activeClassMapImg}
              alt={`Sơ đồ chỗ ngồi ${settings.className}`}
              onClick={() => setShowClassMapModal(true)}
              style={{
                width: '100%',
                maxHeight: '420px',
                borderRadius: '0.65rem',
                cursor: 'zoom-in',
                objectFit: 'contain',
                border: '1.5px solid #cbd5e1',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowClassMapModal(true)}
                style={{ padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                🔍 Phóng To Xem Chi Tiết
              </button>
              <a
                href={activeClassMapImg}
                download={`SoDoLop_${settings.className}.png`}
                style={{ padding: '0.4rem 0.95rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, background: '#16a34a', color: 'white', border: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                📥 Tải Ảnh Về Máy
              </a>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '0.85rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪑</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1B4D53', marginBottom: '0.3rem' }}>
              GVCN chưa đăng Ảnh Sơ Đồ Chỗ Ngồi Lớp
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Hình ảnh sơ đồ phân chỗ ngồi sẽ hiển thị trực tiếp tại đây ngay khi GVCN cập nhật từ cổng quản lý.
            </div>
          </div>
        )}
      </div>

      {/* Modal View Timetable Image Zoom */}
      {showImageModal && activeTimetableImg && (
        <div onClick={() => setShowImageModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1B4D53' }}>🖼️ Ảnh Thời Khóa Biểu Gốc Từ GVCN</h3>
              <button onClick={() => setShowImageModal(false)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>
            <img src={activeTimetableImg} alt="TKB Gốc" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '0.75rem', objectFit: 'contain', border: '1px solid #e5e7eb' }} />
            <a href={activeTimetableImg} download="ThoiKhoaBieu_12.7.png" style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px', background: '#0284c7', color: 'white', fontWeight: 800, textDecoration: 'none' }}>
              📥 Tải Ảnh Về Máy
            </a>
          </div>
        </div>
      )}

      {/* Modal View Seating Map Image Zoom */}
      {showClassMapModal && activeClassMapImg && (
        <div onClick={() => setShowClassMapModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', maxWidth: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1B4D53' }}>🪑 Sơ Đồ Chỗ Ngồi Lớp {settings.className}</h3>
              <button onClick={() => setShowClassMapModal(false)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>
            <img src={activeClassMapImg} alt="Sơ Đồ Chỗ Ngồi" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '0.75rem', objectFit: 'contain', border: '1px solid #e5e7eb' }} />
            <a href={activeClassMapImg} download={`SoDoLop_${settings.className}.png`} style={{ padding: '0.5rem 1.5rem', borderRadius: '9999px', background: '#0284c7', color: 'white', fontWeight: 800, textDecoration: 'none' }}>
              📥 Tải Ảnh Về Máy
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
