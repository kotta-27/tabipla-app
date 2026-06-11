"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface CardMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "destructive";
  separator?: boolean;
}

interface Props {
  onClick: () => void;
  menuItems?: CardMenuItem[];
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function TappableCard({ onClick, menuItems, id, className, children }: Props) {
  return (
    <Card
      id={id}
      className={`relative group h-full shadow-sm cursor-pointer active:scale-[0.99] has-[[data-no-scale]:active]:scale-100 transition-all hover:ring-sky-300 dark:hover:ring-sky-600 hover:shadow-md ${className ?? ""}`}
      onClick={onClick}
    >
      {menuItems && menuItems.length > 0 && (
        <div
          data-no-scale
          className="absolute top-2 right-2 hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700" />
            }>
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, i) => (
                <span key={i}>
                  {item.separator && <DropdownMenuSeparator />}
                  <DropdownMenuItem variant={item.variant} onClick={item.onClick}>
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                </span>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {children}
    </Card>
  );
}
