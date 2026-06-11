import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

interface AddButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, "children">,
    VariantProps<typeof buttonVariants> {
  label: string;
}

export function AddButton({ label, ...props }: AddButtonProps) {
  return (
    <Button {...props}>
      <Plus />
      {label}
    </Button>
  );
}
