import express from 'express';
import { graphMetaTag, dynamicGraphImage, serveFavicon } from '../controllers/index';

const router = express.Router();


// Get req
// get og meta tag
router.get('/poll/:id', graphMetaTag)

// Get req
// get og image
router.get('/poll/:id.png', dynamicGraphImage)

// Get req
// get favicon
router.get('/favicon.ico', serveFavicon)

export default router;
