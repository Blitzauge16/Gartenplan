//ihr werden Gegenstände dokumentiert die gepeichert werden
//die Gegenstände sind zum gestalten oder zu Dokumentieren das was 
const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

//get objects
router.get(async(req, res) => {
    try {
        const { rows } = await pool.query(`Select`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
)