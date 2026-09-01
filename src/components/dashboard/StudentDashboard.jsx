import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useClassSettings } from '../../context/ClassSettingsContext';

// Default Timetable Data if not provided
const DEFAULT_TIMETABLE = {
  'Thứ 2': { morning: ['Chào cờ', 'Toán', 'Toán', 'Văn', 'Tiếng Anh'], afternoon: ['Lịch sử', 'Địa lý', 'Sinh học'] },
  'Thứ 3': { morning: ['Vật lý', 'Vật lý', 'Hóa học', 'Toán', 'Tin học'], afternoon: ['Thể dục', 'Thể dục'] },
  'Thứ 4': { morning: ['Văn', 'Văn', 'Toán', 'Tiếng Anh', 'GDCD'], afternoon: ['Hóa học', 'Sinh học'] },
  'Thứ 5': { morning: ['Toán', 'Toán', 'Vật lý', 'Văn', 'Công nghệ'], afternoon: ['Tiếng Anh', 'Hoạt động trải nghiệm'] },
  'Thứ 6': { morning: ['Tiếng Anh', 'Tiếng Anh', 'Hóa học', 'Toán', 'Sinh học'], afternoon: ['Lịch sử', 'Địa lý'] },
  'Thứ 7': { morning: ['Toán', 'Văn', 'Vật lý', 'Sinh hoạt lớp', 'Sinh hoạt Đoàn'], afternoon: [] },
};

const TREE_STAGES = [
  { level: 1, minPts: 0,   maxPts: 60,  name: '🌱 Hạt Mầm Nảy Mầm',    desc: 'Bắt đầu hành trình rèn luyện nề nếp', color: '#16a34a', icon: '🌱' },
  { level: 2, minPts: 61,  maxPts: 80,  name: '🌿 Cây Con Vươn Lên',   desc: 'Duy trì check-in & nề nếp đúng giờ', color: '#0d9488', icon: '🌿' },
  { level: 3, minPts: 81,  maxPts: 90,  name: '🌳 Cây Xanh Xum Xuê',   desc: 'Tích cực học tập & rèn luyện xuất sắc', color: '#0284c7', icon: '🌳' },
  { level: 4, minPts: 91,  maxPts: 98,  name: '🌸 Cây Khoe Sắc Hoa',    desc: 'Cán bộ tiêu biểu, gặt hái thành tích', color: '#d97706', icon: '🌸' },
  { level: 5, minPts: 99,  maxPts: 120, name: '🍎 Cây Trĩu Quả Ngọt',   desc: 'Trưởng thành toàn diện, tấm gương lớp', color: '#7c3aed', icon: '🍎' },
];

export default function StudentDashboard({ students = [], attendance = {}, setActiveTab, announcements = [], onRefresh }) {
  const { user } = useAuth();
  const { settings } = useClassSettings();
  const [wateredToday, setWateredToday] = useState(false);
  const [waterBonus, setWaterBonus] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => {
    const dayIndex = new Date().getDay(); // 0 is Sun, 1 Mon...
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayIndex] && DEFAULT_TIMETABLE[days[dayIndex]] ? days[dayIndex] : 'Thứ 2';
  });

  // Current student record
  const currentStudent = useMemo(() => {
    if (!user) return null;
    return students.find(s => s.id === user.id) || {
      id: user.id || 1,
      name: user.name || 'Học sinh',
      points: 92,
      group: user.group || 'Tổ 1',
      dormRoom: user.dormRoom || 'A1-07',
      position: user.position || 'Học sinh',
    };
  }, [user, students]);

  const rawScore = (currentStudent?.points || 90) + waterBonus;
  const currentStage = TREE_STAGES.find(s => rawScore >= s.minPts && rawScore <= s.maxPts) || TREE_STAGES[2];
  const progressPct = Math.min(100, Math.max(0, ((rawScore - currentStage.minPts) / (currentStage.maxPts - currentStage.minPts)) * 100));

  const today = new Date().toISOString().split('T')[0];
  const todayAtt = attendance[today] || {};
  const isCheckedInToday = todayAtt[user?.id] === 'present' || (todayAtt.sessions && todayAtt.sessions.morning && todayAtt.sessions.morning[user?.id] === 'present');

  const handleWaterTree = () => {
    if (wateredToday) {
      toast('Hôm nay bạn đã chăm sóc cây rồi! 🌿', { icon: '💧' });
      return;
    }
    setWateredToday(true);
    setWaterBonus(b => b + 2);
    toast.success('🎉 Bạn đã tưới nước rèn luyện! (+2 điểm tinh thần)');
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
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'white', color: '#1B4D53',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {user?.name ? user.name.split(' ').pop()[0] : '🎓'}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 600 }}>
              👋 Chào mừng trở lại, {user?.position || 'Học sinh'}!
            </div>
            <h2 style={{ margin: '0.2rem 0', fontSize: '1.4rem', fontWeight: 800 }}>
              {user?.name || 'Học sinh 12.7'}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 700 }}>
                📍 {user?.group || 'Tổ 1'} • Phòng {user?.dormRoom || 'KTX'}
              </span>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                🏆 {rawScore} Điểm rèn luyện
              </span>
              <span style={{ fontSize: '0.72rem', background: isCheckedInToday ? '#dcfce7' : '#fef3c7', color: isCheckedInToday ? '#166534' : '#b45309', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 800 }}>
                {isCheckedInToday ? '✅ Đã Check-in Hôm Nay' : '⏳ Chưa Check-in'}
              </span>
            </div>
          </div>
        </div>

        {/* Growth Level Tag */}
        <div style={{
          background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 1.25rem',
          borderRadius: '1rem', textAlign: 'center', minWidth: '160px'
        }}>
          <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cấp Độ Trưởng Thành</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.2rem 0', color: '#fef08a' }}>
            {currentStage.icon} Cấp {currentStage.level}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{currentStage.name.split(' ').slice(1).join(' ')}</div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.25rem' }}>
        
        {/* Left Column: Growth Tree & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Cây Rèn Luyện & Trưởng Thành Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-dark)' }}>
                  🌳 Cây Rèn Luyện & Trưởng Thành
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                  Phát triển từng ngày qua quá trình đi học đúng giờ & nề nếp
                </p>
              </div>
              <button
                onClick={handleWaterTree}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700,
                  background: wateredToday ? '#9ca3af' : 'linear-gradient(135deg,#0284c7,#0369a1)',
                  color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  boxShadow: '0 4px 10px rgba(2,132,199,0.2)'
                }}
              >
                💧 {wateredToday ? 'Đã Tưới Hôm Nay' : 'Tưới Nước Rèn Luyện'}
              </button>
            </div>

            {/* Tree Visual Illustration */}
            <div style={{
              background: 'linear-gradient(180deg, #f0fdf4 0%, #e0f2fe 100%)',
              borderRadius: '1rem', padding: '1.5rem', textAlign: 'center',
              border: '1.5px solid #bbf7d0', position: 'relative', marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.1))', transform: 'scale(1.1)', transition: 'all 0.3s ease' }}>
                {currentStage.icon}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: currentStage.color, marginTop: '0.5rem' }}>
                {currentStage.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '0.2rem' }}>
                {currentStage.desc}
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.25rem' }}>
                  <span>Tiến độ cấp {currentStage.level}</span>
                  <span>{Math.round(progressPct)}% ({rawScore}/{currentStage.maxPts} điểm)</span>
                </div>
                <div style={{ height: '8px', background: '#d1d5db', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#16a34a,#0284c7)', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>

            {/* Stages Milestones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', textAlign: 'center' }}>
              {TREE_STAGES.map(s => {
                const isActive = currentStage.level >= s.level;
                return (
                  <div key={s.level} style={{
                    padding: '0.35rem 0.2rem', borderRadius: '0.5rem',
                    background: isActive ? '#f0fdf4' : '#f3f4f6',
                    border: `1px solid ${isActive ? '#86efac' : '#e5e7eb'}`,
                    opacity: isActive ? 1 : 0.6
                  }}>
                    <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? '#166534' : '#6b7280' }}>Cấp {s.level}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Quick Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <button
              onClick={() => setActiveTab('attendance')}
              className="glass-panel"
              style={{
                padding: '1.1rem', borderRadius: '1rem', border: '1.5px solid #7dd3fc',
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>📌</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0369a1' }}>Tự Check-in</div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.15rem' }}>Điểm danh 5 buổi học</div>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className="glass-panel"
              style={{
                padding: '1.1rem', borderRadius: '1rem', border: '1.5px solid #fde68a',
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>📝</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#b45309' }}>Tự Đánh Giá</div>
              <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: '0.15rem' }}>Nề nếp & Thi đua tuần</div>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className="glass-panel"
              style={{
                padding: '1.1rem', borderRadius: '1rem', border: '1.5px solid #c084fc',
                background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
                cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>✉️</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#6b21a8' }}>Đơn Xin Nghỉ</div>
              <div style={{ fontSize: '0.72rem', color: '#7e22ce', marginTop: '0.15rem' }}>Gửi GVCN phê duyệt</div>
            </button>

            <button
              onClick={() => setActiveTab('confessions')}
              className="glass-panel"
              style={{
                padding: '1.1rem', borderRadius: '1rem', border: '1.5px solid #fbcfe8',
                background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>💬</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#9d174d' }}>Hòm Tâm Sự</div>
              <div style={{ fontSize: '0.72rem', color: '#be185d', marginTop: '0.15rem' }}>Chia sẻ riêng với thầy cô</div>
            </button>
          </div>

        </div>

        {/* Right Column: Announcements & Smart Timetable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Class Announcements */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>📢 Thông Báo Mới</h3>
              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                Tuần 01
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {announcements && announcements.length > 0 ? (
                announcements.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>📌 {item.title || 'Thông báo lớp'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '0.2rem' }}>{item.content || item.body}</div>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>📌 Nhắc nhở nề nếp tuần 01</div>
                    <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '0.2rem' }}>
                      Các bạn Tổ trưởng hoàn thành duyệt nề nếp vòng 1 trước 17h thứ 6. Học sinh thực hiện check-in đủ 5 buổi.
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e40af' }}>📢 Lịch sinh hoạt KTX tuần này</div>
                    <div style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: '0.2rem' }}>
                      Trưởng phòng KTX kiểm tra vệ sinh phòng lúc 21h30 hằng ngày. Tắt đèn đúng 22h30.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Smart Timetable Widget */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>📅 Thời Khóa Biểu</h3>
              <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                {Object.keys(DEFAULT_TIMETABLE).map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                      background: selectedDay === day ? '#1B4D53' : '#f3f4f6',
                      color: selectedDay === day ? 'white' : '#4b5563',
                      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Timetable Table */}
            <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1B4D53', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Lịch Học: {selectedDay}</span>
                <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>Sáng 5 Tiết • Chiều 3 Tiết</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>☀️ Buổi Sáng (07:00 - 11:30)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
                  {(DEFAULT_TIMETABLE[selectedDay]?.morning || []).map((sub, i) => (
                    <div key={i} style={{
                      padding: '0.4rem 0.2rem', textAlign: 'center', background: 'white',
                      border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#1f2937'
                    }}>
                      <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 600 }}>T{i+1}</div>
                      {sub}
                    </div>
                  ))}
                </div>

                {(DEFAULT_TIMETABLE[selectedDay]?.afternoon || []).length > 0 && (
                  <>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginTop: '0.4rem' }}>⛅ Buổi Chiều (13:30 - 17:00)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                      {DEFAULT_TIMETABLE[selectedDay].afternoon.map((sub, i) => (
                        <div key={i} style={{
                          padding: '0.4rem 0.2rem', textAlign: 'center', background: 'white',
                          border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#1f2937'
                        }}>
                          <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 600 }}>T{i+6}</div>
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

    </div>
  );
}
