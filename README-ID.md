# Desa Virtual — Starter gratis

Ini prototipe awal, bukan website produksi. Yang sudah berjalan tanpa akun: pratinjau desa 3D dan avatar sederhana. Pendaftaran/login online aktif setelah Supabase disiapkan. Chat, marketplace, editor avatar, transaksi kredit, dan editor bangunan belum selesai.

## Yang dibutuhkan
- Akun GitHub gratis: https://github.com/
- Akun Cloudflare gratis: https://dash.cloudflare.com/
- Akun Supabase gratis: https://supabase.com/
- Browser HP/komputer untuk proses awal. Lebih nyaman menggunakan mode desktop di browser HP.

## Langkah 1 — Siapkan database Supabase
1. Daftar/masuk ke Supabase dan buat organisasi/proyek baru.
2. Pilih paket Free. Simpan password database secara pribadi; jangan kirim ke siapa pun.
3. Setelah proyek siap, buka SQL Editor.
4. Buka file `supabase-schema.sql` dari paket ini, salin seluruh isinya, tempel di SQL Editor, lalu tekan Run.
5. Buka Project Settings > API. Salin Project URL dan anon/public key. Jangan salin `service_role` key.

## Langkah 2 — Hubungkan konfigurasi
Buka `index.html`, cari:
`window.DESAV_CONFIG = { supabaseUrl: "", supabaseAnonKey: "" };`
Isi URL dan anon key milik proyek Supabase di antara tanda kutip. Contoh bentuknya saja:
`window.DESAV_CONFIG = { supabaseUrl: "https://PROJECT.supabase.co", supabaseAnonKey: "ANON_PUBLIC_KEY" };`
Jangan gunakan service_role key. Simpan file.

## Langkah 3 — Unggah ke GitHub
1. Buat repository baru bernama `desa-virtual`.
2. Unggah file `index.html`, `style.css`, `app.js`, dan `supabase-schema.sql` (README juga boleh).
3. Pastikan `index.html` berada di bagian utama repository, bukan di dalam folder lain.

## Langkah 4 — Terbitkan gratis dengan Cloudflare Pages
1. Masuk Cloudflare Dashboard.
2. Pilih Workers & Pages > Create > Pages > Connect to Git.
3. Hubungkan GitHub dan pilih repository `desa-virtual`.
4. Framework preset: None. Build command: kosongkan. Build output directory: `/`.
5. Tekan Save and Deploy.
6. Cloudflare akan memberi alamat seperti `nama-proyek.pages.dev`.

## Langkah 5 — Jadikan akunmu admin
1. Daftar akun pertama melalui website.
2. Di Supabase buka Authentication > Users, salin UUID akunmu.
3. Buka SQL Editor dan jalankan perintah berikut dengan UUID akunmu:
`update public.profiles set role='admin' where id='UUID_AKUN_KAMU';`
4. Keluar lalu masuk lagi ke website.

## Penting sebelum dibuka ke umum
- Belum ada pembelian, transfer saldo, atau pencairan uang.
- Saldo awal hanyalah angka kredit internal. Jangan menganggapnya uang.
- Jangan mengaktifkan pembayaran sungguhan.
- Tambahkan kebijakan privasi, syarat layanan, moderasi, pembatasan spam, backup, dan pengujian keamanan sebelum peluncuran publik.
- Jangan pernah mengunggah password database atau `service_role` key ke GitHub atau website.
- Paket gratis punya batas dan ketentuan yang dapat berubah; Supabase Free dapat menjeda proyek yang tidak aktif.
- Peta 3D saat ini adalah contoh statis. Data bangunan dari database dan alat admin akan ditambahkan pada iterasi selanjutnya.

## Struktur
- `index.html` — halaman utama
- `style.css` — tampilan responsif
- `app.js` — dunia 3D, autentikasi
- `supabase-schema.sql` — tabel dan kebijakan akses awal
