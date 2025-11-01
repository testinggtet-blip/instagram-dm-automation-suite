"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Settings, BarChart3, LogOut, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { User } from "@/types";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("auth_token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      localStorage.removeItem("auth_token");
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/inbox", label: "Inbox", icon: MessageSquare },
    { href: "/automation", label: "Automation", icon: Settings },
  ];

  return (
    <nav className="border-b bg-white dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Instagram className="h-6 w-6" />
              <span className="text-xl font-semibold">IG DM Automation</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button>Login with Facebook</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
