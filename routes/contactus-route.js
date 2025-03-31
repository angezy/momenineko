const express = require('express');
const router = express.Router();
const { sendEmail } = require('../models/mailer');
const bodyParser = require('body-parser');

// Middleware to parse form data
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Handle POST request for contact form submission
router.post('/contactus', async (req, res) => {
  try {
    console.log('Incoming request body:', req.body); // Debugging log

    const { FullName, Email, subject, message } = req.body;

    // Validate required fields
    if (!FullName || !Email || !subject || !message) {
      console.warn('Validation failed:', { FullName, Email, subject, message }); // Debugging log
      return res.status(400).json({ error: 'همه گزینه ها الزامی است' });
    }

    // Prepare email content
    const recipients = [{ name: 'Recipient', email: process.env.RECIPIENT_EMAIL1 }];
    const emailSubject = `New Contact Form Submission from ${FullName}`;
    const emailText = `Name: ${FullName}\nEmail: ${Email}\nMessage: ${message}`;
    const emailHtml = `
      <p><strong>Name:</strong> ${FullName}</p>
      <p><strong>Email:</strong> ${Email}</p>
      <p><strong>subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
    `;

    // Debugging log for email content
    console.log('Email content:', { recipients, emailSubject, emailText });

    // Send email using the mailer.js module
    await sendEmail(recipients, emailSubject, emailText, emailHtml);

    res.status(200).json({ message: 'پیام شما با موفقیت ارسال شد' });
  } catch (error) {
    console.error('Error sending email:', error); // Debugging log
    res.status(500).json({ error: 'ارسال پیام با مشکل مواجه شد. لطفاً دوباره تلاش کنید.' });
  }
});

module.exports = router;
