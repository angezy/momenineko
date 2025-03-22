require('dotenv').config();
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const sql = require('mssql');
const authMiddleware = require('../middleware/authMiddleware');
const dbConfig = require('../config/dbConfig');
const authRoutes = require('../routes/auth');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session'); 
const reviewsRouter = require('./routes/reviews');

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
  app.use('/public', express.static(path.join(__dirname, '../public')));

// Ensure body-parsing middleware is included
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to handle cookies
app.use(cookieParser());

// Configure session middleware
app.use(session({
  secret: process.env.SESEC ,
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict',
  }
}));

// Register routes after middleware
app.use('/auth', authRoutes);
app.use(bodyParser.json());
app.use('/reviews', reviewsRouter);

const fetchBlogPost = async (postId) => {
    try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
        .input('PostId', sql.Int, postId)
        .query('SELECT Title, Image, Contents, Description FROM dbo.BlogPosts_tbl WHERE postId = @PostId');
      return result.recordset[0];
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    } finally {
      sql.close();
  }};
  async function fetchBlogPosts() {
    try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
      .query('SELECT postId, Title, Description, Image, Contents, date FROM dbo.BlogPosts_tbl');
      return result.recordset;
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      throw new Error('Error fetching blog posts');
    } finally {
      sql.close();
  }};

  async function fetchReviewPosts() {
    try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
      .query('SELECT * FROM dbo.Review_tbl');
      return result.recordset;
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      throw new Error('Error fetching blog posts');
    } finally {
      sql.close();
  }};



// Routes
app.get('/', async (req, res) => {
    try {
        const ReviewPost = await fetchReviewPosts();
        recentReview = ReviewPost.slice(0,9)
      const blogPosts = await fetchBlogPosts();
      const recentPosts = blogPosts.slice(0, 4);
      res.render('home', { title: `دکترا و متخصص روانشناسی`, blogs: recentPosts, reviews: recentReview });
  } catch (err) {
      res.status(500).send(err.message);
  } finally {
    sql.close();
  }
  });

app.get('/about', (req, res) => {
    res.render('about'); 
});

app.get('/counselor', (req, res) => {
    res.render('home'); 
});
app.get('/review', (req, res) => {
  res.render('Reviews');
});

app.get('/contact', (req, res) => {
    res.render('home'); 
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
    try {
        const post = await fetchBlogPost(postId);
        if (!post) {
            return res.status(404).send('Blog post not found');
        }
        res.render('blog', { layout: false , title: post.Title, postt: post });
      } catch (err) {
        res.status(500).send('Error retrieving blog post');
    } finally {
      sql.close();
  }
  });
  app.get('/signin', (req, res) => {
    const error = req.query.error;
    res.render('signin', { title: 'Sign In', layout: false, error });
  });

app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up', layout: false });
});

// dashboard routes
app.get('/dashboard', authMiddleware, (req, res) => {
    res.render('dashboard', { title: ` dashboard `, layout: "__dashboard" });
  });

 
  app.get('/dashboard/blogEditor', authMiddleware, async (req, res) => {
    try {
      const blogPosts = await fetchBlogPosts();

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
      const result = await pool.request().query('SELECT * FROM dbo.visist_tbl');
      const visitTime = result.recordset;
      res.render('kanban', { title: 'نوبت دهی', layout: '__dashboard' , kanban: visitTime});
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

      res.render('reviewPublisher', { title: 'نظرات', layout: "__dashboard",  ReviewPost : ReviewPost });
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