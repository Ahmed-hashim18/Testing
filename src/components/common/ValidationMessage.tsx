import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationMessageProps {
  message?: string;
  type?: "error" | "success" | "warning";
  className?: string;
}

export const ValidationMessage = ({
  message,
  type = "error",
  className,
}: ValidationMessageProps) => {
  if (!message) return null;

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  const colorClasses = {
    error: "text-destructive",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className={cn("flex items-start gap-2 text-sm animate-fade-in", colorClasses[type], className)}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
