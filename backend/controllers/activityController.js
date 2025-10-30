const Activity = require("../models/Activity");

// @desc    Get user activities
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id }).sort({
      date: -1,
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add activity for user
// @route   POST /api/activities
// @access  Private
const addActivity = async (req, res) => {
  try {
    const { date } = req.body;

    // Use today's date if not provided
    const activityDate = date ? new Date(date) : new Date();
    // Set time to midnight for consistent date comparison
    activityDate.setHours(0, 0, 0, 0);

    // Check if activity already exists for this date
    let activity = await Activity.findOne({
      userId: req.user._id,
      date: activityDate,
    });

    if (activity) {
      // Increment count if activity exists
      activity.count += 1;
    } else {
      // Create new activity
      activity = new Activity({
        userId: req.user._id,
        date: activityDate,
        count: 1,
      });
    }

    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user streaks
// @route   GET /api/activities/streaks
// @access  Private
const getStreaks = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id }).sort({
      date: -1,
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < activities.length; i++) {
      const activityDate = new Date(activities[i].date);
      activityDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    // Sort activities by date ascending for streak calculation
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    for (let i = 0; i < sortedActivities.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = Math.floor(
          (new Date(sortedActivities[i].date).getTime() -
            new Date(sortedActivities[i - 1].date).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      currentStreak,
      longestStreak,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActivities,
  addActivity,
  getStreaks,
};
