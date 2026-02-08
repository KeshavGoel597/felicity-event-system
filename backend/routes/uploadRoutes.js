const express = require('express');
const router = express.Router();
const { uploadFile, uploadMultipleFiles } = require('../controllers/fileUploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

// Single file upload (for custom form file fields)
router.post('/', protect, upload.single('file'), uploadFile);

// Multiple files upload (if needed)
router.post('/multiple', protect, upload.array('files', 10), uploadMultipleFiles);

module.exports = router;
