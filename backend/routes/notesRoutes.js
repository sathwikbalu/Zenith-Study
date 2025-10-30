const express = require("express");
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  toggleStarNote,
} = require("../controllers/notesController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").get(auth, getNotes).post(auth, createNote);

router
  .route("/:id")
  .get(auth, getNoteById)
  .put(auth, updateNote)
  .delete(auth, deleteNote);

router.put("/:id/star", auth, toggleStarNote);

module.exports = router;
