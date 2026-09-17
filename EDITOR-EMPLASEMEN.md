# Editor emplasemen — snap to grid

Implementasi 17 September 2026 sesuai instruksi pemilik: titik/vertex wesel dihubungkan dengan segmen, selalu snap to grid.

## Cara pakai

1. Buka Emplasemen dan pilih stasiun. Panel Editor emplasemen tersedia meski stasiun belum mempunyai template.
2. Pilih mode Tambah wesel, klik kisi. Titik diberi nama W1, W2, dst. Tersedia port A (pangkal), B (lurus), C (belok).
3. Tambah ujung jalur untuk batas jaringan atau ujung segmen. Port ujung bernama U.
4. Pilih Hubungkan ujung, isi nama segmen, panjang dalam meter dan Vmax. Klik dua port pada titik berbeda. Segmen hanya disimpan jika data dan kedua port valid.
5. Pilih Edit / geser titik untuk memindahkan vertex. Semua posisi menempel ke kisi 20 unit gambar. Km stasiun dan panjang segmen tidak dihitung dari ukuran gambar.
6. Klik vertex/segmen untuk properti. Nama, orientasi wesel 0/90/180/270, V lurus/belok serta panjang/Vmax segmen dapat diubah. Kecepatan wesel yang belum diisi disimpan null, bukan dianggap nilai operasional.
7. Urungkan/Ulangi tersedia untuk tambah, sambung, pindah, properti dan hapus. Hapus vertex meminta konfirmasi dan menghapus segmen terkait; dapat diurungkan. Esc/pointer cancel mengembalikan perpindahan yang belum selesai.
8. Latar dapat digeser, scroll/tombol untuk zoom, Tampilkan Semua untuk memasukkan seluruh rancangan ke layar. Mode Lihat tidak memindahkan vertex.
9. Periksa Lintasan memilih dua titik ujung, memeriksa sambungan dan menampilkan total panjang segmen serta kebutuhan posisi wesel. Ini pemeriksaan keterhubungan, bukan perhitungan interlocking, okupansi, atau konflik.
10. Rancangan otomatis ikut data proyek dan Simpan JSON. Riwayat Urungkan hanya untuk sesi/stasiun aktif.

## Aturan

- Sambungan eksternal hanya antar-port pada vertex berbeda, satu segmen per port.
- Transisi dalam wesel hanya A-B dan A-C, dua arah. B-C tidak sah.
- Persilangan garis tanpa vertex/port tidak membentuk sambungan.
- Titik tidak boleh menempati pusat kisi yang sama. Port terisi, angka panjang/kecepatan tidak positif, referensi rusak dan identitas kembar ditolak.
- Pengujian rute tidak mengunjungi vertex yang sama dua kali; manuver langsir/balik arah belum dimodelkan.

## Penyimpanan dan batas integrasi

Rancangan berada pada `stasiun.diagramEmplasemen` versi 1, dengan `nodes[]` dan `edges[]`. ID vertex/segmen tetap saat digeser atau namanya diubah. Rancangan tiap stasiun terpisah dan tetap ikut migrasi/simpan-buka JSON. Template lama `stasiun.layout` dipertahankan dan tidak ditimpa.

**Rancangan graf belum menjadi sumber perhitungan konflik/simulasi.** UI menyatakan batas ini dan menamai skema lama sebagai template perhitungan. Konversi template otomatis, sinyal sebagai vertex, rute interlocking dan integrasi mesin operasi belum dikerjakan. Ini tidak dinyatakan sebagai penyelesaian semua tahap emplasemen.

## Uji

- `node tests/emplasemen-graph.test.cjs`: snap, tabrakan posisi, sambungan, lintasan A-B/A-C dua arah, B-C ditolak, panjang tetap saat drag, rotasi, simpan/migrasi, data invalid, hapus segmen terkait.
- `node tests/emplasemen-editor.test.cjs`: alur klik dengan DOM tiruan, tambah vertex, sambung port, lintasan, drag, undo/redo, cancel, properti, hapus/undo, isolasi antarstasiun, buka ulang, template dan km tetap.
- `node tests/peta.test.cjs`: regresi editor Peta Jalur sebelumnya.
- Pemeriksaan sintaks JS baru dan JS UI.

Uji browser visual dan deployment belum diverifikasi. DOM tiruan tidak membuktikan ketepatan tampilan, pointer capture, atau persistensi IndexedDB nyata di browser pengguna.
