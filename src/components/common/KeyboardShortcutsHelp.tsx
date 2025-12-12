import { HelpCircle, Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface KeyboardShortcut {
  key: string;
  description: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

const shortcuts: KeyboardShortcut[] = [
  { key: "N", ctrl: true, description: "Create new item" },
  { key: "S", ctrl: true, description: "Save current form" },
  { key: "F", ctrl: true, description: "Focus search" },
  { key: "K", ctrl: true, description: "Open command palette" },
  { key: "A", ctrl: true, description: "Select all items" },
  { key: "E", ctrl: true, description: "Export data" },
  { key: "?", ctrl: false, shift: true, description: "Show keyboard shortcuts" },
  { key: "Escape", description: "Close dialog/modal" },
];

const KeyBadge = ({ children }: { children: React.ReactNode }) => (
  <Badge variant="secondary" className="font-mono text-xs px-2 py-1">
    {children}
  </Badge>
);

export const KeyboardShortcutsHelp = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover-scale">
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.ctrl && <KeyBadge>Ctrl</KeyBadge>}
                {shortcut.shift && <KeyBadge>Shift</KeyBadge>}
                {shortcut.alt && <KeyBadge>Alt</KeyBadge>}
                <KeyBadge>{shortcut.key}</KeyBadge>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
