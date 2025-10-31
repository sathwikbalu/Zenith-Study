const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  status: {
    type: String,
    enum: ["scheduled", "active", "completed", "cancelled"],
    default: "scheduled",
  },
  maxParticipants: {
    type: Number,
    default: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // This field will be used for TTL index to auto-delete after session ends
  expireAt: {
    type: Date,
    required: true,
  },
});

// Update the updatedAt field before saving
studySessionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Set expireAt to endTime if not already set
  if (!this.expireAt && this.endTime) {
    this.expireAt = this.endTime;
  }

  next();
});

// TTL index to automatically delete sessions after they end
// Documents will be deleted shortly after the expireAt time
studySessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("StudySession", studySessionSchema);
