const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'ravikeskus'
});

db.connect(err => {
    if (err) throw err;
    console.log('✅ MySQL Bağlandı!');
});

// Tüm rezervasyonları getir
app.get('/api/reservations', (req, res) => {
    db.query('SELECT * FROM reservations', (err, results) => {
        if (err) return res.status(500).send(err);
        const formatted = {};
        results.forEach(row => { formatted[row.box_id] = row; });
        res.json(formatted);
    });
});

// Yeni Rezervasyon (Varsayılan durum: Odottaa hyväksyntää)
app.post('/api/reservations', (req, res) => {
    const { box_id, horse_name, trainer, arrival_time, departure_time } = req.body;
    const sql = `INSERT INTO reservations (box_id, horse_name, trainer, arrival_time, departure_time, status) 
                 VALUES (?, ?, ?, ?, ?, 'Odottaa hyväksyntää') 
                 ON DUPLICATE KEY UPDATE 
                 horse_name=?, trainer=?, arrival_time=?, departure_time=?, status='Odottaa hyväksyntää'`;
    
    db.query(sql, [box_id, horse_name, trainer, arrival_time, departure_time, horse_name, trainer, arrival_time, departure_time], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Onaylama veya Durum Güncelleme
app.patch('/api/reservations/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE reservations SET status = ? WHERE box_id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// Rezervasyon Sil
app.delete('/api/reservations/:id', (req, res) => {
    db.query('DELETE FROM reservations WHERE box_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.listen(3000, () => console.log('🚀 Sunucu http://localhost:3000 portunda hazır!'));