# 📚 VocabVault v3 – Blazor + Supabase Cloud

Data lưu trên **Supabase** (PostgreSQL cloud) — mọi máy, mọi lúc đều thấy cùng data!

---

## 🗄️ BƯỚC 1 — Tạo Supabase (miễn phí)

1. Vào **https://supabase.com** → **Start your project** → đăng ký bằng GitHub
2. Nhấn **New project** → đặt tên → chọn region **Southeast Asia** → **Create project**
3. Vào **SQL Editor** (menu trái) → paste toàn bộ file `supabase_setup.sql` → nhấn **Run**
4. Vào **Project Settings** → **API** → copy 2 giá trị:
   - **Project URL** (dạng `https://xxxx.supabase.co`)
   - **anon public key** (chuỗi dài `eyJ...`)

---

## ⚙️ BƯỚC 2 — Điền key vào code

Mở `VocabVault2/Services/SupabaseConfig.cs`:

```csharp
public const string Url = "https://YOURPROJECT.supabase.co";
public const string Key = "eyJ...";
```

---

## 🚀 BƯỚC 3 — Chạy hoặc Deploy

**Local:** Mở `VocabVault2.sln` → F5

**Render:** `git add . && git commit -m "Supabase" && git push`

---

## ✅ Kết quả

| | |
|--|--|
| Data lưu cloud | ✅ Supabase PostgreSQL |
| Mọi máy cùng thấy | ✅ |
| Không mất khi refresh | ✅ |
| Miễn phí | ✅ 500MB |
