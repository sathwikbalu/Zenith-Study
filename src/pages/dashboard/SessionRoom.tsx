import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Users,
  Presentation,
  Monitor,
  MonitorOff,
  Send,
  MessageCircle,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { CollaborativeWhiteboard } from "@/components/CollaborativeWhiteboard";
import { LocalVideo } from "@/components/LocalVideo";
import { RemoteVideo } from "@/components/RemoteVideo";
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
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [completing, setCompleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTutor = user?.role === "tutor";

  const {
    localStream,
    screenStream,
    peers,
    audioEnabled,
    videoEnabled,
    screenSharingEnabled,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC(
    socket,
    sessionId || "",
    user?._id || "",
    user?.name || "",
    isTutor
  );

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Auto-join session when entering the room
    const autoJoinSession = async () => {
      try {
        console.log(`Auto-joining session ${sessionId} for user ${user?._id}`);
        const response = await fetch(
          `http://localhost:5000/api/sessions/${sessionId}/join`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Successfully joined session as participant", data);
        } else if (response.status === 400) {
          // Already joined, that's fine
          console.log("Already a participant in this session");
        } else {
          console.error("Failed to join session:", await response.text());
        }
      } catch (error) {
        console.error("Error auto-joining session:", error);
      }
    };

    autoJoinSession();

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

  const completeSession = async () => {
    if (!sessionId) return;

    try {
      setCompleting(true);
      console.log("Completing session:", sessionId);

      const response = await fetch(
        `http://localhost:5000/api/sessions/${sessionId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Complete session response:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.message || "Failed to complete session"
        );
      }

      toast({
        title: "Session Completed! 🎉",
        description: `AI-generated notes have been added to ${data.notesCount} participants' accounts. Check your Notes section!`,
        duration: 5000,
      });

      // Leave the session after showing success message
      setTimeout(() => {
        leaveSession();
      }, 3000);
    } catch (error) {
      console.error("Error completing session:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to complete session. Make sure AI backend is running on port 5001.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setCompleting(false);
    }
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
            {/* Only show local video if user is tutor */}
            {isTutor && (
              <Card className="aspect-video bg-black relative overflow-hidden">
                {(screenSharingEnabled ? screenStream : localStream) && (screenSharingEnabled || videoEnabled) ? (
                  <LocalVideo
                    stream={screenSharingEnabled ? screenStream! : localStream!}
                    videoEnabled={screenSharingEnabled || videoEnabled}
                    userName={screenSharingEnabled ? `${user?.name || "You"} (Screen)` : user?.name || "You"}
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
                  You (Tutor) {screenSharingEnabled ? "(sharing screen)" : !videoEnabled && "(video off)"}
                </div>
              </Card>
            )}

            {/* Students see message if no tutor has joined yet */}
            {!isTutor && peers.size === 0 && (
              <div className="col-span-full flex items-center justify-center p-12">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    Waiting for tutor...
                  </h3>
                  <p className="text-muted-foreground">
                    The session will start when the tutor joins.
                  </p>
                </div>
              </div>
            )}

            {/* Show remote peers (students see tutor, tutor sees all students) */}
            {Array.from(peers.values()).map((peer) => (
              <Card
                key={peer.socketId}
                className="aspect-video bg-black relative overflow-hidden"
              >
                {peer.stream ? (
                  <RemoteVideo stream={peer.stream} userName={peer.userName} />
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
                  {peer.audioEnabled === false && (
                    <MicOff className="w-3 h-3" />
                  )}
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
          {/* Only tutors can control audio/video */}
          {isTutor && (
            <>
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
                variant={screenSharingEnabled ? "default" : "outline"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleScreenShare}
                title="Share Screen"
              >
                {screenSharingEnabled ? <Monitor /> : <MonitorOff />}
              </Button>
            </>
          )}

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
          {isTutor && (
            <>
              <Button
                variant={showWhiteboard ? "default" : "outline"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setShowWhiteboard(!showWhiteboard)}
              >
                <Presentation />
              </Button>
              <Button
                variant="default"
                onClick={completeSession}
                disabled={completing}
                className="gap-2"
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Session
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionRoom;
