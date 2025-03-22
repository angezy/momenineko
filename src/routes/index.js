const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');

// Define your routes here
router.get('/', controller.home);
router.get('/about', controller.about);
router.get('/contact', controller.contact);

module.exports = router;