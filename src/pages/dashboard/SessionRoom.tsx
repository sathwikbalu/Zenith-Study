import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  MessageCircle,
  Users,
  X,
  Presentation,
} from "lucide-react";
import { CollaborativeWhiteboard } from "@/components/CollaborativeWhiteboard";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  messageType: string;
  timestamp: string;
}

interface FetchedMessage {
  id?: string;
  _id?: string;
  sessionId?: string;
  session_id?: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  message: string;
  messageType?: string;
  message_type?: string;
  timestamp?: string;
  created_at?: string;
}

const SessionRoom = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTutor = user?.role === "tutor";

  const {
    localStream,
    peers,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
  } = useWebRTC(
    socket,
    sessionId || "",
    user?._id || "",
    user?.name || "",
    isTutor
  );

  useEffect(() => {
    if (!socket || !sessionId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/chat/session/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        if (response.ok) {
          const data: FetchedMessage[] = await response.json();
          // Ensure messages have unique keys and are properly formatted
          const formattedMessages = data.map((msg) => ({
            id: msg.id || msg._id || Date.now().toString() + Math.random(),
            sessionId: msg.sessionId || msg.session_id || sessionId || "",
            userId: msg.userId || msg.user_id || "",
            userName: msg.userName || msg.user_name || "Unknown",
            message: msg.message,
            messageType: msg.messageType || msg.message_type || "text",
            timestamp:
              msg.timestamp || msg.created_at || new Date().toISOString(),
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const handleChatMessage = (message: ChatMessage) => {
      // Ensure the message has a unique id
      const messageWithId = {
        ...message,
        id: message.id || Date.now().toString() + Math.random(),
      };
      setMessages((prev) => [...prev, messageWithId]);
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket, sessionId, user?.token]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !sessionId) return;

    const messageData = {
      sessionId,
      message: newMessage,
      userId: user?._id,
      userName: user?.name,
      messageType: "text",
    };

    // Emit the message to all participants
    socket.emit("chat-message", messageData);

    try {
      // Save the message to the database
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          sessionId,
          message: newMessage,
          messageType: "text",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save message");
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }

    setNewMessage("");
  };

  const leaveSession = () => {
    if (socket && sessionId) {
      socket.emit("leave-session", { sessionId });
    }
    navigate("/dashboard/sessions");
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Connecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {showWhiteboard ? (
          <div className="flex-1 p-4">
            <CollaborativeWhiteboard 
              socket={socket} 
              sessionId={sessionId || ""} 
              userId={user?._id || ""} 
            />
          </div>
        ) : (
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max overflow-y-auto">
          <Card className="aspect-video bg-black relative overflow-hidden">
            {localStream ? (
              <video
                ref={(video) => {
                  if (video && localStream) {
                    video.srcObject = localStream;
                    video.play().catch(console.error);
                  }
                }}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
              You {!videoEnabled && "(video off)"}
            </div>
            {(!videoEnabled || !localStream) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {Array.from(peers.values()).map((peer) => (
            <Card
              key={peer.socketId}
              className="aspect-video bg-black relative overflow-hidden"
            >
              {peer.stream && peer.videoEnabled !== false ? (
                <video
                  ref={(video) => {
                    if (video && peer.stream) {
                      video.srcObject = peer.stream;
                      video.play().catch(console.error);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {peer.userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
                {peer.userName} {peer.isTutor ? "(Tutor)" : ""}
                {peer.audioEnabled === false && <MicOff className="w-3 h-3" />}
              </div>
            </Card>
          ))}
          </div>
        )}

        {showChat && !showWhiteboard && (
          <Card className="w-80 m-4 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Chat</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.userId === user?._id ? "items-end" : "items-start"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">
                      {msg.userName}
                    </span>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg max-w-[80%]",
                        msg.userId === user?._id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={sendMessage} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="border-t p-4 bg-card">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={audioEnabled ? "default" : "destructive"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleAudio}
          >
            {audioEnabled ? <Mic /> : <MicOff />}
          </Button>
          <Button
            variant={videoEnabled ? "default" : "destructive"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleVideo}
          >
            {videoEnabled ? <Video /> : <VideoOff />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={leaveSession}
          >
            <PhoneOff />
          </Button>
          {!showChat && (
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users />
          </Button>
          <Button
            variant={showWhiteboard ? "default" : "outline"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={() => setShowWhiteboard(!showWhiteboard)}
          >
            <Presentation />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionRoom;
