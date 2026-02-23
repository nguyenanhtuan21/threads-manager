# ThreadsManager

> Ứng dụng Desktop quản lý và tự động hóa tài khoản Threads — xây dựng bằng Electron, React, TypeScript.

---

## ✨ Tính năng

### Pha 1 — Nền tảng & Quản lý Tài khoản ✅
- **Quản lý Tài khoản**: Thêm, xoá, Import/Export hàng loạt tài khoản từ file `.txt`/`.csv`
- **Quản lý Proxy**: Thêm proxy (HTTP/HTTPS/SOCKS5) với xác thực Username/Password, gán proxy cho tài khoản
- **Giao diện Dark Mode**: Sidebar điều hướng, Header tìm kiếm, bố cục chuyên nghiệp

### Pha 2 — Module Auto Post ✅
- **Soạn Bài đăng**: Tạo nội dung text, đính kèm nhiều ảnh/video từ máy tính
- **Quản lý Chiến dịch**: Tạo chiến dịch đăng bài hàng loạt, chọn danh sách tài khoản, cấu hình delay ngẫu nhiên, hẹn giờ chạy

### Pha 3 — Nuôi tài khoản & Tương tác *(Sắp tới)*
### Pha 4 — Scraper & Thống kê *(Sắp tới)*

---

## 🛠 Công nghệ

| Layer | Stack |
|---|---|
| Desktop Runtime | Electron 39 |
| Build Tool | Electron-Vite 5, Vite 7 |
| Frontend | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, Lucide Icons |
| Database | SQLite + Prisma ORM 5 |
| IPC | Electron `ipcMain` / `contextBridge` |

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu
- **Node.js** >= 18
- **npm** >= 9

### Bước 1: Clone & Cài dependencies

```bash
cd threads-app
npm install
```

### Bước 2: Khởi tạo Database

```bash
npx prisma generate
npx prisma db push
```

### Bước 3: Chạy ứng dụng

```bash
# Chế độ Development (Hot Reload)
npm run dev

# Chế độ Preview (Production-like)
npm start
```

---

## 📁 Cấu trúc thư mục

```
threads-app/
├── prisma/
│   └── schema.prisma        # Định nghĩa Database Schema
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── index.ts          # IPC Handlers, Window, Lifecycle
│   │   └── db.ts             # Prisma Client khởi tạo
│   ├── preload/              # Preload Scripts (Bridge API)
│   │   ├── index.ts
│   │   └── index.d.ts
│   └── renderer/             # React Frontend
│       └── src/
│           ├── App.tsx       # Router chính
│           └── components/
│               ├── layout/   # Sidebar, Header, AppLayout
│               └── pages/    # AccountManagement, ProxyManagement,
│                             # PostManagement, CampaignManagement
├── database.db               # SQLite Database file
├── .env                      # DATABASE_URL config
└── package.json
```

---

## 📝 Lưu ý khi phát triển

1. **Sau khi thay đổi `schema.prisma`**, luôn chạy:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **`npm start`** (preview) sẽ build production bundle trước khi chạy. Nếu thay đổi IPC handler ở Main Process, cần restart lại.

3. **`npm run dev`** có hot-reload cho Renderer, nhưng thay đổi ở Main Process vẫn cần restart.

---

## 📄 License

MIT
