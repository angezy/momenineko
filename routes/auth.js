const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const findUserByEmail = require('../models/User');
const sql = require('mssql');
const dbConfig = require('../config/dbConfig');
require('dotenv').config();

// Ensure session middleware is configured in your main app file
router.post('/signin', async (req, res) => {
    // Log the request body for debugging

    // Ensure req.body is defined
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing' });
    }

    // Retrieve data from req.body
    const { Email, Password, rememberMe } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    const userIP = req.ip; // Retrieve the user's IP address
    const currentDateTime = new Date(); // Current datetime for lastLogin

    try {
        // Find user by email
        const user = await findUserByEmail(Email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Verify the Password
        const isPasswordMatch = await bcrypt.compare(Password, user.Password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid email or password2' });
        }

        // Update lastLogin and lastIP fields in the database
        const pool = await sql.connect(dbConfig); // Adjust as needed for your dbConfig
        await pool
            .request()
            .input('Email', sql.NVarChar, Email)
            .input('lastLogin', sql.DateTime, currentDateTime)
            .input('lastIP', sql.NVarChar(50), userIP)
            .query(
                'UPDATE dbo.user_tbl SET lastLogin = @lastLogin, lastIP = @lastIP WHERE Email = @Email'
            );

        // Create a JWT token
        const tokenOptions = rememberMe ? { expiresIn: '3d' } : { expiresIn: '11h' };
        const token = jwt.sign({ userId: user.userID }, process.env.JWT_SECRET, tokenOptions);

        // Set the token in an HTTP-only cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'Strict',
        });

        res.json({ message: 'Signin successful', token });
    } catch (err) {
        console.error('Error during signin:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/signup', async (req, res) => {
    const { Email, Password, ConfirmPassword } = req.body;

    if (!Email || !Password || !ConfirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (Password !== ConfirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Check if the user already exists
        const existingUser = await findUserByEmail(Email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert the new user into the database
        const pool = await sql.connect(dbConfig);
        await pool
            .request()
            .input('Email', sql.NVarChar, Email)
            .input('Password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO dbo.user_tbl (Email, Password) VALUES (@Email, @Password)');

        res.status(201).json({ message: 'Signup successful' });
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/store-session', (req, res) => {
    const { Email, Password, rememberMe } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    // Store data in the session
    req.session.Email = Email;
    req.session.Password = Password;
    req.session.rememberMe = rememberMe;

    // Log session data for debugging
    console.log('Session data stored:', req.session);

    res.status(200).json({ message: 'Session data stored successfully' });
});

router.post('/signout', (req, res) => {
    try {
        // Clear the authToken cookie
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'Strict',
        });

        res.status(200).json({ message: 'Sign out successful' });
    } catch (err) {
        console.error('Error during sign out:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
