const express = require('express');
const router = express.Router();
const persianDate = require('persian-date'); // Ensure this library is installed
const dbConfig = require('../config/dbConfig'); // Database connection utility

// Middleware to parse JSON bodies for PUT requests
router.use(express.json());

// Utility function to convert Persian numerals to English numerals
function convertPersianToEnglishNumbers(input) {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return input.replace(/[۰-۹]/g, (char) => englishNumbers[persianNumbers.indexOf(char)]);
}

// Utility function to convert Persian date to Gregorian date
function convertPersianToGregorianDate(persianDateStr) {
  try {
    const [year, month, day] = persianDateStr.split('-').map((num) => parseInt(num, 10));
    const persianDateObj = new persianDate([year, month, day]);
    const gregorianDateObj = persianDateObj.toCalendar('gregorian');
    return `${gregorianDateObj.year()}-${String(gregorianDateObj.month()).padStart(2, '0')}-${String(gregorianDateObj.date()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting Persian date to Gregorian:', error);
    throw new Error('Invalid Persian date format.');
  }
}

// Route to add a new appointment
router.post('/addappo', async (req, res) => {
  try {
    const { patientName, phone, VisitDate, VTime, status, nationalCode } = req.body; // Added nationalCode

    // Validate required fields
    if (!VisitDate || !VTime || !status) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Convert Persian numbers to English if necessary
    const englishVisitDate = convertPersianToEnglishNumbers(VisitDate);

    // Validate and convert Persian date to Gregorian
    const gregorianVisitDate = convertPersianToGregorianDate(englishVisitDate);


    // Insert into the database
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('PName', sql.NVarChar, patientName)
      .input('PPhone', sql.NVarChar, phone)
      .input('VisitDate', sql.Date, gregorianVisitDate)
      .input('VTime', sql.NVarChar, VTime)
      .input('Status', sql.NVarChar, status)
      .input('NationalCode', sql.NVarChar, nationalCode) // Added nationalCode
      .query(`
        INSERT INTO dbo.Visit_tbl (PName, PPhone, VisitDate, VTime, Status, NationalCode)
        VALUES (@PName, @PPhone, @VisitDate, @VTime, @Status, @NationalCode)
      `);

    res.status(201).json({ message: 'Appointment added successfully.' });
  } catch (error) {
    console.error('Error adding appointment:', error);
    res.status(500).json({ error: 'An error occurred while adding the appointment.' });
  }
});

// Route to edit an existing appointment
router.post('/editappo', async (req, res) => {
  try {
    const { id, patientName, phone, VisitDate, VTime, status, nationalCode } = req.body; // Added nationalCode

    // Validate required fields
    if (!id || !VisitDate || !VTime || !status) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Convert Persian numbers to English if necessary
    const englishVisitDate = convertPersianToEnglishNumbers(VisitDate);

    // Validate and convert Persian date to Gregorian
    const gregorianVisitDate = convertPersianToGregorianDate(englishVisitDate);

    // Update the database
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VisitID', sql.Int, id)
      .input('PName', sql.NVarChar, patientName)
      .input('PPhone', sql.NVarChar, phone)
      .input('VisitDate', sql.Date, gregorianVisitDate)
      .input('VTime', sql.NVarChar, VTime)
      .input('Status', sql.NVarChar, status)
      .input('NationalCode', sql.NVarChar, nationalCode) // Added nationalCode
      .query(`
        UPDATE dbo.Visit_tbl
        SET PName = @PName, PPhone = @PPhone, VisitDate = @VisitDate, VTime = @VTime, Status = @Status, NationalCode = @NationalCode
        WHERE VisitID = @VisitID
      `);

    res.status(200).json({ message: 'Appointment updated successfully.' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'An error occurred while updating the appointment.' });
  }
});

// Route to delete an appointment
router.delete('/deleteappo', async (req, res) => {
  try {
    const { id } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required.' });
    }

    // Delete the appointment from the database
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VisitID', sql.Int, id)
      .query(`
        DELETE FROM dbo.Visit_tbl
        WHERE VisitID = @VisitID
      `);

    res.status(200).json({ message: 'Appointment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'An error occurred while deleting the appointment.' });
  }
});

// Route to fetch available days and times
router.get('/available-days', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    // Fetch distinct days with available slots
    const daysResult = await pool.request().query(`
      SELECT 
        FORMAT(VisitDate, 'yyyy-MM-dd') AS Date,
        DATENAME(dw, VisitDate) AS DayName,
        COUNT(*) AS AvailableSlots
      FROM dbo.Visit_tbl
      WHERE Status = 'available'
      GROUP BY VisitDate
      ORDER BY VisitDate
    `);

    const days = daysResult.recordset.map(day => ({
      Date: day.Date,
      DayName: day.DayName,
      AvailableSlots: day.AvailableSlots
    }));

    res.status(200).json({ days });
  } catch (error) {
    console.error('Error fetching available days:', error);
    res.status(500).json({ error: 'An error occurred while fetching available days.' });
  }
});

router.get('/available-times', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const pool = await sql.connect(dbConfig);

    // Fetch available times for the selected day
    const timesResult = await pool.request()
      .input('VisitDate', sql.Date, date)
      .query(`
        SELECT VTime
        FROM dbo.Visit_tbl
        WHERE VisitDate = @VisitDate AND Status = 'available'
        ORDER BY VTime
      `);

    const times = timesResult.recordset.map(record => record.VTime);

    res.status(200).json({ times });
  } catch (error) {
    console.error('Error fetching available times:', error);
    res.status(500).json({ error: 'An error occurred while fetching available times.' });
  }
});

// Route to add a new appointment
router.post('/online-addappo', async (req, res) => {
  try {
    const { patientName, phone, VisitDate, VTime, status, nationalCode } = req.body; // Added nationalCode

    // Validate required fields
    if (!VisitDate || !VTime || !status) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Convert Persian numbers to English if necessary
    const englishVisitDate = convertPersianToEnglishNumbers(VisitDate);

    // Validate and convert Persian date to Gregorian
    const gregorianVisitDate = convertPersianToGregorianDate(englishVisitDate);


    // Insert into the database
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('PName', sql.NVarChar, patientName)
      .input('PPhone', sql.NVarChar, phone)
      .input('VisitDate', sql.Date, gregorianVisitDate)
      .input('VTime', sql.NVarChar, VTime)
      .input('Status', sql.NVarChar, status)
      .input('NationalCode', sql.NVarChar, nationalCode) // Added nationalCode
      .query(`
        INSERT INTO dbo.online_Visit_tbl (PName, PPhone, VisitDate, VTime, Status, NationalCode)
        VALUES (@PName, @PPhone, @VisitDate, @VTime, @Status, @NationalCode)
      `);

    res.status(201).json({ message: 'Appointment added successfully.' });
  } catch (error) {
    console.error('Error adding appointment:', error);
    res.status(500).json({ error: 'An error occurred while adding the appointment.' });
  }
});

// Route to edit an existing appointment
router.post('/online-editappo', async (req, res) => {
  try {
    const { id, patientName, phone, VisitDate, VTime, status, nationalCode } = req.body; // Added nationalCode

    // Validate required fields
    if (!id || !VisitDate || !VTime || !status) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Convert Persian numbers to English if necessary
    const englishVisitDate = convertPersianToEnglishNumbers(VisitDate);

    // Validate and convert Persian date to Gregorian
    const gregorianVisitDate = convertPersianToGregorianDate(englishVisitDate);

    // Update the database
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VisitID', sql.Int, id)
      .input('PName', sql.NVarChar, patientName)
      .input('PPhone', sql.NVarChar, phone)
      .input('VisitDate', sql.Date, gregorianVisitDate)
      .input('VTime', sql.NVarChar, VTime)
      .input('Status', sql.NVarChar, status)
      .input('NationalCode', sql.NVarChar, nationalCode) // Added nationalCode
      .query(`
        UPDATE dbo.online_Visit_tbl
        SET PName = @PName, PPhone = @PPhone, VisitDate = @VisitDate, VTime = @VTime, Status = @Status, NationalCode = @NationalCode
        WHERE VisitID = @VisitID
      `);

    res.status(200).json({ message: 'Appointment updated successfully.' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'An error occurred while updating the appointment.' });
  }
});

// Route to delete an appointment
router.delete('/online-deleteappo', async (req, res) => {
  try {
    const { id } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required.' });
    }

    // Delete the appointment from the database
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VisitID', sql.Int, id)
      .query(`
        DELETE FROM dbo.online_Visit_tbl
        WHERE VisitID = @VisitID
      `);

    res.status(200).json({ message: 'Appointment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'An error occurred while deleting the appointment.' });
  }
});
module.exports = router;
