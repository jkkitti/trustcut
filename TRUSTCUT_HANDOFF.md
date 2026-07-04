# TrustCut Handoff Notes

อัปเดตล่าสุด: 4 กรกฎาคม 2026

เอกสารนี้สรุปสิ่งที่คุยและทำไปแล้ว เพื่อให้กลับมาทำงานต่อกับโปรเจกต์ TrustCut ได้ทันที

## ภาพรวมโปรเจกต์

TrustCut เป็น web application สำหรับเจ้าของร้านทำผมและร้านตัดผม ใช้ตรวจสอบข้อมูลช่างก่อนจ้างงาน เช่น ประวัติ ประสบการณ์ ทักษะ ความถนัด คะแนนพฤติกรรม คอมเมนต์ และผลงานทรงผม

โครงสร้างที่ใช้:

- React
- Next.js App Router
- Tailwind CSS
- Supabase Auth และ Postgres
- Google OAuth
- Vercel deployment
- GPS geofence verification

## สิ่งที่ทำไปแล้ว

- สร้าง dashboard หลักสำหรับ TrustCut
- เพิ่มข้อมูลจำลองของช่างทำผม สมาชิก คอมเมนต์ ผลงานทรงผม และสถิติ admin
- เพิ่มหน้า login ก่อนเข้า dashboard
- เพิ่ม Google OAuth ผ่าน Supabase
- เพิ่ม callback route ที่ `/auth/callback`
- เพิ่มระบบ PDPA consent
- เพิ่ม GPS authorization gate ก่อนดูข้อมูล
- เพิ่มปุ่มสลับภาษา ไทย / อังกฤษ โดยให้ภาษาไทยเป็นค่าเริ่มต้น
- เพิ่มปุ่มสลับธีม สว่าง / มืด และจำค่าที่เลือกไว้ใน browser
- ปรับกล่อง UI ให้โค้งมน ละมุนขึ้น
- ใส่โลโก้จากไฟล์ที่ผู้ใช้ให้มา โดยใช้เฉพาะโลโก้ ไม่เอาตัวหนังสือ
- เพิ่ม Supabase schema และ seed mock data
- เพิ่มคู่มือ setup ใน `README.md`

## Flow ปัจจุบัน

1. ผู้ใช้เข้า `/`
2. ถ้ายังไม่มี Supabase session หรือ demo access cookie ระบบ redirect ไป `/login`
3. ผู้ใช้ต้องติ๊กยอมรับ PDPA ก่อนกด Google OAuth
4. Supabase ส่งผู้ใช้ไป Google
5. Google ส่งกลับมาที่ Supabase callback
6. Supabase redirect กลับมาที่ `/auth/callback`
7. `/auth/callback` exchange code เป็น session
8. ถ้า login สำเร็จ ผู้ใช้กลับเข้า dashboard `/`
9. ใน dashboard ยังต้องผ่าน PDPA และ GPS verification ก่อนปลดล็อกข้อมูล

## Routes สำคัญ

- `/` dashboard หลัก
- `/login` หน้าเข้าสู่ระบบ
- `/auth/callback` OAuth callback สำหรับ exchange session
- `/api/geo/verify` API ตรวจ GPS geofence

## ไฟล์สำคัญ

- `src/app/page.tsx` dashboard route และ redirect ไป login
- `src/app/login/page.tsx` login route
- `src/app/auth/callback/route.ts` OAuth callback
- `src/app/api/geo/verify/route.ts` GPS verification API
- `src/components/trustcut-app.tsx` dashboard หลัก
- `src/components/login-page.tsx` หน้า login
- `src/components/auth-panel.tsx` auth panel ใน dashboard
- `src/components/geo-verification.tsx` GPS panel
- `src/components/trustcut-logo.tsx` โลโก้
- `src/lib/sample-data.ts` mock data
- `src/lib/i18n.ts` ข้อความไทย/อังกฤษ
- `src/lib/client-preferences.ts` localStorage keys สำหรับ PDPA และ theme
- `src/lib/supabase/*` Supabase clients และ env helpers
- `src/proxy.ts` refresh Supabase session cookies
- `supabase/schema.sql` database schema
- `supabase/seed.sql` mock data สำหรับ Supabase
- `public/trustcut-logo.png` โลโก้ที่ crop แล้ว

## Environment Variables

ใช้ใน `.env.local` และ Vercel Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TRUSTCUT_ALLOWED_GEOFENCES=[{"name":"Your Salon","lat":13.7563,"lng":100.5018,"radiusMeters":150}]
```

หมายเหตุ:

- โค้ดรองรับ fallback ชื่อ `NEXT_PUBLIC_SUPABASE_KEY` ด้วย แต่ควรใช้ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ถ้าไม่มี Supabase env ระบบจะเข้า demo mode
- ถ้าไม่มี `TRUSTCUT_ALLOWED_GEOFENCES` ระบบ GPS จะเป็น demo mode

## Supabase Setup

1. สร้าง Supabase project
2. Run `supabase/schema.sql` ใน SQL editor
3. Run `supabase/seed.sql` ถ้าต้องการ mock data
4. เปิด Google provider ใน Supabase Auth
5. ใส่ Google Client ID และ Client Secret
6. ตั้งค่า Site URL และ Redirect URLs ให้ตรงกับโดเมนจริง

Supabase Redirect URLs ที่ควรมี:

```text
http://localhost:3000
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app
https://your-vercel-domain.vercel.app/auth/callback
```

## Google OAuth Setup

ใน Google Cloud Console OAuth Client:

Authorized JavaScript origins:

```text
http://localhost:3000
https://your-vercel-domain.vercel.app
```

Authorized redirect URIs:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

จุดสำคัญ:

- Google redirect URI ต้องเป็น Supabase callback
- ไม่ใช่ `https://your-vercel-domain.vercel.app/auth/callback`
- ส่วน Vercel callback ต้องอยู่ใน Supabase Redirect URLs

## Vercel Checklist

ถ้า Vercel ไม่เห็นหน้า login:

- เช็กว่า deploy เป็นโค้ดล่าสุดที่มี `src/app/login/page.tsx`
- เช็กว่า `/` redirect ไป `/login` เมื่อยังไม่มี session
- กด Redeploy หลัง push หรือ import โค้ดล่าสุด
- ถ้ายังไม่ได้ตั้ง Supabase env หน้า login จะแสดงปุ่มเข้า demo mode แทน Google OAuth จริง

ถ้า Google OAuth ใช้บน Vercel ไม่ได้:

- เช็ก Supabase Site URL เป็น Vercel production URL
- เช็ก Supabase Redirect URLs มี `/auth/callback`
- เช็ก Google Authorized JavaScript origins มี Vercel origin
- เช็ก Google Authorized redirect URI เป็น Supabase callback URL
- ถ้าใช้ custom domain ต้องเพิ่ม custom domain ทั้งใน Supabase และ Google

## คำสั่งตรวจสอบ

```bash
npm run lint
npm run build
npm run dev
```

ก่อนส่งงานล่าสุด เคยตรวจผ่านแล้ว:

- `npm run lint`
- `npm run build`
- Browser check หน้า `/login`
- Browser check redirect จาก `/` ไป `/login`
- Browser check ธีมมืด และ reload แล้วยังจำธีม

## สิ่งที่ควรทำต่อ

- ทดสอบ Google OAuth จริงบน Vercel หลังตั้งค่า env และ redirect URL ครบ
- เชื่อม dashboard กับ Supabase table จริง แทน mock data ใน `src/lib/sample-data.ts`
- เพิ่ม admin approval จริงสำหรับ members และ comments
- เพิ่ม role-based access control จาก `profiles.role`
- บันทึก PDPA consent ลง Supabase จริง
- บันทึก GPS usage events จาก production users
- เพิ่มหน้า error/notice สำหรับ OAuth error ที่ callback
- เพิ่ม loading state ระหว่างตรวจ session
- ปรับ schema/RLS เพิ่มเติมก่อนเปิดใช้งานจริง

## หมายเหตุการออกแบบ

- ภาษาเริ่มต้นของระบบคือภาษาไทย
- มีตัวเลือกภาษาไทยและอังกฤษที่ footer
- มีตัวเลือกธีมสว่างและมืดที่ footer
- สีและกล่องถูกปรับให้ดูละมุน แต่ยังเน้นความน่าเชื่อถือ
- โลโก้ใช้ไฟล์ `public/trustcut-logo.png` ซึ่ง crop จากโลโก้ที่ผู้ใช้ให้มา
