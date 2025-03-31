const express = require('express');
const sql = require('mssql');
const dbConfig = require('../config/dbConfig');

const router = express.Router();

const fetchBlogPost = async (postId) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .input('PostId', sql.Int, postId)
      .query('SELECT * FROM dbo.Blogs_tbl WHERE postId = @PostId');
    return result.recordset[0];
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    sql.close();
  }
};

async function fetchBlogPosts() {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .query('SELECT * FROM dbo.Blogs_tbl');
    return result.recordset;
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    throw new Error('Error fetching blog posts');
  } finally {
    sql.close();
  }
};

async function fetchReviewPostsUser() {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .query('SELECT * FROM dbo.Review_tbl WHERE show = 1'); // Filter reviews where show is true
    return result.recordset;
  } catch (err) {
    console.error('Error fetching Review posts:', err);
    throw new Error('Error fetching Review posts');
  } finally {
    sql.close();
  }
};

router.get('/', async (req, res) => {
  try {
    const ReviewPost = await fetchReviewPostsUser();
    recentReview = ReviewPost.slice(0, 9);
    const blogPosts = await fetchBlogPosts();
    const recentPosts = blogPosts.slice(0, 4);
    res.render('home', { title: `دکترا و متخصص روانشناسی`, blogs: recentPosts, reviews: recentReview });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

router.get('/about', async (req, res) => {
  try {
    const ReviewPost = await fetchReviewPostsUser();
    recentReview = ReviewPost.slice(0, 9);
    res.render('about', { title: "درباره ما ", reviews: recentReview });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

router.get('/service', async (req, res) => {
  try {
    const ReviewPost = await fetchReviewPostsUser();
    recentReview = ReviewPost.slice(0, 9);
    res.render('services', { title: "خدمات ما ", reviews: recentReview });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

router.get('/pricing', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.visit_tbl WHERE status = N'در دسترس'");
    const visitTime = result.recordset;
    const resultd = await pool.request().query("SELECT * FROM dbo.online_visit_tbl WHERE status = N'در دسترس'");
    const onlineVisitTime = resultd.recordset;
    const ReviewPost = await fetchReviewPostsUser();
    recentReview = ReviewPost.slice(0, 9);
    res.render('pricing', { title: "رزرو  نوبت ", reviews: recentReview , VistTime: visitTime ,onlineVisitTime:onlineVisitTime });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

router.get('/pricingg', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM dbo.visit_tbl WHERE status <> N'در دسترس'");
    const visitTime = result.recordset;
    const ReviewPost = await fetchReviewPostsUser();
    recentReview = ReviewPost.slice(0, 9);
    res.render('reserve', { title: "رزرو  نوبت ", reviews: recentReview , VistTime: visitTime  });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});


router.get('/counselor', (req, res) => {
  res.render('counselor');
});

router.get('/review', (req, res) => {
  res.render('Reviews');
});

router.get('/contact', (req, res) => {
  res.render('contact');
});

router.get('/Blogs', async (req, res) => {
  try {
    const blogPosts = await fetchBlogPosts();
    res.render('blogs', { layout: 'main', title: 'همه مقالات', blogs: blogPosts });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

router.get('/blog/:id', async (req, res) => {
  const postId = req.params.id;
  const blogPosts = await fetchBlogPosts();
  const recentPosts = blogPosts.slice(0, 3);
  try {
    const post = await fetchBlogPost(postId);
    if (!post) {
      return res.status(404).send('Blog post not found');
    }
    res.render('blog', { title: post.Title, postt: post, blogs: recentPosts });
  } catch (err) {
    res.status(500).send('Error retrieving blog post');
  } finally {
    sql.close();
  }
});

router.get('/signin', (req, res) => {
  res.render('signin', { title: 'Sign In' });
});


module.exports = router;
