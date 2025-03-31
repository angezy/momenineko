const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { engine } = require('express-handlebars');
require('./helpers/handlebars-helpers');
require('dotenv').config();

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
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

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



const authRoutes = require(' ./routes/auth');
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



// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});