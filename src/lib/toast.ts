import { toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { createElement } from "react";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      icon: createElement(CheckCircle2, { className: "h-5 w-5" }),
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      icon: createElement(XCircle, { className: "h-5 w-5" }),
      duration: 4000,
    });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      icon: createElement(AlertCircle, { className: "h-5 w-5" }),
      duration: 3500,
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      icon: createElement(Info, { className: "h-5 w-5" }),
      duration: 3000,
    });
  },

  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
      duration: Infinity,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
