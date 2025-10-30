const express = require("express");
const {
  getSessionMessages,
  saveMessage,
} = require("../controllers/chatController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/session/:sessionId", auth, getSessionMessages);
router.post("/", auth, saveMessage);

module.exports = router;
