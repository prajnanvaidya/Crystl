// server/middleware/multer.js

const multer = require('multer');

// 1. Store the file in memory as a buffer instead of saving to disk.
// This is essential for serverless environments and for passing the data to the AI APIs.
const storage = multer.memoryStorage();

// 2. Initialize multer with the memory storage and our custom file filter.
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Set a reasonable file size limit (e.g., 10MB)
    
    // 3. This is the gatekeeper function that caused the error.
    // We will now check for 'text/csv' and 'application/pdf'.
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'text/csv' ||
            file.mimetype === 'application/pdf'
        ) {
            // If the file type is correct, allow the upload.
            cb(null, true);
        } else {
            // If the file type is wrong, reject it with a specific error.
            cb(new Error('Unsupported file type. Please upload a CSV or PDF.'), false);
        }
    },
});

module.exports = upload;