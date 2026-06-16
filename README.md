# Matcha Manager — Production Ready

Aplikasi manajemen bisnis matcha dengan fitur lengkap untuk usaha kecil.

## Stack
- **Frontend**: Next.js 13 + React 18 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **Auth**: JWT dengan HttpOnly cookies
- **Styling**: Matcha-themed (hijau profesional #2e7d32)

## Fitur Utama

### 🔐 Keamanan
- Login dengan credentials (email/password)
- Cookie-based session management (HttpOnly, Secure, SameSite)
- JWT token dengan expiry 8 jam
- Route protection untuk semua halaman

### 📊 Dashboard
- Gauge animasi untuk status keseluruhan (0-100 score)
- Ringkasan stok yang kurang
- Catatan cepat team

### 📦 Stock Management
- Tambah, edit, delete stock
- Tracking minimum level per item
- Stock transaction logs (riwayat perubahan)
- Status indicator (Aman/Kurang)

### 💰 Finance & Akuntansi
- **HPP Calculator**: Hitung harga pokok penjualan per porsi
- **Laporan Laba/Rugi**: Revenue, expenses, profit, margin
- **Ringkasan Kas**: Summary kas masuk/keluar dan persentase

### 🧮 Purchase Calculator
- Multiple menu recipes support
- Hitung jumlah order dari pembelian bahan
- Detail bahan & takaran per menu
- Sisa bahan tracking

### 📝 Notes/Corkboard
- Papan catatan untuk team
- Add/delete notes
- Catatan dengan timestamp

## Quick Start

### 1. Clone & Install
```powershell
cd C:\Users\Stpvx242\Desktop\Machazen_website
npm install
```

### 2. Setup Database
```powershell
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Run Dev Server
```powershell
npm run dev
```

Buka `http://localhost:3000` di browser.

## Default Credentials (Seed)

- **Owner**: owner@example.com / ownerpass
- **Pegawai**: pegawai@example.com / pegawai

> ⚠️ Ubah password ini sebelum production!

## Build & Deploy

### Development
```powershell
npm run dev
```

### Production Build
```powershell
npm run build
npm start
```

## Environment Variables (Production)

Buat `.env.local`:
```
JWT_SECRET=your_long_random_secret_here_min_32_chars
NODE_ENV=production
```

## File Structure
```
matcha-manager/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   ├── stocks/
│   │   └── notes/
│   ├── dashboard.js
│   ├── stock.js
│   ├── finance.js
│   ├── calculator.js
│   ├── notes.js
│   └── login.js
├── components/
│   ├── Nav.js
│   ├── Gauge.js
│   └── Corkboard.js
├── lib/
│   ├── auth.js
│   ├── prisma.js
│   └── withAuth.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── styles/
│   └── globals.css
└── package.json
```

## API Routes

### Auth
- `POST /api/auth/login` — login
- `GET /api/auth/me` — current user
- `POST /api/auth/logout` — logout

### Stock
- `GET /api/stocks` — list all stocks
- `POST /api/stocks` — create stock
- `PUT /api/stocks` — update stock
- `DELETE /api/stocks` — delete stock
- `GET /api/stocks/logs` — stock transaction logs

### Notes
- `GET /api/notes` — list notes
- `POST /api/notes` — create note
- `DELETE /api/notes` — delete note

## Security Notes

1. **Production Deployment**
   - Set `JWT_SECRET` env var ke random string yang kuat
   - Enable HTTPS (SSL/TLS)
   - Set `Secure` flag di cookies (production only)
   - Disable password display di browser autofill

2. **Database**
   - Backup `prisma/dev.db` secara berkala
   - Untuk production: gunakan PostgreSQL atau MySQL (edit datasource di schema.prisma)

3. **Role-based Access** (future)
   - Implementasi authorization checks per route
   - Owner: akses semua fitur
   - Pegawai: akses terbatas (stock, notes, calculator)

## Troubleshooting

### Dev server error setelah changes
```powershell
npm run dev
```
Next.js Fast Refresh akan auto-reload. Jika masih error, cek console browser.

### Database corrupted
```powershell
rm prisma/dev.db prisma/.prisma
npx prisma db push
npm run seed
```

### Port 3000 sudah terpakai
```powershell
npm run dev -- -p 3001
```

## Roadmap (Future)

- [ ] Multi-branch support
- [ ] Advanced reporting (CSV export)
- [ ] Supplier management
- [ ] Inventory forecasting
- [ ] Mobile app (React Native)
- [ ] Real-time sync dengan cloud

## License

Private — Untuk Machazen Matcha Management

---

**Versi**: 1.0.0 (Production Ready)  
**Last Updated**: November 11, 2025
