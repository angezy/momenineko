const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sql = require('mssql');
const dbConfig = require('../config/dbConfig'); // Corrected the path

// POST /reviews
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('problem').notEmpty().withMessage('Problem is required'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('comment').notEmpty().withMessage('Comment is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, phone, problem, comment } = req.body;
      const pool = await sql.connect(dbConfig);

      await pool.request()
        .input('Name', sql.NVarChar, name)
        .input('Phone', sql.NVarChar, phone)
        .input('Problem', sql.NVarChar, problem)
        .input('Comment', sql.NText, comment)
        .query(`
          INSERT INTO dbo.Review_tbl (Name, Phone, Problem, Comment, CreatedAt)
          VALUES (@Name, @Phone, @Problem, @Comment, GETDATE())
        `);

      res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
      console.error('Error saving review:', error);
      res.status(500).json({ error: 'Server error' });
    } finally {
      sql.close();
    }
  }
);

module.exports = router;
