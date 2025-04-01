const express = require('express');
const sql = require('mssql');
const authMiddleware = require('../middleware/authMiddleware');
const dbConfig = require('../config/dbConfig');

const router = express.Router();

module.exports = router;
