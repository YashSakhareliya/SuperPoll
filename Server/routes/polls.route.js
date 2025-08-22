import express from "express";
import { createPoll, getPoll, getPollAdvanceInsights, getPollQr, getPollStats, updatePoll, deletePoll } from "../controllers/index.js";

const router = express.Router();

// Post req
// create new poll - return details about poll with qrcode shareId and wpShereId
router.post('/', createPoll)

// Get req
// get poll details - user open url so hit this route - return details about poll
router.get('/:id', getPoll)

// put req
// update poll settings
router.put('/:id/settings', updatePoll)

// delete req
// delete poll
router.delete('/:id', deletePoll)

// get req
// get poll stats
router.get('/:id/stats', getPollStats)

// get req
// get poll insights
router.get('/:id/insights', getPollAdvanceInsights)

// get req
// get poll qr
router.get('/:id/qr', getPollQr)

export default router;
