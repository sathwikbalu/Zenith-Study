const express = require("express");
const {
  generateAssessment,
  getAssessmentBySession,
  submitAssessment,
  getSubmissionsBySession,
  getUserSubmission,
  getUserSubmissions,
} = require("../controllers/assessmentController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/generate/:sessionId", auth, generateAssessment);
router.get("/session/:sessionId", auth, getAssessmentBySession);
router.post("/submit", auth, submitAssessment);
router.get("/submissions/:sessionId", auth, getSubmissionsBySession);
router.get("/submission/:assessmentId", auth, getUserSubmission);
router.get("/user/submissions", auth, getUserSubmissions);

module.exports = router;
