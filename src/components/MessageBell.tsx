import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
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
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer"
        >
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[hsl(120,60%,25%)] via-[hsl(90,70%,35%)] to-[hsl(72,100%,50%)] p-[1px] shadow-[0_0_10px_hsl(72,100%,50%,0.2)] group-hover:shadow-[0_0_18px_hsl(72,100%,50%,0.4)] transition-shadow duration-500">
            <div className="h-full w-full rounded-[7px] bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary group-hover:text-[hsl(72,100%,50%)] transition-colors duration-300" />
            </div>
          </div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-br from-primary to-[hsl(72,100%,50%)] text-primary-foreground text-[10px] font-bold rounded-full px-1 shadow-[0_0_10px_hsl(var(--primary)/0.5)] ring-2 ring-background"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
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
