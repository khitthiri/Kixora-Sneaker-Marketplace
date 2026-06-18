const router = require('express').Router();
const { getListings, getFeaturedListings, getListing, createListing, updateListing, deleteListing } = require('../controllers/listingController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getListings);
router.get('/featured', getFeaturedListings);
router.get('/:id', optionalAuth, getListing);
router.post('/', requireAuth, createListing);
router.patch('/:id', requireAuth, updateListing);
router.delete('/:id', requireAuth, deleteListing);

module.exports = router;
