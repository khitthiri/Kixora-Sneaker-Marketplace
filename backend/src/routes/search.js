const router = require('express').Router();
const { search } = require('../controllers/controllers');
router.get('/', search);
module.exports = router;
