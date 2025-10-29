import { MessageCircleHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const MentalHealthAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-red-500 hover:bg-red-600 hover:scale-110 transition-transform text-white"
        aria-label="Mental Health Assistant"
      >
        <MessageCircleHeart className="h-6 w-6" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Mental Health Assistant</SheetTitle>
            <SheetDescription>
              I'm here to support you with stress management, study-life balance, and wellness tips.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              How can I help you today?
            </p>
            {/* Placeholder for future chat interface */}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
