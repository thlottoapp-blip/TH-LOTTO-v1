---
description: Deploy Admin Panel to production
---

# กฎเหล็ก - TH-LOTTO Admin Panel

## โปรเจคนี้คืออะไร
- **ชื่อ**: TH-LOTTO Admin Panel
- **Vercel Project**: `th-lotto-admin`
- **Project ID**: `prj_Un7pZtGDhtaxXOGaOXDajtLDpPWM`
- **URL ออนไลน์**: https://th-lotto-admin.vercel.app/
- **GitHub Repo**: `thlotto3239-star/TH-LOTTO-Admin-push`
- **Branch deploy**: `master`
- **Branch ทำงาน**: `develop`
- **Local Path**: `c:\Users\armyn\Downloads\thlotto-admin`

## ขั้นตอน Deploy

1. Commit checkpoint ก่อน AI แก้โค้ด
// turbo
```bash
git add -A && git commit -m "checkpoint: before ai changes"
```

2. AI แก้โค้ด (ทำงานตามคำสั่ง)

3. ทดสอบ build
// turbo
```bash
npx vite build
```

4. Commit งานใหม่
```bash
git add -A && git commit -m "feat: <description>"
```

5. Push (Vercel auto-deploy)
// turbo
```bash
git push origin develop:master
```
> Vercel จะ auto-deploy อัตโนมัติ ไม่ต้องรัน vercel --prod อีก

## ข้อห้าม
- ห้าม deploy ไปโดเมนอื่นนอกจาก https://th-lotto-admin.vercel.app/
- ห้ามสร้างโปรเจค Vercel ใหม่
- ห้ามแก้ไขไฟล์ที่ไม่เกี่ยวข้องกับคำสั่ง
- ห้ามแตะโปรเจค User App (th-lotto-app)
- ต้องตรวจสอบกับผู้ใช้ก่อนทำการเปลี่ยนแปลงทุกครั้ง
