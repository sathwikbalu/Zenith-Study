const express = require("express");
const {
  getActivities,
  addActivity,
  getStreaks,
} = require("../controllers/activityController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").get(auth, getActivities).post(auth, addActivity);

router.get("/streaks", auth, getStreaks);

module.exports = router;
