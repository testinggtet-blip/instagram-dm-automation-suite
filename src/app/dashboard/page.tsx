"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, MessageSquare, Bot, LogOut, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InstagramAccount {
  id: number;
  instagram_business_account_id: string;
  username?: string;
  profile_picture_url?: string;
  page_id: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [connectedAccounts, setConnectedAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const accounts = await apiClient.getConnectedAccounts();
      setConnectedAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Instagram DM Automation</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="container py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <Instagram className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Instagram Account Connected</h2>
              <p className="text-muted-foreground mb-6">
                Connect your Instagram Business account to start automating your DMs
              </p>
              <Button asChild>
                <Link href="/dashboard/connect">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Instagram Account
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>Select an account to manage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    {connectedAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAccount(account)}
                        className={`flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors ${
                          selectedAccount?.id === account.id ? 'border-primary bg-accent' : ''
                        }`}
                      >
                        {account.profile_picture_url ? (
                          <img
                            src={account.profile_picture_url}
                            alt={account.username}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Instagram className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium">@{account.username}</p>
                          <p className="text-xs text-muted-foreground">ID: {account.id}</p>
                        </div>
                      </button>
                    ))}
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/connect">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/dashboard/inbox')}>
                  <CardHeader>
                    <MessageSquare className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>
                      View and manage your Instagram DMs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">View Inbox</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/dashboard/automation')}>
                  <CardHeader>
                    <Bot className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                      Create and manage automation rules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Manage Rules</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Rules</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Messages Sent</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversations</span>
                      <span className="font-semibold">0</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
