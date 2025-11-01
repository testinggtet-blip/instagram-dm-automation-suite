"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          await apiClient.getCurrentUser();
          router.push("/dashboard");
        } catch (error) {
          localStorage.removeItem("auth_token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogin = async () => {
    try {
      const { auth_url } = await apiClient.getFacebookLoginUrl();
      window.location.href = auth_url;
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Automate Your Instagram DMs
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Manage and automate Instagram direct messages with powerful automation rules.
            Connect your Instagram Business account and start saving time today.
          </p>
          <Button size="lg" onClick={handleLogin} className="gap-2">
            Login with Facebook
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Message Management</CardTitle>
              <CardDescription>
                View and manage all your Instagram conversations in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Smart Automation</CardTitle>
              <CardDescription>
                Create rules to automatically respond to messages based on keywords
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Save Time</CardTitle>
              <CardDescription>
                Automate repetitive responses and focus on important conversations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Built with Instagram Graph API for secure and reliable messaging
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Account</h3>
                <p className="text-muted-foreground">
                  Login with Facebook and connect your Instagram Business account
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Set Up Automation Rules</h3>
                <p className="text-muted-foreground">
                  Create custom rules to automatically respond to specific keywords or scenarios
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Manage Messages</h3>
                <p className="text-muted-foreground">
                  View all conversations, send manual messages, and let automation handle the rest
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}