import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface QuickActionsFabProps {
  actions: QuickAction[];
}

export const QuickActionsFab = ({ actions }: QuickActionsFabProps) => {
  const [open, setOpen] = useState(false);

  const handlePick = (action: QuickAction) => {
    setOpen(false);
    // delay to let sheet close cleanly
    setTimeout(() => action.onClick(), 150);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        aria-label="Actions rapides"
        className="sm:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_8px_24px_hsl(72,100%,50%,0.45),0_0_40px_hsl(72,100%,50%,0.25)] ring-2 ring-primary/40 backdrop-blur-xl"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "x" : "plus"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-primary/20 bg-[hsl(220,22%,8%)] pb-[env(safe-area-inset-bottom)] max-h-[80vh]"
        >
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-foreground">Actions rapides</SheetTitle>
            <SheetDescription>Choisissez une action à effectuer</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 pb-4">
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handlePick(action)}
                className="flex flex-col items-center justify-center gap-2 p-4 min-h-[96px] rounded-2xl bg-secondary/40 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground text-center leading-tight">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
