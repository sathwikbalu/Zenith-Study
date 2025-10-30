const express = require("express");
const {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
} = require("../controllers/sessionsController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").get(auth, getSessions).post(auth, createSession);

router
  .route("/:id")
  .get(auth, getSessionById)
  .put(auth, updateSession)
  .delete(auth, deleteSession);

router.post("/:id/join", auth, joinSession);
router.post("/:id/leave", auth, leaveSession);

module.exports = router;
