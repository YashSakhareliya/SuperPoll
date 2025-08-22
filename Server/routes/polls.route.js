import express from "express";
import { createPoll } from "../controllers/index.js";

const router = express.Router();

// Post req
// create new poll - return details about poll with qrcode shareId and wpShereId
router.post('/', createPoll)

// Get req
// get poll details - user open url so hit this route - return details about poll
router.get('/:id', getPoll)

// Get req
// get new qe for poll

export default router;
