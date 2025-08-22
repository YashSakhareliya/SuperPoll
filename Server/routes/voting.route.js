import express from 'express';
import { castVote, voteStatus } from '../controllers/index';

const router = express.Router();

// Post req
// cast a vote
router.post('/:id', castVote)

// get req
// check user already voted or not
router.get('/:id', voteStatus)

export default router;
