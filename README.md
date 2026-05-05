# Lunar Coffee

Sistem manajemen kafe terintegrasi yang menggabungkan fungsionalitas Point of Sale (POS) internal—mencakup autentikasi, manajemen CRUD, pencarian, dan pagination—dengan landing page eksternal untuk memfasilitasi pemesanan mandiri oleh pelanggan secara langsung.

---

## 📋 Table of Contents

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Setup Database](#setup-database)
- [Struktur Project](#struktur-project)
- [API Endpoints](#api-endpoints)
- [Halaman & Fitur Frontend](#halaman--fitur-frontend)
- [Authentication](#authentication)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## ✨ Fitur Utama

### Backend (Laravel 13)

- ✅ **Autentikasi & Otorisasi RBAC** - Fortify dengan email verification, 2FA (TOTP), dan Role-Based Access (Admin vs Customer)
- ✅ **REST API Penuh** - GET, POST, PUT, DELETE untuk resource utama
- ✅ **Type-Safe Routing** - Wayfinder auto-generates typed route functions
- ✅ **CSRF Protection** - Token CSRF otomatis di header request
- ✅ **Eloquent ORM** - Model dengan relationships (hasMany, belongsTo)
- ✅ **Database Migrations** - Schema POS dengan SQLite sebagai default database

### Frontend (React 19 + TypeScript)

- ✅ **Modern UI** - shadcn/ui components (Card, Dialog, Table, Input, Button, Select, Badge, Alert)
- ✅ **4 Halaman CRUD Terpisah** - Categories, Products, Transactions, Transaction Details
- ✅ **Dashboard Terpadu** - Menampilkan ringkasan semua data dengan metric cards
- ✅ **Search & Pagination** - Client-side search dan pagination per tabel (6 baris per halaman)
- ✅ **Form Management** - Dialog-based form untuk create/update dengan validasi
- ✅ **Error Handling** - Alert component untuk error messages
- ✅ **Loading States** - Skeleton loaders saat data loading
- ✅ **Responsive Design** - Tailwind CSS dengan mobile-first approach

### Security

- ✅ Authenticated routes middleware
- ✅ Verified email middleware
- ✅ CSRF token validation
- ✅ Password hashing (bcrypt)
- ✅ Session management via database

---

## 🛠️ Tech Stack

### Backend

| Technology        | Version  | Penggunaan                |
| ----------------- | -------- | ------------------------- |
| PHP               | 8.3+     | Server language           |
| Laravel           | 13.0     | Web framework             |
| Laravel Fortify   | 1.34     | Authentication            |
| Laravel Wayfinder | 0.1.14   | Type-safe routing         |
| SQLite / MySQL    | - / 5.7+ | Database (SQLite default) |
| Pest              | 4.4      | Testing framework         |

### Frontend

| Technology   | Version | Penggunaan               |
| ------------ | ------- | ------------------------ |
| React        | 19.2    | UI library               |
| TypeScript   | 5.7     | Type safety              |
| Inertia.js   | 3.0     | Server-driven components |
| Tailwind CSS | 4.0     | Styling                  |
| shadcn/ui    | Latest  | Component library        |
| Vite         | 8.0     | Build tool               |
| ESLint       | 9.17    | Linting                  |
| Prettier     | 3.4     | Code formatting          |

### Tools

- **Node.js**: Package management frontend
- **Composer**: Package management backend
- **Vite**: Development & production build bundler
- **Docker** (opsional): Via Laravel Sail

---

## 💻 Persyaratan Sistem

- PHP 8.3 atau lebih tinggi
- Composer 2.x
- Node.js 18+ & npm 9+
- SQLite (Default) atau MySQL 5.7+
- Git

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd cafe-management-system
```

### 2. Install Dependencies

```bash
# Backend
composer install

# Frontend
npm install
```

### 3. Setup Environment

```bash
# Copy .env.example ke .env
cp .env.example .env

# Generate app key
php artisan key:generate
```

### 4. Konfigurasi Database

Project ini menggunakan SQLite secara default. Edit `.env` jika ingin menggunakan database lain, atau biarkan default untuk SQLite:

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

### 5. Run Migrations

```bash
php artisan migrate
```

### 6. Build Assets

```bash
npm run build
```

### 7. Start Development

```bash
# Option 1: Jalankan server & build terpisah
php artisan serve          # Terminal 1: Server Laravel
npm run dev                 # Terminal 2: Vite dev server

# Option 2: Jalankan semua bersamaan (perlu concurrently)
composer run dev
```

Aplikasi akan tersedia di `http://localhost:8000`

---

## 📊 Setup Database

### Struktur Tabel

#### `users`

| Column                    | Type      | Notes                               |
| ------------------------- | --------- | ----------------------------------- |
| id                        | bigint    | Primary key                         |
| name                      | string    | Nama user                           |
| email                     | string    | Email unik                          |
| email_verified_at         | timestamp | Verifikasi email                    |
| password                  | string    | Hashed password                     |
| role                      | string    | Role user ('admin' atau 'customer') |
| two_factor_secret         | string    | 2FA secret                          |
| two_factor_recovery_codes | string    | 2FA recovery codes                  |
| remember_token            | string    | Remember me token                   |

#### `categories`

| Column                | Type      | Notes                  |
| --------------------- | --------- | ---------------------- |
| id                    | bigint    | Primary key            |
| name                  | string    | Nama kategori (unique) |
| description           | text      | Deskripsi              |
| created_at/updated_at | timestamp | Timestamps             |

#### `products`

| Column                | Type      | Notes                |
| --------------------- | --------- | -------------------- |
| id                    | bigint    | Primary key          |
| category_id           | bigint    | Foreign key kategori |
| name                  | string    | Nama produk          |
| price                 | decimal   | Harga                |
| stock                 | integer   | Jumlah stok          |
| created_at/updated_at | timestamp | Timestamps           |

#### `transactions`

| Column                | Type      | Notes                       |
| --------------------- | --------- | --------------------------- |
| id                    | bigint    | Primary key                 |
| total_price           | decimal   | Total harga transaksi       |
| buyer_name            | string    | Nama pembeli                |
| cashier_id            | bigint    | Foreign key user (nullable) |
| created_at/updated_at | timestamp | Timestamps                  |

#### `transaction_details`

| Column                | Type      | Notes                 |
| --------------------- | --------- | --------------------- |
| id                    | bigint    | Primary key           |
| transaction_id        | bigint    | Foreign key transaksi |
| product_id            | bigint    | Foreign key produk    |
| qty                   | integer   | Jumlah                |
| created_at/updated_at | timestamp | Timestamps            |

---

## 🔌 API Endpoints

### Orders (Customer)

```
GET    /api/menu           - Fetch daftar menu untuk landing page
POST   /orders             - Submit order baru (Authenticated Customer)
```

### Authentication (Fortify)

```
POST   /login              - Login
POST   /logout             - Logout
POST   /register           - Register
POST   /forgot-password    - Request password reset
POST   /reset-password     - Reset password
POST   /email/verification-notification - Resend verification
POST   /two-factor-authentication - Setup 2FA
```

### Categories [Admin Only]

```
GET    /categories         - List semua kategori
POST   /categories         - Create kategori baru
GET    /categories/{id}    - Get kategori detail
PUT    /categories/{id}    - Update kategori
DELETE /categories/{id}    - Delete kategori
```

### Products [Admin Only]

```
GET    /products           - List semua produk (dengan relasi kategori)
POST   /products           - Create produk baru
GET    /products/{id}      - Get produk detail
PUT    /products/{id}      - Update produk
DELETE /products/{id}      - Delete produk
```

### Transactions [Admin Only]

```
GET    /transactions       - List semua transaksi (dengan relasi cashier & details)
POST   /transactions       - Create transaksi baru
GET    /transactions/{id}  - Get transaksi detail
PUT    /transactions/{id}  - Update transaksi
DELETE /transactions/{id}  - Delete transaksi
```

### Transaction Details [Admin Only]

```
GET    /transaction-details          - List detail transaksi (dengan relasi product)
POST   /transaction-details          - Create detail baru
GET    /transaction-details/{id}     - Get detail spesifik
PUT    /transaction-details/{id}     - Update detail
DELETE /transaction-details/{id}     - Delete detail
```

**Response Format:**

```json
{
    "id": 1,
    "name": "Kategori Minuman",
    "description": "Berbagai minuman",
    "created_at": "2026-04-09T10:30:00Z"
}
```

---

## 📄 Halaman & Fitur Frontend

### 1. **Welcome Page** (`/`)

- Landing page publik Lunar Coffee dengan custom branding & animasi
- Menampilkan produk terbaru / featured drinks
- Integrasi menu dan keranjang belanja untuk pemesanan mandiri oleh Customer
- Link ke login/register

### 2. **Dashboard** (`/dashboard`) [Admin Only]

- Ringkasan metric: total kategori, produk, transaksi, omzet
- Tabel kategori dengan search & pagination
- Tabel produk dengan relasi kategori
- Tabel transaksi dengan relasi cashier & detail items
- Tabel detail transaksi dengan subtotal
- Empty states dan loading skeletons

### 3. **Categories Page** (`/categories-page`) [Admin Only]

- Tabel daftar kategori lengkap
- **CRUD Operations:**
    - Create: Dialog form dengan field name & description
    - Read: Display daftar dengan pagination
    - Update: Edit form via dialog
    - Delete: Konfirmasi delete
- Search by nama/deskripsi/id
- Pagination 6 baris per halaman

### 4. **Products Page** (`/products-page`) [Admin Only]

- Tabel daftar produk dengan kolom: ID, nama, kategori, harga, stok
- **CRUD Operations:**
    - Create: Form dengan category select, nama, harga, stok
    - Read: Display dengan loading skeleton
    - Update: Edit form via dialog
    - Delete: Konfirmasi delete
- Search by nama/kategori/id
- Pagination 6 baris per halaman

### 5. **Transactions Page** (`/transactions-page`) [Admin Only]

- Tabel transaksi dengan kolom: ID, pembeli, kasir, jumlah item, total harga
- **CRUD Operations:**
    - Create: Form untuk nama pembeli, total harga, cashier ID (opsional)
    - Read: Display dengan loading states
    - Update: Edit form via dialog
    - Delete: Konfirmasi delete
- Search by ID/pembeli/kasir
- Pagination 6 baris per halaman

### 6. **Transaction Details Page** (`/transaction-details-page`) [Admin Only]

- Tabel detail transaksi dengan kolom: ID, transaction ID, produk, qty, subtotal
- **CRUD Operations:**
    - Create: Form dengan transaction select, product select, qty select (1-20)
    - Read: Display item per transaksi
    - Update: Edit form via dialog
    - Delete: Konfirmasi delete
- Search by ID detail/ID transaksi/nama produk
- Pagination 6 baris per halaman

### 7. **Auth Pages**

- Login page dengan email/password
- Register page dengan validasi
- Forgot password flow
- Email verification
- 2FA setup & challenge pages
- Password reset confirmation
- Password update page

### 8. **Settings Pages**

- Profile update (nama, email)
- Password change
- Appearance settings (light/dark mode)

---

## 🔐 Authentication

### Features

- **Email/Password Login** - Fortify authentication
- **Email Verification** - Required sebelum akses routes auth
- **Remember Me** - Optional cookie-based persistence
- **2FA (TOTP)** - Optional two-factor authentication setup
- **Password Reset** - Email-based recovery link
- **Profile Management** - Update nama & email
- **Password Change** - Confirm password sebelum update

### Middleware

- `auth` - Require login
- `verified` - Require email verification
- `admin` - Require admin role (Role-Based Access Control)
- `throttle` - Rate limiting (contoh: 6 attempts per 1 minute untuk password reset)

### Fortify Configuration

File: `config/fortify.php`

- Login path: `/login`
- Home path: `/dashboard`
- Password validation rules dari `app/Concerns/PasswordValidationRules.php`

---

## 🧪 Development

### CLI Commands

#### Development Server

```bash
# Start Laravel development server
php artisan serve

# Start Vite dev server (terminal baru)
npm run dev

# Both concurrently
composer run dev
```

#### Build

```bash
# Production build
npm run build

# Build with SSR
npm run build:ssr
```

#### Code Quality

```bash
# Lint fixed
npm run lint
php artisan pint --parallel

# Check without fix
npm run lint:check
npm run format:check
npm run types:check
php artisan pint --parallel --test

# Full CI check
npm run types:check && npm run lint:check && npm run format:check && npm run types:check
```

#### Database

```bash
# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Fresh migrations
php artisan migrate:fresh

# Seed database
php artisan db:seed
```

#### Wayfinder (Route generation)

```bash
# Generate typed route functions
php artisan wayfinder:generate --no-interaction

# With form helpers
php artisan wayfinder:generate --with-form --no-interaction
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/AuthTest.php

# Run with coverage
php artisan test --coverage
```

### Test Framework

- **Pest 4.4** - Modern PHP testing framework
- Feature tests di `tests/Feature/`
- Unit tests di `tests/Unit/`
- Test database (in-memory SQLite)

---

## 📁 Struktur Project

```
cafe-management-system/
├── app/
│   ├── Actions/Fortify/          # Fortify authentication actions
│   ├── Concerns/                 # Validation traits
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── CategoryController.php
│   │   │   ├── ProductController.php
│   │   │   ├── TransactionController.php
│   │   │   ├── TransactionDetailController.php
│   │   │   └── Settings/
│   │   │       ├── ProfileController.php
│   │   │       └── SecurityController.php
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   │   ├── Category.php
│   │   ├── Product.php
│   │   ├── Transaction.php
│   │   ├── TransactionDetail.php
│   │   └── User.php
│   └── Providers/
│       └── FortifyServiceProvider.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── fortify.php               # Auth configuration
│   └── ...
├── database/
│   ├── migrations/
│   │   ├── *_create_users_table.php
│   │   ├── *_create_cache_table.php
│   │   ├── *_create_jobs_table.php
│   │   ├── *_add_two_factor_columns_to_users_table.php
│   │   └── 2026_04_08_120000_create_pos_schema_tables.php
│   ├── factories/
│   │   └── UserFactory.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── resources/
│   ├── css/
│   │   └── app.css               # Tailwind CSS
│   └── js/
│       ├── app.tsx               # Inertia entry
│       ├── components/
│       │   ├── ui/               # shadcn components
│       │   │   ├── table.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── input.tsx
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── select.tsx
│       │   │   ├── alert.tsx
│       │   │   └── ...
│       │   ├── app-shell.tsx
│       │   ├── app-sidebar.tsx
│       │   ├── pos-data-hub.tsx  # Dashboard hub
│       │   └── nav-main.tsx
│       ├── lib/
│       │   └── api-client.ts     # Fetch with CSRF
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   ├── forgot-password.tsx
│       │   │   ├── reset-password.tsx
│       │   │   ├── verify-email.tsx
│       │   │   ├── confirm-password.tsx
│       │   │   └── two-factor-challenge.tsx
│       │   ├── settings/
│       │   │   ├── profile.tsx
│       │   │   ├── security.tsx
│       │   │   └── appearance.tsx
│       │   ├── categories/
│       │   │   └── index.tsx      # Categories CRUD
│       │   ├── products/
│       │   │   └── index.tsx      # Products CRUD
│       │   ├── transactions/
│       │   │   └── index.tsx      # Transactions CRUD
│       │   ├── transaction-details/
│       │   │   └── index.tsx      # Transaction Details CRUD
│       │   ├── dashboard.tsx
│       │   ├── product.tsx        # Legacy product page (deprecated)
│       │   └── welcome.tsx
│       ├── routes/               # Wayfinder generated
│       │   ├── categories/
│       │   ├── products/
│       │   ├── transactions/
│       │   ├── transaction-details/
│       │   └── index.ts
│       ├── types/
│       ├── layouts/
│       └── hooks/
├── routes/
│   ├── web.php                   # Web routes
│   ├── settings.php              # Settings routes
│   └── console.php
├── storage/
├── tests/
│   ├── Feature/
│   └── Unit/
├── public/
├── vendor/
├── node_modules/
├── .agents/              # Agent skills (design-md, enhance-prompt)
├── DESIGN.md             # Design system documentation
├── .env.example
├── artisan
├── composer.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── eslint.config.js
├── pint.json
└── README.md
```

---

## 🔗 Key Features Explained

### 1. Wayfinder Type-Safe Routing

```typescript
// Auto-generated di resources/js/routes/
import { index, store, update, destroy } from '@/routes/categories';

// Usage dalam component
const url = index.url(); // '/categories'
const createUrl = store.url(); // '/categories'
const updateUrl = update.url({ id }); // '/categories/{id}'
```

### 2. API Client dengan CSRF

```typescript
// resources/js/lib/api-client.ts
import { apiRequest } from '@/lib/api-client';

const data = await apiRequest<Category[]>(index.url()); // GET
await apiRequest(store.url(), 'POST', payload); // POST
await apiRequest(update.url(id), 'PUT', payload); // PUT
await apiRequest(destroy.url(id), 'DELETE'); // DELETE
```

### 3. Component & Pagination

```typescript
// Tabel dengan search & pagination
const [search, setSearch] = useState('');
const [page, setPage] = useState(1);

const filtered = useMemo(() => {
    return rows.filter((row) =>
        row.name.toLowerCase().includes(search.toLowerCase()),
    );
}, [rows, search]);

const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
```

### 4. Dialog Form untuk CRUD

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{editingId ? 'Edit' : 'Tambah'}</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <Input value={form.name} onChange={...} />
      <DialogFooter>
        <Button variant="outline">Batal</Button>
        <Button type="submit">Simpan</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## 🐛 Troubleshooting

### Frontend Asset Changes Not Reflected

**Solution:** Jalankan `npm run build` atau `npm run dev` untuk rebuild assets.

### Database Connection Error

**Solution:**

1. Jika menggunakan default (SQLite), pastikan file `database/database.sqlite` ada dan memiliki permission yang benar.
2. Jika menggunakan MySQL, cek `.env` dan pastikan service MySQL berjalan.
3. Run `php artisan migrate` untuk membuat tabel

### CSRF Token Error pada Request

**Solution:**

- Pastikan `<meta name="csrf-token" content="{{ csrf_token() }}">` ada di `app.blade.php`
- Pastikan `apiRequest()` function sudah dipanggil untuk non-GET requests

### Wayfinder Routes Not Generated

**Solution:** Run `php artisan wayfinder:generate --no-interaction` untuk regenerate routes.

### 2FA Not Working

**Solution:** Pastikan kolom `two_factor_secret` dan `two_factor_recovery_codes` sudah di database (cek migration 2FA).

### Port 8000 Already in Use

**Solution:** `php artisan serve --port=8001` atau gunakan port lain.

---

## 📝 Notes

- Aplikasi menggunakan **Indonesia locale** untuk formatting tanggal dan mata uang
- Semua API endpoints mengembalikan JSON response
- Error handling include validation errors & server errors
- Component UI dari shadcn/ui untuk consistency
- Tailwind CSS untuk styling (dark mode support)
- ESLint + Prettier untuk code quality
- TypeScript strict mode untuk type safety

---

## 📞 Support

Untuk pertanyaan atau issues, silakan buat issue di repository atau hubungi tim development.

---

## 📄 License

MIT License - Bebas digunakan untuk development dan commercial.

---

**Last Updated:** May 5, 2026  
**Version:** 1.1.0  
**Status:** Production Ready
