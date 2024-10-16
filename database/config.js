const mysql = require('mysql2');

// Konfigurasi pool koneksi ke database MySQL
const pool = mysql.createPool({
    host: '167.172.95.72', // Alamat host MySQL, bisa juga IP server
    user: 'binus',         // Nama pengguna MySQL
    password: '35536298',  // Password MySQL
    database: 'apigpt',    // Nama database yang akan diakses
    waitForConnections: true, // Menunggu koneksi jika pool penuh
    connectionLimit: 10,      // Jumlah maksimum koneksi dalam pool
    queueLimit: 0             // Tidak ada batasan antrian koneksi
});

// Test koneksi ke database MySQL
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id', connection.threadId);
    connection.release(); // Lepaskan koneksi kembali ke pool
});

// Ekspor pool koneksi agar bisa digunakan di file lain
module.exports = pool;
