

const express = require('express');
const router = express.Router();
const pool = require('../db');

async function isAdmin(token) {
    if (!token) return false;
    const result = await pool.query(
        `SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
        [token]
    );
    return result.rows[0]?.name === 'admin';
}

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const token = req.headers.authorization;
    
    if (!await isAdmin(token)) {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const { name, price, stock_quantity } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO products (name, price, stock_quantity) VALUES ($1, $2, $3) RETURNING *',
            [name, price, stock_quantity]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const token = req.headers.authorization;
    
    if (!await isAdmin(token)) {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const id = req.params.id;
    const { name, price, stock_quantity } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE products SET name=$1, price=$2, stock_quantity=$3 WHERE id=$4 RETURNING *',
            [name, price, stock_quantity, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const token = req.headers.authorization;
    
    if (!await isAdmin(token)) {
        return res.status(403).json({ error: 'Нет прав' });
    }
    
    const id = req.params.id;
    
    try {
        const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json({ message: 'Товар удален' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;