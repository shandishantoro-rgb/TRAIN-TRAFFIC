# Peta Jalur — interaksi dan tata letak

Perubahan 17 September 2026, atas persetujuan Pemilik Proyek.

## Cara menggunakan

1. Buka proyek, lalu Peta Jalur.
2. Tarik area kosong untuk menggeser tampilan. Gunakan scroll atau tombol −/+ untuk zoom. Tampilkan Semua memasukkan seluruh jaringan ke layar.
3. Klik stasiun atau petak untuk melihat propertinya di bawah kanvas.
4. Ubah Mode: Lihat menjadi Mode: Edit. Tarik stasiun; garis petak mengikuti. Klik Edit Properti untuk membuka formulir yang sudah ada.
5. Urungkan/Ulangi berlaku untuk posisi dan tampilan peta selama sesi. Ctrl/Cmd+Z bekerja ketika kanvas berfokus; Shift menambahkan Ulangi. Riwayat tidak disimpan lintas pembukaan proyek.
6. Posisi dan tampilan ikut penyimpanan proyek serta Simpan JSON. Tutup-buka proyek untuk memeriksa persistensi di browser pengguna.

Posisi gambar (`stasiun.petaPos`) dan tampilan (`petaJalur.view`) terpisah dari km/jarak. Peta bersifat skematis. Gambar ulang dihapus; gambar diperbarui saat data berubah. Edit properti mempertahankan layout dan posisi. Perubahan kode stasiun ditolak sementara karena referensinya dipakai petak/jadwal; pengubahan referensi menyeluruh di luar perubahan ini.

## Cakupan

Selesai implementasi awal: Lihat/Edit, pan, zoom, pilih objek, formulir properti yang sudah ada, drag stasiun, persistensi, undo/redo, Tampilkan Semua.
Belum dibuat: Tambah Stasiun/Hubungkan langsung di kanvas, Rapikan Otomatis, pengubahan kode beserta semua referensinya, perbaikan mesin jadwal/konflik/simulasi.

## Verifikasi

`node tests/peta.test.cjs`: lulus pengujian interaksi pada DOM tiruan, termasuk garis mengikuti drag, mode Lihat, cancel, undo/redo, zoom, fit, migrasi JSON, dan km/jarak tetap. Pemeriksaan sintaks tiga JS yang diubah lulus.

Uji browser nyata belum dijalankan: Chromium tidak tersedia dan pengunduhannya timeout. Hasil deployment dan persistensi IndexedDB nyata belum dinyatakan lulus. Pemilik belum memverifikasi; tidak ada tahap ROADMAP yang ditandai selesai.
