import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  successMessage?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  fullWidth?: boolean;
}

export function CopyButton({
  textToCopy,
  label = "Copy",
  successMessage = "Copied to clipboard",
  variant = "outline",
  size = "sm",
  className = "",
  fullWidth = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`${fullWidth ? "w-full" : ""} ${className}`}
      aria-label={label}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 mr-1.5" />
      )}
      {label}
    </Button>
  );
}
