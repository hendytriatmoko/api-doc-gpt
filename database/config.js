const mysql = require('mysql2');

// Konfigurasi koneksi ke database MySQL
const db = mysql.createConnection({
    host: '167.172.95.72', // Alamat host MySQL, bisa juga IP server
    user: 'binus',      // Nama pengguna MySQL
    password: '35536298',  // Password MySQL
    database: 'apigpt'  // Nama database yang akan diakses
});

// Buka koneksi
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id', db.threadId);
});

module.exports = db;
