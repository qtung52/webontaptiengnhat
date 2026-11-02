# 🌸 Kotoba Dojo (言葉道場) - Web App Học & Ôn Thi Tiếng Nhật Cho Người Việt

**Kotoba Dojo** là ứng dụng web học từ vựng, Hán tự và Bảng chữ cái tiếng Nhật hiện đại, tối ưu giao diện tiếng Việt cho điện thoại di động (Mobile-first responsive).

Ứng dụng hoạt động **100% độc lập không cần đăng nhập** (lưu dữ liệu cục bộ qua `localStorage`), đồng thời có tùy chọn **Đăng nhập Google + Đồng bộ Firestore** khi bạn điền cấu hình Firebase vào file `.env.local`.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### PHẦN A. NỘI DUNG TỪ VỰNG & HÁN TỰ CHUẨN MANABIMAN
- **Từ vựng (805 từ)**: Đồng bộ trực tiếp từ Manabiman.io.vn qua 3 khóa học tiếng Nhật:
  - **JPD113 (N5)**: 11 bài học (334 từ vựng cơ bản)
  - **JPD123 (N4)**: 12 bài học (251 từ vựng trung cấp N4)
  - **JPD133 (N3)**: 12 bài học (220 từ vựng nâng cao N3)
- **Hán tự Kanji (117 chữ)**: Đầy đủ 11 bài học từ Manabiman qua cả 3 cấp độ:
  - **N5 (JPD113)**: 35 chữ Hán (Bài 1 đến Bài 3)
  - **N4 (JPD123)**: 42 chữ Hán (Bài 4 đến Bài 7)
  - **N3 (JPD133)**: 40 chữ Hán (Bài 8 đến Bài 11)
  - Chi tiết từng chữ: âm On (Katakana), âm Kun (Hiragana), âm Hán Việt chuẩn, nghĩa tiếng Việt, số nét bút, câu chuyện liên tưởng tượng hình và danh sách từ ghép ví dụ thực tế liên kết trực tiếp với kho từ vựng.

### PHẦN B. QUẢN LÝ TỪ VỰNG NGƯỜI DÙNG TỰ NẠP
1. **Nhập bằng File**: Hỗ trợ định dạng `.csv`, `.xlsx`, `.xls`, `.json`, `.txt`. Tự động nhận diện tên cột, có bước xem trước, báo lỗi các dòng sai định dạng, cho phép chọn ghép cột thủ công và có sẵn nút tải file mẫu (`CSV`, `Excel`, `JSON`).
2. **Nhập bằng Form & Thêm Nhanh**: Thêm từ đơn kèm furigana, âm Hán Việt, câu ví dụ, cấp độ (N5–N1), chủ đề. Chế độ *Thêm nhanh liên tiếp* tự động lưu và làm sạch ô nhập để nhập từ tiếp theo.
3. **Dán văn bản hàng loạt**: Hộp dán văn bản nhận diện các dòng dạng `từ | cách đọc | nghĩa` hoặc ngăn cách bằng tab/phẩy.
4. **Quản lý Bộ từ (Decks)**: Người dùng có thể tạo thêm các bộ từ riêng, ôn riêng từng bộ hoặc gộp nhiều bộ để ôn cùng lúc.

### PHẦN C. CÁC CHẾ ĐỘ RÈN LUYỆN ĐA DẠNG
- **Luyện gõ phản xạ**: Chạy đua 60 giây, hiện từ Nhật gõ romaji/nghĩa, tính điểm tốc độ CPM và độ chính xác, chuỗi combo liên tục, âm thanh ding/buzzer phản hồi tức thì.
- **Flashcard lật thẻ 3D**: Hiệu ứng lật thẻ 3D mượt mà, hỗ trợ phím tắt `Space` để lật, phím mũi tên `← / 1` (chưa thuộc) và `→ / 2` (đã thuộc).
- **Trắc nghiệm 4 lựa chọn**: Tự động sinh đáp án nhiễu thông minh theo 3 chiều: Nhật → Việt, Việt → Nhật, Đọc → Kanji.
- **Gõ đáp án & Điền từ**: Kiểm tra chính tả chữ cái tiếng Nhật hoặc nghĩa tiếng Việt với thuật toán so sánh mềm dẻo.
- **Nối cặp (Matching Game)**: Trò chơi ghép 6 cặp từ tiếng Nhật và nghĩa tiếng Việt tương ứng, tính thời gian và số lượt chọn.
- **Thi thử (Mock Test)**: Tùy chọn số lượng câu, giới hạn thời gian (3, 5, 10 phút), chấm điểm chi tiết và bảng xem lại câu sai kèm giải thích ví dụ.

### PHẦN C2. BỘ GÕ ROMAJI TỰ CHUYỂN KANA (WANAKANA)
- Tích hợp thư viện `wanakana` chuẩn IME Nhật Bản: gõ romaji tự động biến thành Kana ngay trong ô nhập (vd: `konnichiwa` → `こんにちは`, `kka` → `っか`, `kya` → `きゃ`).
- Nút chuyển chế độ cạnh ô nhập: `あ Hira` / `ア Kata` / `Aa Romaji`. Phím tắt tiện lợi: `F6` (Hiragana), `F7` (Katakana), `F9` (Romaji).
- Tự động kích hoạt Katakana khi câu hỏi là từ mượn Katakana.
- Chế độ gõ nghĩa tiếng Việt tự động tắt WanaKana để gõ tiếng Việt có dấu bình thường.
- Xử lý mượt mà khi người dùng sử dụng bộ gõ tiếng Nhật thật của hệ điều hành (`compositionstart` / `compositionend`), tối ưu cho điện thoại di động (`autocorrect="off"`, `autocapitalize="none"`).
- Chuẩn hóa thông minh khi chấm điểm: chấp nhận cả Hiragana, Katakana và Romaji tương đương.

### PHẦN D & E. TIỆN ÍCH & GIAO DIỆN
- **Dashboard**: Thống kê chuỗi ngày học liên tục (streak), số từ đã thuộc, tỉ lệ đúng theo ngày, tiến độ theo từng cấp độ JLPT N5–N1.
- Bật/tắt Furigana trên chữ Hán.
- Phát âm chuẩn tiếng Nhật qua Web Speech API `ja-JP` kèm chỉnh tốc độ đọc (0.7x – 1.2x).
- Chế độ Sáng / Tối (Dark mode).
- Xuất/nhập toàn bộ dữ liệu ra file `.json` để sao lưu thủ công.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL

### Yêu cầu môi trường
- Đã cài đặt **Node.js 18+** (hoặc Node.js 20+).
- Trình duyệt hiện đại (Chrome, Safari, Edge, Firefox).

### Các bước khởi chạy
1. Mở cửa sổ dòng lệnh (Terminal / PowerShell) và điều hướng vào thư mục dự án:
   ```bash
   cd C:\Users\DELL\.gemini\antigravity\scratch\kotoba-dojo
   ```

2. Cài đặt các thư viện (nếu chưa cài):
   ```bash
   npm install
   ```

3. Chạy môi trường phát triển (Development):
   ```bash
   npm run dev
   ```

4. Mở trình duyệt và truy cập:
   ```
   http://localhost:3000
   ```
   *Ứng dụng sẽ hoạt động ngay lập tức với dữ liệu mẫu 50 từ N5 và 30 Hán tự N5 mà không cần cấu hình thêm bất kỳ tài khoản nào!*

---

## ☁️ CẤU HÌNH FIREBASE (TÙY CHỌN)

Nếu bạn muốn bật thêm tính năng đăng nhập bằng tài khoản Google và đồng bộ dữ liệu lên đám mây Firestore:

1. Đăng nhập [Firebase Console](https://console.firebase.google.com/) và bấm **Add project**.
2. Vào mục **Build** > **Authentication**:
   - Chọn tab **Sign-in method** > Kích hoạt provider **Google**.
3. Vào mục **Build** > **Firestore Database**:
   - Bấm **Create database**, chọn chế độ **Start in test mode**.
4. Vào **Project settings** (biểu tượng bánh răng) > cuộn xuống mục **Your apps** > chọn biểu tượng Web (`</>`) để đăng ký app và lấy cấu hình.
5. Tạo một file tên là `.env.local` trong thư mục gốc của dự án và dán nội dung sau vào:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kotoba-dojo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kotoba-dojo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kotoba-dojo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
```

6. Khởi động lại `npm run dev`. Nút đăng nhập Google và trạng thái đồng bộ Firestore sẽ tự động kích hoạt trên thanh Navbar và trang Cài đặt!

---

## 🌐 HƯỚNG DẪN DEPLOY LÊN VERCEL

### Cách 1: Deploy qua Vercel CLI (Nhanh nhất)
1. Cài đặt Vercel CLI toàn cục (nếu chưa có):
   ```bash
   npm install -g vercel
   ```
2. Chạy lệnh deploy:
   ```bash
   vercel
   ```
3. Làm theo hướng dẫn trên màn hình (đăng nhập, xác nhận tên dự án).
4. Để deploy lên Production:
   ```bash
   vercel --prod
   ```

### Cách 2: Deploy qua Vercel Dashboard & GitHub
1. Đẩy mã nguồn dự án lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Kotoba Dojo"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan>/kotoba-dojo.git
   git push -u origin main
   ```
2. Truy cập [vercel.com](https://vercel.com/) và đăng nhập.
3. Bấm nút **Add New...** > **Project**.
4. Chọn repository `kotoba-dojo` từ danh sách GitHub của bạn và bấm **Import**.
5. Trong phần **Environment Variables**, nếu bạn có dùng Firebase, hãy thêm các biến tương ứng trong file `.env.local`. Nếu chỉ dùng offline `localStorage`, bạn có thể để trống hoàn toàn!
6. Bấm nút **Deploy**. Vercel sẽ tự động build và cấp cho bạn một tên miền miễn phí dạng `https://kotoba-dojo.vercel.app`!

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
kotoba-dojo/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── kana/page.tsx         # Bảng chữ cái Hiragana & Katakana
│   │   ├── kanji/page.tsx        # Tra cứu và học Hán tự N5-N1
│   │   ├── vocabulary/page.tsx   # Quản lý bộ từ, nạp file CSV/Excel, dán văn bản
│   │   ├── study/
│   │   │   ├── page.tsx          # Trung tâm chọn chế độ rèn luyện
│   │   │   ├── typing/page.tsx   # Luyện gõ phản xạ 60s
│   │   │   ├── flashcard/page.tsx# Flashcard lật thẻ 3D
│   │   │   ├── quiz/page.tsx     # Trắc nghiệm 4 lựa chọn
│   │   │   ├── write/page.tsx    # Gõ đáp án & điền từ
│   │   │   ├── match/page.tsx    # Trò chơi nối cặp thẻ
│   │   │   ├── test/page.tsx     # Thi thử tính giờ & giải thích
│   │   │   └── srs/page.tsx      # Ôn tập ngắt quãng SM-2
│   │   ├── settings/page.tsx     # Cài đặt furigana, wanakana, theme, backup
│   │   ├── globals.css           # Cấu hình Tailwind & 3D CSS
│   │   ├── layout.tsx            # Root layout bọc Navbar & Providers
│   │   └── page.tsx              # Dashboard trang chủ & thống kê
│   ├── components/
│   │   ├── KanaInput.tsx         # Bộ gõ WanaKana IME thông minh F6/F7/F9
│   │   ├── AudioButton.tsx       # Nút phát âm giọng Nhật ja-JP
│   │   ├── FuriganaText.tsx      # Hiển thị Kanji kèm Furigana
│   │   ├── Navbar.tsx            # Thanh điều hướng trên cùng & Streak
│   │   ├── BottomNav.tsx         # Thanh điều hướng chân trang cho điện thoại
│   │   └── Modal.tsx             # Hộp thoại pop-up đa năng
│   ├── context/
│   │   ├── AppContext.tsx        # Quản lý State bộ từ, từ vựng, SRS, Cài đặt
│   │   └── AuthContext.tsx       # Quản lý Đăng nhập Google & Profile Firebase
│   ├── data/
│   │   ├── kana.json             # Dữ liệu bảng chữ kèm gợi nhớ tiếng Việt
│   │   ├── kanji-n5.json         # 30 Hán tự N5 mẫu
│   │   └── default-vocab.json    # 50 từ vựng N5 mẫu
│   ├── lib/
│   │   ├── wanakana-helper.ts    # Logic chuyển đổi và so sánh đáp án WanaKana
│   │   ├── sm2.ts                # Thuật toán lặp lại ngắt quãng SuperMemo SM-2
│   │   ├── file-importer.ts      # Đọc CSV, Excel, JSON, dán text & tải file mẫu
│   │   ├── sound.ts              # Web Speech API & Web Audio synthesizer
│   │   ├── storage.ts            # Quản lý localStorage an toàn
│   │   └── firebase.ts           # Khởi tạo an toàn Firebase (không lỗi khi thiếu env)
│   └── types/
│       └── index.ts              # Định nghĩa Typescript toàn ứng dụng
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

Chúc bạn học tập thật tốt cùng **Kotoba Dojo**! 頑張ってください！ (Ganbatte kudasai!)

