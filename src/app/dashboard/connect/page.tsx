"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Instagram, Check } from 'lucide-react';
import Link from 'next/link';

interface AvailableAccount {
  instagram_business_account_id: string;
  username?: string;
  profile_picture_url?: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
}

export default function ConnectAccountPage() {
  const router = useRouter();
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableAccounts();
  }, []);

  const fetchAvailableAccounts = async () => {
    try {
      const accounts = await apiClient.getAvailableInstagramAccounts();
      setAvailableAccounts(accounts);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load Instagram accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (account: AvailableAccount) => {
    setConnecting(account.instagram_business_account_id);
    try {
      await apiClient.connectInstagramAccount({
        instagram_business_account_id: account.instagram_business_account_id,
        username: account.username,
        profile_picture_url: account.profile_picture_url,
        page_id: account.page_id,
        page_access_token: account.page_access_token,
      });
      toast.success('Instagram account connected successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to connect account:', error);
      toast.error(error.message || 'Failed to connect account');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </header>

        <div className="container py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Connect Instagram Account</h1>
            <p className="text-muted-foreground mb-8">
              Select an Instagram Business account to connect and start automating your DMs
            </p>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : availableAccounts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Instagram className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Instagram Business Accounts Found</h3>
                  <p className="text-muted-foreground mb-6">
                    Make sure you have an Instagram Business account connected to a Facebook Page
                  </p>
                  <Button variant="outline" asChild>
                    <a href="https://www.facebook.com/pages" target="_blank" rel="noopener noreferrer">
                      Manage Facebook Pages
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableAccounts.map((account) => (
                  <Card key={account.instagram_business_account_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {account.profile_picture_url ? (
                            <img
                              src={account.profile_picture_url}
                              alt={account.username}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Instagram className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <CardTitle>@{account.username}</CardTitle>
                            <CardDescription>Connected to {account.page_name}</CardDescription>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleConnect(account)}
                          disabled={connecting === account.instagram_business_account_id}
                        >
                          {connecting === account.instagram_business_account_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
