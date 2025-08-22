import express from 'express';
import { graphMetaTag, dynamicGraphImage, serveFavicon } from '../controllers/index.js';

const router = express.Router();

// Get req
// get og meta tag
router.get('/poll/:id', graphMetaTag)

// Get req
// get og image - fixed path to match controller expectation
router.get('/poll/:id/image.png', dynamicGraphImage)

// Get req
// get favicon
router.get('/favicon.ico', serveFavicon)

export default router;
