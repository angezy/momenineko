const express = require('express');
const sql = require('mssql');
const authMiddleware = require('../middleware/authMiddleware');
const dbConfig = require('../config/dbConfig');

const router = express.Router();

async function fetchReviewPosts() {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .query('SELECT * FROM dbo.Review_tbl');
    return result.recordset;
  } catch (err) {
    console.error('Error fetching Review posts:', err);
    throw new Error('Error fetching Review posts');
  } finally {
    sql.close();
  }
};

router.get('/', authMiddleware, (req, res) => {
  res.render('dashboard', { title: ` dashboard `, layout: "__dashboard" });
});

router.get('/blogEditor', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .query('SELECT postId, Title, Description, Imag, Contents, CreatedAt FROM dbo.Blogs_tbl');
    const blogPosts = result.recordset;

    res.render('blogEditor', { layout: '__dashboard', title: 'ویرایشگر وبلاگ', blogs: blogPosts });
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    res.status(500).send('Error fetching blog posts');
  } finally {
    sql.close();
  }
});

router.get('/visit', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.visit_tbl WHERE status <> N'ویزیت شده'");
    const visitTime = result.recordset;
    res.render('appointment', { title: 'نوبت دهی', layout: '__dashboard', VistTime: visitTime });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).send('Error fetching entries');
  } finally {
    sql.close();
  }
});

router.get('/visited', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.visit_tbl WHERE status = N'ویزیت شده'");
    const visitTime = result.recordset;
    res.render('visited', { title: 'نوبت دهی', layout: '__dashboard', VistTime: visitTime });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).send('Error fetching entries');
  } finally {
    sql.close();
  }
});


router.get('/missVisit', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.visit_tbl WHERE status <> N'ویزیت شده' ");
    const visitTime = result.recordset;
    res.render('misvis', { title: 'نوبت دهی', layout: '__dashboard', VistTime: visitTime });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).send('Error fetching entries');
  } finally {
    sql.close();
  }
});

router.get('/online-visit', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.online_visit_tbl WHERE status <> N'ویزیت شده'");
    const visitTime = result.recordset;
    res.render('online-appointment', { title: 'نوبت دهی', layout: '__dashboard', VistTime: visitTime });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).send('Error fetching entries');
  } finally {
    sql.close();
  }
});

router.get('/online-visited', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.online_visit_tbl WHERE status = N'ویزیت شده'");
    const visitTime = result.recordset;
    res.render('online-visited', { title: 'نوبت دهی', layout: '__dashboard', VistTime: visitTime });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).send('Error fetching entries');
  } finally {
    sql.close();
  }
});


router.get('/online-missVisit', authMiddleware, async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.online_visit_tbl WHERE status <> N'ویزیت شده' ");
    const visitTime = result.recordset;
    res.render('online-misvis', { title: 'نوبت دهی', layout: '__dashboard', VistTime: visitTime });
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).send('Error fetching entries');
  } finally {
    sql.close();
  }
});





router.get('/review', authMiddleware, async (req, res) => {
  try {
    const ReviewPost = await fetchReviewPosts();

    res.render('reviewPublisher', { title: 'نظرات', layout: "__dashboard", ReviewPost: ReviewPost });
  } catch (err) {
    console.error('Error fetching lister:', err);
    res.status(500).send('Error fetching lister');
  } finally {
    sql.close();
  }
});

module.exports = router;
