const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of userId and date
activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Activity", activitySchema);
