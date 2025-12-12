import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { ValidationMessage } from "./ValidationMessage";
import { ContextualHelp } from "./ContextualHelp";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  name,
  error,
  required,
  helpText,
  children,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {helpText && <ContextualHelp content={helpText} />}
      </div>
      
      {children}
      
      {error && <ValidationMessage message={error} type="error" />}
    </div>
  );
};
