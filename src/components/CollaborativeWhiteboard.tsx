import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Pencil,
  Square,
  Circle,
  Eraser,
  Trash2,
  Download,
  MousePointer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Socket } from "socket.io-client";

interface CollaborativeWhiteboardProps {
  socket: Socket | null;
  sessionId: string;
  userId: string;
}

type Tool = "select" | "draw" | "rectangle" | "circle" | "eraser";

export const CollaborativeWhiteboard = ({
  socket,
  sessionId,
  userId,
}: CollaborativeWhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#000000");
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 2;

    fabricCanvasRef.current = canvas;

    // Listen for local canvas modifications
    const handleObjectAdded = (e: any) => {
      if (!socket || isDrawingRef.current) return;

      const obj = e.target;
      if (obj) {
        // Add a unique ID to the object for tracking
        if (!obj.id) {
          obj.set({ id: `${userId}-${Date.now()}-${Math.random()}` });
        }

        socket.emit("whiteboard-action", {
          sessionId,
          userId,
          action: "add",
          data: obj.toJSON(),
        });
      }
    };

    const handleObjectModified = (e: any) => {
      if (!socket || isDrawingRef.current) return;

      const obj = e.target;
      if (obj && obj.id) {
        socket.emit("whiteboard-action", {
          sessionId,
          userId,
          action: "modify",
          data: { id: obj.id, ...obj.toJSON() },
        });
      }
    };

    const handlePathCreated = (e: any) => {
      if (!socket) return;

      const path = e.path;
      if (path) {
        // Add a unique ID to the path for tracking
        if (!path.id) {
          path.set({ id: `${userId}-${Date.now()}-${Math.random()}` });
        }

        socket.emit("whiteboard-action", {
          sessionId,
          userId,
          action: "add",
          data: path.toJSON(),
        });
      }
    };

    canvas.on("object:added", handleObjectAdded);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("path:created", handlePathCreated);

    return () => {
      canvas.off("object:added", handleObjectAdded);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("path:created", handlePathCreated);
      canvas.dispose();
    };
  }, [socket, sessionId, userId, color]);

  useEffect(() => {
    if (!socket || !fabricCanvasRef.current) return;

    const handleWhiteboardAction = ({
      userId: senderId,
      action,
      data,
    }: any) => {
      if (senderId === userId || !fabricCanvasRef.current) return;

      const canvas = fabricCanvasRef.current;
      isDrawingRef.current = true;

      try {
        if (action === "add" && data) {
          // Parse JSON and add object
          FabricObject.fromObject(data)
            .then((obj: any) => {
              if (obj && canvas) {
                // Ensure the object has an ID
                if (!obj.id && data.id) {
                  obj.set({ id: data.id });
                }
                canvas.add(obj);
                canvas.renderAll();
              }
            })
            .catch(console.error);
        } else if (action === "modify" && data && data.id) {
          const obj = canvas
            .getObjects()
            .find((o: any) => o.id === data.id) as any;
          if (obj) {
            obj.set(data);
            canvas.renderAll();
          }
        } else if (action === "clear") {
          canvas.clear();
          canvas.backgroundColor = "#ffffff";
          canvas.renderAll();
        }
      } finally {
        setTimeout(() => {
          isDrawingRef.current = false;
        }, 100);
      }
    };

    const handleWhiteboardSync = async (canvasData: any) => {
      if (!fabricCanvasRef.current) return;

      isDrawingRef.current = true;
      const canvas = fabricCanvasRef.current;

      try {
        // Clear existing objects first
        canvas.clear();
        canvas.backgroundColor = "#ffffff";

        // Load objects from the state
        if (canvasData.objects && Array.isArray(canvasData.objects)) {
          for (const objData of canvasData.objects) {
            try {
              const obj = await FabricObject.fromObject(objData);
              if (obj) {
                canvas.add(obj);
              }
            } catch (err) {
              console.error("Error loading object:", err);
            }
          }
        }

        canvas.renderAll();
      } finally {
        setTimeout(() => {
          isDrawingRef.current = false;
        }, 100);
      }
    };

    socket.on("whiteboard-action", handleWhiteboardAction);
    socket.on("whiteboard-sync", handleWhiteboardSync);

    // Request initial canvas state
    socket.emit("whiteboard-request-sync", { sessionId });

    return () => {
      socket.off("whiteboard-action", handleWhiteboardAction);
      socket.off("whiteboard-sync", handleWhiteboardSync);
    };
  }, [socket, sessionId, userId]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";

    if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color =
        activeTool === "eraser" ? "#ffffff" : color;
      canvas.freeDrawingBrush.width = activeTool === "eraser" ? 20 : 2;
    }

    canvas.selection = activeTool === "select";
  }, [activeTool, color]);

  const handleToolClick = async (tool: Tool) => {
    setActiveTool(tool);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (tool === "rectangle") {
      const { Rect } = await import("fabric");
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: color,
        width: 100,
        height: 100,
        id: `${userId}-${Date.now()}-${Math.random()}`, // Add unique ID
      });
      canvas.add(rect);
    } else if (tool === "circle") {
      const { Circle } = await import("fabric");
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: color,
        radius: 50,
        id: `${userId}-${Date.now()}-${Math.random()}`, // Add unique ID
      });
      canvas.add(circle);
    }
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !socket) return;

    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();

    socket.emit("whiteboard-action", {
      sessionId,
      userId,
      action: "clear",
    });
  };

  const handleDownload = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
  ];

  return (
    <Card className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveTool("select")}
            title="Select"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveTool("draw")}
            title="Draw"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "rectangle" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolClick("rectangle")}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "circle" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolClick("circle")}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "eraser" ? "default" : "outline"}
            size="icon"
            onClick={() => setActiveTool("eraser")}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-6 h-6 rounded border-2 transition-all",
                  color === c ? "border-primary scale-110" : "border-muted"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto bg-muted/20">
        <div className="mx-auto max-w-fit border border-border rounded shadow-lg bg-white">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </Card>
  );
};
