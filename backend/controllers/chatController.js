const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100 } = req.query;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Error fetching messages" });
    }

    res.json(data || []);
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
      return res.status(400).json({ message: "Session ID and message are required" });
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
          message,
          message_type: messageType,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Error saving message" });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Error in saveMessage:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSessionMessages,
  saveMessage,
};
