# TH-LOTTO Platform

ระบบแทงหวยออนไลน์ครบวงจร — ฝาก/ถอน · แทงหวย · วงล้อโชคดี · Affiliate

---

## 🏗️ โครงสร้าง Monorepo

```
TH-LOTTO-v1/
├── user_app/       ← User Frontend (React + Vite + TailwindCSS)
├── admin_app/      ← Admin Dashboard (React + Vite + TailwindCSS)
├── .agents/        ← AI Agent Skills (Supabase)
└── .gitignore
```

## 🔗 URLs Production

| ระบบ | URL |
|------|-----|
| User App | https://thlotto-user.vercel.app |
| Admin App | https://thlotto-admin.vercel.app |
| Supabase | https://kyfycslksoybshdmlnbd.supabase.co |

## 🚀 การ Deploy (Git Workflow)

### User App
```bash
# พัฒนาบน develop
git checkout develop
# แก้ไขโค้ด...
git add .
git commit -m "feat: your feature"
git push origin develop

# Deploy → merge เข้า main
git checkout main
git merge develop --no-edit
git push origin main   # ← Vercel auto-deploy
git checkout develop
```

### Admin App — workflow เดียวกัน (branch เดียวกัน)
> Vercel deploy ทั้งสอง app อัตโนมัติเมื่อ push main

## ⚙️ Setup Local Development

```bash
# User App
cd user_app
cp .env.example .env      # ใส่ค่า Supabase
npm install
npm run dev               # http://localhost:5173

# Admin App
cd admin_app
cp .env.example .env      # ใส่ค่า Supabase
npm install
npm run dev               # http://localhost:5174
```

## 🔒 Environment Variables

```env
VITE_SUPABASE_URL=https://kyfycslksoybshdmlnbd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4H20WpkpiIvyndq4GPcjAw_orTyjd0l
```

> ⚠️ ห้าม commit `.env` ขึ้น repo เด็ดขาด

## 🛡️ กฎการพัฒนา (Iron Rules)

1. **ก่อน AI แก้โค้ดทุกครั้ง:** `git add . && git commit -m "before ai changes"`
2. **ทำงานบน `develop` เสมอ** — ห้าม push ตรงไป `main`
3. **ถ้า AI ทำพัง:** `git restore .` หรือ `git revert <commit-id>`
4. **DB Schema เปลี่ยนผ่าน Supabase MCP เท่านั้น**

## 📚 เอกสารระบบ

- `user_app/SYSTEM_DOCS.md` — เอกสารระบบฉบับสมบูรณ์
- `user_app/PROJECT_STATUS.md` — สถานะโปรเจค + bug fixes
- `user_app/CHANGELOG.md` — ประวัติการเปลี่ยนแปลง

## 🗄️ Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Hosting:** Vercel (Edge Network)
- **CI/CD:** GitHub → Vercel (auto-deploy on push to main)
