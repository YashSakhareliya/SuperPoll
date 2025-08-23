import express from 'express';
import { castVote, voteStatus } from '../controllers/index.js';

const router = express.Router();

// Post req
// cast a vote
router.post('/:id', castVote)

// Post req
// check user already voted or not
router.post('/:id/vote-status', voteStatus)

// Get req
// check user already voted or not (for backward compatibility)
router.get('/:id/vote-status', voteStatus)

export default router;
