const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../config/multer');
const { uploadImage } = require('../controllers/controllers');
router.post('/image', requireAuth, upload.single('file'), uploadImage);
module.exports = router;
