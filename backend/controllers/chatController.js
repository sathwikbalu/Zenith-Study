const ChatMessage = require("../models/ChatMessage");

const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100 } = req.query;

    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit));

    // Format the response to match what the frontend expects
    const formattedMessages = messages.map((message) => ({
      id: message._id.toString(),
      sessionId: message.sessionId,
      userId: message.userId,
      userName: message.userName,
      message: message.message,
      messageType: message.messageType,
      timestamp: message.createdAt.toISOString(),
    }));

    res.json(formattedMessages || []);
  } catch (error) {
    console.error("Error in getSessionMessages:", error);
    res.status(500).json({ message: error.message });
  }
};

const saveMessage = async (req, res) => {
  try {
    const { sessionId, message, messageType = "text" } = req.body;
    const userId = req.user._id.toString();
    const userName = req.user.name;

    if (!sessionId || !message) {
      return res
        .status(400)
        .json({ message: "Session ID and message are required" });
    }

    const chatMessage = new ChatMessage({
      sessionId,
      userId,
      userName,
      message,
      messageType,
    });

    const savedMessage = await chatMessage.save();

    // Format the response to match what the frontend expects
    const formattedMessage = {
      id: savedMessage._id.toString(),
      sessionId: savedMessage.sessionId,
      userId: savedMessage.userId,
      userName: savedMessage.userName,
      message: savedMessage.message,
      messageType: savedMessage.messageType,
      timestamp: savedMessage.createdAt.toISOString(),
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error("Error in saveMessage:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSessionMessages,
  saveMessage,
};
