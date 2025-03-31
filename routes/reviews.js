const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const sql = require('mssql');
const dbConfig = require('../config/dbConfig');

// POST /reviews
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('نام الزامی است'),
    body('problem').notEmpty().withMessage('مشکل الزامی است'),
    body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('شماره تلفن نامعتبر است'),
    body('comment').notEmpty().withMessage('نظر الزامی است'),
  ],
  async (req, res) => {
  
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'بدنه درخواست خالی است. مطمئن شوید که Content-Type روی application/json تنظیم شده است.',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.session.formData = req.body; // Save form data in session
      return res.status(400).json({ 
        success: false,
        message: 'اعتبارسنجی ناموفق بود', 
        errors: errors.array() 
      });
    }

    try {
      const { name, phone, problem, comment } = req.body;
      const pool = await sql.connect(dbConfig);

      await pool.request()
        .input('Name', sql.NVarChar, name)
        .input('Phone', sql.NVarChar, phone || null)
        .input('Problem', sql.NVarChar, problem)
        .input('Comment', sql.NText, comment)
        .query(`
          INSERT INTO dbo.Review_tbl (Name, Phone, Problem, Comment, date)
          VALUES (@Name, @Phone, @Problem, @Comment, GETDATE())
        `);

      req.session.formData = null; // Clear session data after successful submission
      res.status(201).json({ 
        success: true, 
        message: 'نظر شما با موفقیت ثبت شد' 
      });
    } catch (error) {
      console.error('Error saving review:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطا در ارتباط با سرور' 
      });
    } finally {
      sql.close();
    }
  }
);

// POST /reviews/update-show
router.post('/update-show', async (req, res) => {
  const { reviewId, show } = req.body;

  if (!reviewId || typeof show === 'undefined') {
    return res.status(400).json({
      success: false,
      message: 'درخواست نامعتبر. شناسه نظر یا مقدار نمایش وجود ندارد.',
    });
  }

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('ReviewID', sql.Int, reviewId)
      .input('Show', sql.Bit, show)
      .query(`
        UPDATE dbo.Review_tbl
        SET Show = @Show
        WHERE ReviewID = @ReviewID
      `);

    res.status(200).json({
      success: true,
      message: 'وضعیت نمایش با موفقیت به‌روزرسانی شد.',
    });
  } catch (error) {
    console.error('Error updating show status:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارتباط با سرور',
    });
  } finally {
    sql.close();
  }
});

// DELETE /reviews/delete
router.delete('/delete', async (req, res) => {
  const { reviewId } = req.body;

  if (!reviewId) {
    return res.status(400).json({
      success: false,
      message: 'درخواست نامعتبر. شناسه نظر وجود ندارد.',
    });
  }

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('ReviewID', sql.Int, reviewId)
      .query(`
        DELETE FROM dbo.Review_tbl
        WHERE ReviewID = @ReviewID
      `);

    res.status(200).json({
      success: true,
      message: 'نظر با موفقیت حذف شد.',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارتباط با سرور',
    });
  } finally {
    sql.close();
  }
});

// GET /reviews/form-data
router.get('/form-data', (req, res) => {
  res.json(req.session.formData || {}); // Send saved form data from session
});

module.exports = router;
