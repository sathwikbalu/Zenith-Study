const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      default: "text",
      enum: ["text", "emoji", "system"],
    },
    // This field will be used for TTL index to auto-delete messages
    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by sessionId
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

// TTL index to automatically delete messages after session ends
// Documents will be deleted shortly after the expireAt time
chatMessageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
