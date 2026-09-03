# 🏫 Sổ Chủ Nhiệm Số — Lớp 12.7 (Năm Học 2026 – 2027)

> **Hệ thống Quản lý Toàn diện Dành cho Giáo viên Chủ nhiệm & Lớp Học Nội Trú THPT**  
> *Được tối ưu hóa cho mô hình học sinh dân tộc thiểu số tại Trường Phổ thông Dân tộc Nội trú (PTDTNT).*

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://qlcn-psi.vercel.app)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646cff?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285f4?logo=google)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/Compliance-Ngh%E1%BB%8B%20%C4%91%E1%BB%8Bnh%2013%2F2023%2FN%C4%90--CP-green)](https://chinhphu.vn)

---

## 🌟 Giới thiệu

**Sổ Chủ Nhiệm Số (QLCN)** là nền tảng số hóa hỗ trợ **Giáo viên chủ nhiệm (Cô Đỗ Kim Tuyền)** cùng Ban cán sự lớp quản lý học sinh nội trú 24/7. Hệ thống giải quyết trọn vẹn các bài toán đặc thù của trường nội trú: điểm danh 5 buổi/ngày, chấm thi đua 47 tiêu chí, theo dõi KTX tắt đèn, hướng nghiệp dân tộc thiểu số và cầu nối hòm thư tâm sự học đường.

---

## 🚀 Các Tính Năng Nổi Bật

1. **📊 Bảng Điều Khiển Tổng Quan (Dashboard):**
   - Theo dõi sĩ số thời gian thực, số học sinh vắng trong ngày.
   - Sơ đồ chỗ ngồi thông minh với 4 thuật toán tự động: *Đôi bạn cùng tiến (Giỏi kèm Yếu), Đan xen Nam - Nữ, Phân bổ theo Tổ, Ngẫu nhiên*.
   - Thời khóa biểu động cập nhật tức thì.
   - Bảng vàng vinh danh Tổ & Cá nhân xuất sắc hàng tuần.

2. **📝 Điểm Danh 5 Buổi/Ngày (Boarding School Attendance):**
   - ☀️ Buổi Sáng (07:00)
   - 🌤️ Buổi Chiều (13:30)
   - 📖 Tự học tối (19:30 - 21:30)
   - 🛏️ Đi ngủ KTX tắt đèn (22:30)
   - 🏃 Hoạt động tập thể / Ngoại khóa
   - Học sinh tự check-in nhanh; GVCN có tính năng Khóa sổ bảo mật.

3. **📈 Chấm Thi Đua 47 Tiêu Chí (3-Tier Approval Workflow):**
   - Quy chế điểm chuẩn 100 điểm/tuần bám sát kỷ luật nội trú.
   - Quy trình duyệt 3 cấp: *Học sinh tự đánh giá $\rightarrow$ Cán sự lớp rà soát $\rightarrow$ GVCN duyệt tối hậu*.
   - Biểu đồ theo dõi tiến độ nề nếp cá nhân qua từng tuần.

4. **🤖 Trợ Lý Sư Phạm AI (Google Gemini 2.5 Flash):**
   - Tự động phân tích học bạ, điểm thi đua và chuyên cần để soạn **Báo cáo Họp Phụ Huynh**.
   - Soạn tin nhắn Zalo/SMS ân cần gửi cha mẹ học sinh hàng tuần.

5. **🤫 Hòm Thư Tâm Sự Ẩn Danh (Confessions):**
   - Kênh kết nối giải tỏa áp lực tâm lý cho học sinh xa nhà, phát hiện sớm các vấn đề tâm lý học đường.

6. **📋 Sổ Quỹ Lớp Minh Bạch & Xuất Báo Cáo Chuẩn BGH:**
   - Quản lý Thu - Chi quỹ lớp realtime.
   - Xuất Báo cáo sơ kết nề nếp theo thể thức văn bản hành chính Việt Nam.

---

## 🔒 Bảo Mật & Tuân Thủ Nghị Định 13/2023/NĐ-CP

- **Dữ liệu thật lưu trữ an toàn trên Supabase Cloud Database** với mã hóa đường truyền SSL và Service Role Key trên máy chủ Serverless.
- **Repository GitHub chỉ chứa Mock Data (dữ liệu mẫu ẩn danh)** nhằm mục đích demo giao diện, không công khai bất kỳ thông tin cá nhân hay số điện thoại nào của học sinh.
- **Mật khẩu GVCN và mã PIN học sinh được băm bảo mật bằng thuật toán Bcrypt**, xác thực qua JWT Token có thời hạn.

---

## 🛠️ Cài Đặt & Chạy Thử (Local Development)

### 1. Yêu cầu hệ thống
- Node.js $\ge$ 18.x
- npm $\ge$ 9.x

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` từ mẫu `.env.example`:
```bash
cp .env.example .env.local
```
Điền các thông số Supabase và Gemini API:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secure-random-jwt-secret-key-32-chars
TEACHER_PASSWORD=your-teacher-password
GEMINI_API_KEY=your-google-gemini-api-key
```

### 4. Khởi chạy ứng dụng
Chạy song song cả Frontend Vite và Backend Serverless:
```bash
# Terminal 1: Chạy Vite Dev Server
npm run dev

# Terminal 2: Chạy Backend Server
npm run server
```

---

## ☁️ Hướng Dẫn Di Chuyển Dữ Liệu Lên Supabase (Migration)

1. Mở Supabase Dashboard $\rightarrow$ **SQL Editor**.
2. Copy toàn bộ nội dung file `supabase_schema.sql` và bấm **Run** để khởi tạo 13 bảng.
3. Chạy script đẩy dữ liệu và tự động sinh mã PIN bảo mật cho học sinh:
```bash
node scripts/migrate_to_supabase.js
```
*Script sẽ tự động sinh file `student_pins_handover.csv` (chỉ lưu trên máy cá nhân) để GVCN bàn giao mã PIN cho từng em.*
