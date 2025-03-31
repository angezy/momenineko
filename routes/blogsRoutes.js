const express = require('express');
const multer = require('multer');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dbConfig = require('../config/dbConfig'); // Database connection utility



// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/uploads'); // Specify the folder for image uploads
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Helper: Delete file
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
    });
};

// Route to add a new blog post
router.post('/add-blog', upload.single('imag'), async (req, res) => {
    const referrer = req.get('Referer');
    const { title, description, contents } = req.body;
    const imageFile = req.file ? `public/images/uploads/${req.file.filename}` : null;
    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input('Title', sql.NVarChar, title)
            .input('Description', sql.NVarChar, description)
            .input('Imag', sql.NVarChar, imageFile)
            .input('Contents', sql.NText, contents)
            .query(`
                INSERT INTO dbo.Blogs_tbl (Title, Description, Imag, Contents, CreatedAt)
                VALUES (@Title, @Description, @Imag, @Contents, GETDATE())
            `); 
return res.redirect(`${referrer}?success=پست+بلاگ+با+موفقیت+افزوده+شد`);
    } catch (err) {
        console.error('خطایی در به روز رسانی پست بلاگ رخ داد:', err);
        return res.redirect(`${referrer}?error=خطایی+در+افزودن+پست+بلاگ`);
    } finally {
        sql.close();
      }
});




// Route to edit a blog post
router.post('/edit-blog/:id', upload.single('imag'), async (req, res) => {
    const { id } = req.params; // Post ID
    const { title, description, contents } = req.body;
    const imageFile = req.file ? `public/images/uploads/${req.file.filename}` : null;
    const referer = req.get('Referer') || '/'; // Default to home page if no referrer
    
    try {
        const pool = await sql.connect(dbConfig);

        // Check if the post exists
        const existingPost = await pool.request()
            .input('PostId', sql.Int, id)
            .query('SELECT Imag FROM dbo.Blogs_tbl WHERE postId = @PostId');

        if (existingPost.recordset.length === 0) {
            return res.redirect(`${referer}?error=پست+بلاگ+یافت+نشد`);
        }

        // Delete old image if a new one is uploaded
        const oldImagePath = existingPost.recordset[0].Imag;
        if (oldImagePath && imageFile) {
            try {
                deleteFile(path.join(__dirname, '..', oldImagePath));
            } catch (err) {
                console.error('(دوباره تلاش کنید)Error deleting old image:', err);
            }
        }

        // Construct the query based on whether a new image is provided
        const query = imageFile
            ? `
                UPDATE dbo.Blogs_tbl
                SET Title = @Title,
                    Description = @Description,
                    Imag = @Imag,
                    Contents = @Contents,
                    CreatedAt = GETDATE()
                WHERE postId = @PostId
            `
            : `
                UPDATE dbo.Blogs_tbl
                SET Title = @Title,
                    Description = @Description,
                    Contents = @Contents,
                    CreatedAt = GETDATE()
                WHERE postId = @PostId
            `;

        // Prepare the SQL request
        const request = pool.request()
            .input('Title', sql.NVarChar, title)
            .input('Description', sql.NVarChar, description)
            .input('Contents', sql.NText, contents)
            .input('PostId', sql.Int, id);

        // Add image if uploaded
        if (imageFile) {
            request.input('Imag', sql.NVarChar, imageFile);
        }

        // Execute the query
        await request.query(query);

        // Redirect back with success message
return res.redirect(`${referer}?success=پست+بلاگ+با+موفقیت+به+روز+رسانی+شد`);
    } catch (err) {
        console.error('خطایی در به روز رسانی پست بلاگ رخ داد:', err);
        return res.redirect(`${referer}?error=خطایی+در+به+روز+رسانی+پست+بلاگ`);
    } finally {
        sql.close();
      }
});

// Route to delete a blog post
router.post('/delete-blog', async (req, res) => {
    const { id } = req.body; // Blog post ID
    const referrer = req.get('Referer') || '/'; // Default to home page if no referrer

    try {
        const pool = await sql.connect(dbConfig);

        // Check if the post exists
        const existingPost = await pool.request()
            .input('PostId', sql.Int, id)
            .query('SELECT Imag FROM dbo.Blogs_tbl WHERE postId = @PostId');

        if (existingPost.recordset.length === 0) {
            return res.redirect(`${referrer}?error=پست+بلاگ+یافت+نشد`);
        }

        // Delete the image file if it exists
        const imagePath = existingPost.recordset[0].Imag;
        if (imagePath) {
            try {
                deleteFile(path.join(__dirname, '..', imagePath));
            } catch (err) {
                console.error('Error deleting image file:', err);
            }
        }

        // Delete the blog post from the database
        await pool.request()
            .input('PostId', sql.Int, id)
            .query('DELETE FROM dbo.Blogs_tbl WHERE postId = @PostId');

        return res.redirect(`${referrer}?success=پست+بلاگ+با+موفقیت+حذف+شد`);
    } catch (err) {
        console.error('خطایی در حذف پست بلاگ رخ داد:', err);
        return res.redirect(`${referrer}?error=خطایی+در+حذف+پست+بلاگ`);
    } finally {
        sql.close();
    }
});

module.exports = router;
