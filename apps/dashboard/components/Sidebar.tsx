"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, FileText, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Analytics",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Logs",
    href: "/logs",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("dashboard_authenticated");
    router.push("/");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b px-6 justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">Convex Logging</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("h-8 w-8", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className={cn(
            "w-full",
            isCollapsed && "px-0"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}
