const express = require("express");
const {
  createForum,
  getForums,
  joinForum,
  getForumMessages,
  sendForumMessage,
  getUnreadCount,
} = require("../controllers/forumController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").post(auth, createForum).get(auth, getForums);
router.route("/:id/join").post(auth, joinForum);
router.route("/:id/messages").get(auth, getForumMessages).post(auth, sendForumMessage);
router.route("/:id/unread/:userId").get(auth, getUnreadCount);

module.exports = router;