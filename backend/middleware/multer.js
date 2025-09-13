const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../public/uploads');  // Specify the folder where you want to store the images
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Adding timestamp to avoid name clashes
    },
});

// Initialize multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },  // Maximum file size of 10MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    },
});

module.exports = upload;