import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";

export const MessageBell = () => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useUnreadMessages();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10 transition-colors duration-300 rounded-lg h-9 w-9"
        >
          <MessageCircle className="w-4 h-4" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-[hsl(220,20%,6%)] border-l border-primary/20"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Messagerie</SheetTitle>
          <SheetDescription>Envoyez et recevez des messages directs</SheetDescription>
        </SheetHeader>
        <DirectMessagePanel isEmbedded onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};
