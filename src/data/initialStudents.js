// Dữ liệu MOCK 32 học sinh lớp 12.7 — Dành riêng cho Repository Public & Bản Demo
// TUÂN THỦ NGHỊ ĐỊNH 13/2023/NĐ-CP: Toàn bộ danh tính, số điện thoại, địa chỉ đều là dữ liệu giả định (MOCK DATA)
// Toàn bộ dữ liệu thật của lớp 12.7 được lưu trữ an toàn và bảo mật trên Supabase Cloud Database

export const CLASS_INFO = {
  className: '12.7',
  name: '12.7',
  school: 'Trường Phổ thông Dân tộc Nội trú',
  schoolYear: '2026 - 2027',
  teacher: 'Đỗ Kim Tuyền',
  totalStudents: 32,
  female: 23,
  male: 9,
  dormRooms: ['A1-07', 'A1-08', 'A1-09', 'A1-10', 'A1-11', 'C08'],
  groups: ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4']
};

const MOCK_FIRST_NAMES = [
  'An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Khang', 
  'Lam', 'Linh', 'Minh', 'Nam', 'Nga', 'Oanh', 'Phúc', 'Quân',
  'Sơn', 'Tâm', 'Thảo', 'Thịnh', 'Trang', 'Trung', 'Tú', 'Uyên',
  'Vinh', 'Vũ', 'Xuân', 'Yến', 'Hòa', 'Kiệt', 'Bảo', 'Khoa'
];

const MOCK_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
const ETHNICITIES = ['Kinh', 'Tày', 'Chăm', 'Cơ-ho', 'Ra-glai', 'Nùng', 'Mường', 'Thái'];

export const INITIAL_STUDENTS = Array.from({ length: 32 }, (_, i) => {
  const id = i + 1;
  const isFemale = id % 3 !== 0;
  const lastName = MOCK_LAST_NAMES[id % MOCK_LAST_NAMES.length];
  const midName = isFemale ? 'Thị' : 'Văn';
  const firstName = MOCK_FIRST_NAMES[i];
  const fullName = `${lastName} ${midName} ${firstName}`;
  const group = `Tổ ${(id % 4) + 1}`;
  const dormRoom = CLASS_INFO.dormRooms[id % CLASS_INFO.dormRooms.length];
  const ethnicity = ETHNICITIES[id % ETHNICITIES.length];

  let role = 'member';
  let position = '';
  if (id === 1) { role = 'monitor'; position = 'Lớp trưởng'; }
  else if (id === 2) { role = 'vice_monitor'; position = 'Lớp phó học tập'; }
  else if (id === 3) { role = 'group_leader'; position = 'Tổ trưởng Tổ 1'; }
  else if (id === 7) { role = 'group_leader'; position = 'Tổ trưởng Tổ 2'; }
  else if (id === 15) { role = 'group_leader'; position = 'Tổ trưởng Tổ 3'; }
  else if (id === 23) { role = 'group_leader'; position = 'Tổ trưởng Tổ 4'; }
  else if (id === 5) { role = 'room_leader'; position = `Trưởng phòng ${dormRoom}`; }

  const gpa = Number((6.5 + (id * 0.1) % 3.4).toFixed(2));
  const rank = gpa >= 8.0 ? 'Tốt' : gpa >= 6.5 ? 'Khá' : 'Đạt';

  return {
    id,
    studentCode: `2404766${String(100 + id).padStart(3, '0')}`,
    name: fullName,
    gender: isFemale ? 'Nữ' : 'Nam',
    dob: `${String((id * 3) % 28 + 1).padStart(2, '0')}/${String((id % 12) + 1).padStart(2, '0')}/2009`,
    ethnicity,
    address: `Thôn Mẫu ${id}, Xã Demo, Tỉnh Lâm Đồng`,
    phone: `0901***${String(id).padStart(3, '0')}`,
    motherName: `Mẹ HS ${String(id).padStart(2, '0')}`,
    motherPhone: `0912***${String(id).padStart(3, '0')}`,
    fatherName: `Bố HS ${String(id).padStart(2, '0')}`,
    fatherPhone: `0913***${String(id).padStart(3, '0')}`,
    group,
    dormRoom,
    role,
    position,
    isPoor: id % 7 === 0,
    points: 100,
    prevGPA: gpa,
    prevRank: rank,
    prevConduct: 'Tốt',
    prevTitle: gpa >= 8.0 ? 'Học sinh Giỏi' : '',
    prevAbsencePermit: id % 5 === 0 ? 1 : 0,
    prevAbsenceNo: 0,
    note: id % 7 === 0 ? 'Diện hỗ trợ học sinh DTTS' : '',
    seatIndex: id - 1
  };
});

// Cán bộ lớp 18 chức vụ (Dữ liệu MOCK an toàn)
export const CLASS_OFFICERS = [
  { position: 'Lớp trưởng', name: 'Nguyễn Văn An', phone: '0901***001', studentId: 1 },
  { position: 'Lớp phó học tập', name: 'Trần Thị Bình', phone: '0901***002', studentId: 2 },
  { position: 'Lớp phó văn thể', name: 'Lê Hoàng Cường', phone: '0901***003', studentId: 3 },
  { position: 'Lớp phó lao động', name: 'Phạm Minh Dũng', phone: '0901***004', studentId: 4 },
  { position: 'Lớp phó đời sống', name: 'Hoàng Kim Oanh', phone: '0901***005', studentId: 5 },
  { position: 'Tổ trưởng Tổ 1', name: 'Lê Hoàng Cường', phone: '0901***003', studentId: 3, groupLeaderOf: 'Tổ 1' },
  { position: 'Tổ trưởng Tổ 2', name: 'Vũ Thị Hải', phone: '0901***007', studentId: 7, groupLeaderOf: 'Tổ 2' },
  { position: 'Tổ trưởng Tổ 3', name: 'Đặng Văn Phúc', phone: '0901***015', studentId: 15, groupLeaderOf: 'Tổ 3' },
  { position: 'Tổ trưởng Tổ 4', name: 'Bùi Thị Tú', phone: '0901***023', studentId: 23, groupLeaderOf: 'Tổ 4' },
  { position: 'Trưởng phòng A1-07', name: 'Hoàng Kim Oanh', phone: '0901***005', studentId: 5 },
  { position: 'Trưởng phòng A1-08', name: 'Vũ Thị Hải', phone: '0901***007', studentId: 7 },
  { position: 'Trưởng phòng A1-09', name: 'Ngô Văn Khang', phone: '0901***008', studentId: 8 },
  { position: 'Trưởng phòng A1-10', name: 'Trịnh Thị Linh', phone: '0901***010', studentId: 10 },
  { position: 'Trưởng phòng A1-11', name: 'Trần Thị Bình', phone: '0901***002', studentId: 2 },
  { position: 'Trưởng phòng C08', name: 'Đỗ Văn Minh', phone: '0901***011', studentId: 11 },
  { position: 'Bí thư Đoàn', name: 'Huỳnh Thị Thảo', phone: '0901***019', studentId: 19 },
  { position: 'Cờ đỏ', name: 'Bùi Thị Tú', phone: '0901***023', studentId: 23 },
  { position: 'Cờ đỏ', name: 'Lý Văn Nam', phone: '0901***012', studentId: 12 },
];