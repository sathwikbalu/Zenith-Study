const express = require("express");
const {
  getLearningPaths,
  getLearningPathById,
  createLearningPath,
  deleteLearningPath,
} = require("../controllers/learningPathController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").get(auth, getLearningPaths).post(auth, createLearningPath);
router.route("/:id").get(auth, getLearningPathById).delete(auth, deleteLearningPath);

module.exports = router;