# KẾ HOẠCH THỰC HIỆN PHẦN MỀM QUẢN LÝ TÀI KHOẢN THREADS

## 1. Mục tiêu Dự án
Xây dựng một ứng dụng Desktop sử dụng Electron JS chuyên dụng cho việc quản lý hàng loạt tài khoản Threads, tự động hóa các tác vụ (đăng bài, tương tác, nuôi tài khoản), quản lý proxy/fingerprint và thu thập dữ liệu tự động.

## 2. Kiến trúc Kỹ thuật & Công nghệ (Tech Stack)
- **Frontend (UI):** Electron.js kết hợp với React.js (hoặc HTML/CSS/JS tĩnh + Tailwind CSS) với thiết kế Dark Theme hiện đại.
- **Backend (Main Process):** Node.js.
- **Database:** SQLite (local database) kết hợp Prisma ORM hoặc Knex.js để dễ dàng thao tác dữ liệu.
- **Automation Engine:** Playwright để điều khiển trình duyệt ẩn danh (headless browser), có khả năng giả lập hành vi người dùng, quản lý proxy, fake browser fingerprint độc lập.
- **Trạng thái & Lập lịch:** Sử dụng cơ chế hàng đợi (Worker Queues) và Lập lịch chạy nền (Cron Jobs) để chạy song song nhiều tài khoản tối ưu tài nguyên (tối đa 50 luồng trên máy trung bình).

## 3. Phân tích UI/UX (Được trích xuất từ Mockups)
- **Layout Cốt lõi:** Sử dụng dạng Sidebar Navigation (Menu trái), khu vực hiển thị chính (phải). Toàn bộ hệ thống dùng Dark Mode chủ đạo, điểm nhấn các mảng màu cảnh báo (Status Box).
- **Dashboard:** Hiển thị thống kê tổng (Tổng tài khoản, Trạng thái tài khoản, Lượt bài), Biểu đồ tăng trưởng, Bảng Log theo thời gian thực và thông số CPU/RAM hệ thống.
- **Quản lý Tài khoản (Acct Management):** Bảng điều khiển tối ưu cho lượng dữ liệu lớn. Các tính năng lọc sâu theo Nhóm, Trạng thái, Proxy. Thích hợp các thao tác nhóm (Bulk Actions).
- **Trình Quản lý Bài đăng (Post Management):** 3 cột thao tác rõ ràng (Soạn nội dung hỗ trợ Spintax - Cấu hình hẹn giờ - Hàng đợi bài đăng ưu tiên).
- **Luồng Nuôi Tài Khoản (Account Farming):** Thiết kế giao diện như một Workflow Builder cho phép kéo thả/add các Node hành động (Scroll Feed -> Like -> Wait -> Post) hình thành kịch bản mô phỏng người dùng thật.

## 4. Chi tiết Các Module & Roadmap (Implementation Plan)

### Pha 1: Setup Nền tảng & Module Tài Khoản (MVP - Ước lượng: 1-2 Tuần)
1. **Hạ tầng:** Cài đặt Boilerplate Electron + UI Framework + SQLite.
2. **Database:** Cấu trúc bảng `Accounts`, `Proxies`, `Groups`.
3. **UI/UX:** Thiết kế phần khung vỏ và màn hình Account Management.
4. **Chức năng Backend:**
   - Thực hiện logic Import/Export (File TXT/Excel) tài khoản vào SQLite.
   - Thêm/Xóa/Sửa thông tin Proxy và gán Proxy cho từng Tài khoản.
   - Tự động Check Live/Die trạng thái tài khoản thông qua script Playwright cơ bản.

### Pha 2: Module Auto Post & Quản Lý Kế Hoạch Đăng Bài (Ước lượng: 1-2 Tuần)
1. **Hạ tầng:** Bảng `Posts`, `Schedules`, thuật toán phân tích Spintax `{hello|hi}`.
2. **UI/UX:** Dựng theo Mockup màn hình Post Management.
3. **Chức năng Backend:**
   - Cơ chế lưu ảnh đính kèm cục bộ và upload.
   - Trình lập lịch chạy nền (Queuer) đẩy danh sách bài từ Database lên trình duyệt để xuất bản tự động trên Threads.
   - Báo cáo lỗi và ghi nhận trạng thái Canceled/Pending/Success.

### Pha 3: Module Tương Tác Kịch Bản Mở Rộng & Nuôi Tài Khoản (Ước lượng: Tùy mức độ sâu 2 Tuần)
1. **Hạ tầng Playwright nâng cao:** Tích hợp bộ cấu hình Browser Profile Injector (Làm giả User-Agent, Window Size, Canvas Fingerprint).
2. **UI/UX:** Dựng giao diện Workflow Nuôi Tài khoản.
3. **Chức năng Backend:**
   - Parser kịch bản JSON: Đọc luồng kịch bản người dùng chọn và thông dịch ra các lệnh cho Playwright điều khiển trình duyệt.
   - Xây dựng các hàm lõi: `scrollFeed(time)`, `randomLike(min,max)`, `randomComment(list)`, v.v.
   - Chế độ "Warm-up": Chạy dần kịch bản với giới hạn API.

### Pha 4: Module Quét Thông Tin Khác & Đóng Gói (Ước lượng: 1 Tuần)
1. Bổ sung các Scraper thu thập số liệu follower/following.
2. Tổng hợp lên Dashboard Data (Draw biểu đồ Chart.js ra màn hình).
3. Tối ưu Memory Leak do trình duyệt gây ra (giới hạn tối đa 150MB/profile).
4. Phân phối và đóng gói thành tệp cài đặt (Electron Builder).

## 5. Phương pháp Kiểm thử (Verification Plan)
- **Kiểm thử UI Nội bộ:** Mỗi Module sau khi code UI, gọi lệnh debug Node.js để kiểm tra tính Responsive trên nhiều cỡ màn hình cho sẵn và độ tiện ích (UX Layout).
- **System Task Verification:** 
  1. Viết Unit Test cho SQLite DB Layer (Thử thêm 1000 accounts rác).
  2. Viết Integration Test cho Automation: Chạy một Browser thực hiện login threads web, đo lường tỷ lệ pass Catchpa/Logins bằng tài khoản cá nhân thật thay vì mock data nhằm xác định chính xác thuật toán Fingerprinting.
- **Load Test cơ bản:** Spawn thử 10 Instance Playwright không tài khoản để đo đếm tài nguyên CPU và RAM tiêu thụ của Electron App theo Real-time Performance Monitor.
