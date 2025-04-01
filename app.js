const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { engine } = require('express-handlebars');
require('./helpers/handlebars-helpers');
require('dotenv').config();
const sql = require('mssql');
const authMiddleware = require('../middleware/authMiddleware');
const dbConfig = require('../config/dbConfig');

const express = require('express');
const app = express();
const PORT = process.env.PORT;


// Set up Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views/partials'),
  layoutsDir: path.join(__dirname, 'views/layouts'),
}));
app.set('view engine', 'handlebars');
app.set('views', [path.join(__dirname, 'views'),
path.join(__dirname, 'views/forms'),
path.join(__dirname, 'views/dashboard')]);

// Serve static files
app.use('/public', express.static(path.join(__dirname, './public')));
app.use('/assets', express.static(path.join(__dirname, './assets')));

// Ensure body-parsing middleware is included
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON and URL-encoded requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to handle cookies
app.use(cookieParser());

// Configure session middleware
app.use(session({
  secret: process.env.SESEC,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  }
}));



const authRoutes = require('./routes/auth');
const reviewsRouter = require('./routes/reviews');
const contactusRoute = require('./routes/contactus-route');
const appointmentRoutes = require('./routes/appointmentRoutes');
const blogsRoutes = require('./routes/blogsRoutes');
const shower = require("./routes/reviews")
const dashboardRoutes = require('./routes/dashboardRoutes');
const homeRoutes = require('./routes/homeRoutes');

// Register routes after middleware
app.use('/auth', authRoutes);
app.use('/reviews', reviewsRouter);
app.use('/api', contactusRoute);
app.use('/api', appointmentRoutes);
app.use('/api', blogsRoutes);
app.use('/api', shower);
app.use('/dashboard', dashboardRoutes);
app.use('/', homeRoutes);


// main route


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

app.get('/', async (req, res) => {
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

app.get('/about', async (req, res) => {
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

app.get('/service', async (req, res) => {
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

app.get('/pricing', async (req, res) => {
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

app.get('/pricingg', async (req, res) => {
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


app.get('/counselor', (req, res) => {
  res.render('counselor');
});

app.get('/review', (req, res) => {
  res.render('Reviews');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/Blogs', async (req, res) => {
  try {
    const blogPosts = await fetchBlogPosts();
    res.render('blogs', { layout: 'main', title: 'همه مقالات', blogs: blogPosts });
  } catch (err) {
    res.status(500).send(err.message);
  } finally {
    sql.close();
  }
});

app.get('/blog/:id', async (req, res) => {
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

app.get('/signin', (req, res) => {
  res.render('signin', { title: 'Sign In' });
});



//dasshboard route


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

app.get('/dashboard', authMiddleware, (req, res) => {
  res.render('dashboard', { title: ` dashboard `, layout: "__dashboard" });
});

app.get('/dashboard/blogEditor', authMiddleware, async (req, res) => {
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

app.get('/dashboard/visit', authMiddleware, async (req, res) => {
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

app.get('/dashboard/visited', authMiddleware, async (req, res) => {
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


app.get('/dashboard/missVisit', authMiddleware, async (req, res) => {
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

app.get('/dashboard/online-visit', authMiddleware, async (req, res) => {
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

app.get('/dashboard/online-visited', authMiddleware, async (req, res) => {
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


app.get('/dashboard/online-missVisit', authMiddleware, async (req, res) => {
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





app.get('/dashboard/review', authMiddleware, async (req, res) => {
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






// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});