# 🚀 Panduan Operasional Backend - SmartConnect CRM (Kelompok 2)

Panduan ini dibuat agar seluruh anggota tim dapat menjalankan server backend utama, database MySQL, dan menguji integrasi WhatsApp Gateway secara mandiri di perangkat masing-masing.

---

## 🛠️ Prasyarat Sistem
Pastikan laptopmu sudah terinstal:
1. **Node.js** (Versi 18 atau 20 LTS)
2. **XAMPP** atau **MySQL Server & Workbench**
3. **Git**
4. **VS Code**

---

## 🏃‍♂️ Langkah 1: Pull & Sinkronisasi Kode Git
Buka terminal di VS Code, masuk ke direktori proyek, lalu pastikan kodemu adalah yang paling mutakhir dari Zerive:
```bash
# Mengambil update backend terbaru dari repositori GitHub utama
git pull origin main

# Menginstal dependensi baru (seperti axios dan csv-parser)
npm install

## 🗄️ Langkah 2: Inisialisasi Database (MySQL / XAMPP)Opsi A: Menggunakan MySQL WorkbenchMasuk ke Local Instance MySQL Workbench milikmu.Eksekusi skrip SQL di bawah ini untuk membuat database dan tabel:SQLCREATE DATABASE IF NOT EXISTS smartconnect_crm;
USE smartconnect_crm;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'New Lead',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    direction ENUM('incoming', 'outgoing') NOT NULL,
    category_by_AI VARCHAR(20) DEFAULT 'Inquiry',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_training_dataset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    label VARCHAR(20) NOT NULL
);
Opsi B: Menggunakan phpMyAdmin (XAMPP)Aktifkan modul MySQL pada XAMPP Control Panel.Buka browser, akses http://localhost/phpmyadmin/.Klik tab SQL, tempel skrip pembuatan database di atas, lalu klik Go.
## 🔑 Langkah 3: Konfigurasi Environment (.env)Buat file bernama .env secara manual di root folder proyek, lalu sesuaikan isinya:Pengguna MySQL Workbench:Cuplikan kode    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=ISI_PASSWORD_WORKBENCH_KAMU
    DB_NAME=smartconnect_crm
    ```
*   **Pengguna XAMPP (Default tanpa password):**
```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=smartconnect_crm
    ```

---

## 🚀 Langkah 4: Menjalankan Server & Otentikasi WhatsApp
1. Jalankan perintah berikut di terminal:
```bash
   node index.js
Jika muncul QR Code di terminal, buka WhatsApp HP-mu $\rightarrow$ Perangkat Tautan $\rightarrow$ Tautkan Perangkat, lalu pindai QR tersebut.Setelah berhasil terhubung, terminal akan mencetak log: [CRM] Selamat Zerive, WhatsApp Gateway Berhasil Terhubung!.🧪 Langkah 5: Skenario Pengujian Alur Kerja (Testing)Ambil HP lain, lakukan simulasi pengiriman pesan ke nomor gateway untuk menguji integrasi hibrida otomasi:Uji Kasus Inquiry: Kirim chat "Apakah ada promo?" $\rightarrow$ Sistem mencatat log kategori Inquiry dan mengirimkan balasan informasi umum secara otomatis.Uji Kasus Complaint: Kirim chat "Aplikasi sering keluar sendiri" $\rightarrow$ Sistem mencatat log kategori Complaint, mengklasifikasikannya ke tabel messages, dan bot memberikan pesan mitigasi komplain.Uji Kasus Transaction: Kirim chat "Saya mau konfirmasi bukti transfer" $\rightarrow$ Sistem mencatat log kategori Transaction dan bot memberikan balasan konfirmasi validasi finansial.