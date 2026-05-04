const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware-asetukset
app.use(cors());
app.use(bodyParser.json());

// Palvelee staattisia tiedostoja (HTML, CSS, JS) suoraan juurikansiosta
app.use(express.static(__dirname));

// Aiven MySQL -tietokantayhteys
const db = mysql.createConnection({
    host: 'mysql-e86bf43-ravit.h.aivencloud.com',
    port: 20106,
    user: 'avnadmin',
    password: 'AVNS_HYwsynmmBFxYYpqGfjq',
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
});

// Yhdistetään tietokantaan
db.connect(err => {
    if (err) {
        console.error('❌ Tietokantavirhe:', err.message);
        return;
    }
    console.log('✅ Yhteys Aiven MySQL -tietokantaan muodostettu!');
});

// --- API-REITIT ---

// Hae kaikki varaukset
app.get('/api/reservations', (req, res) => {
    db.query('SELECT * FROM reservations', (err, results) => {
        if (err) return res.status(500).send(err);
        const formatted = {};
        results.forEach(row => { 
            formatted[row.box_id] = row; 
        });
        res.json(formatted);
    });
});

// Uusi varaus tai päivitys
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

// Varauksen poistaminen
app.delete('/api/reservations/:id', (req, res) => {
    db.query('DELETE FROM reservations WHERE box_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// --- REITYS ---

// Tarjoile index.html pääsivuna (Status 1 virheen korjaus)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Renderin dynaaminen portti
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Palvelin valmiina portissa ${PORT}`);
});
