const express = require("express");
const {
  generateAssessment,
  getAssessmentBySession,
  submitAssessment,
  getSubmissionsBySession,
  getUserSubmission,
} = require("../controllers/assessmentController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/generate/:sessionId", auth, generateAssessment);
router.get("/session/:sessionId", auth, getAssessmentBySession);
router.post("/submit", auth, submitAssessment);
router.get("/submissions/:sessionId", auth, getSubmissionsBySession);
router.get("/submission/:assessmentId", auth, getUserSubmission);

module.exports = router;
