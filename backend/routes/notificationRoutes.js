const express = require("express");
const {
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/unread-count").get(auth, getUnreadCount);
router.route("/").get(auth, getNotifications);
router.route("/:id/read").put(auth, markAsRead);
router.route("/read-all").put(auth, markAllAsRead);

module.exports = router;