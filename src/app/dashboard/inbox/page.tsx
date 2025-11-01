"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Send, Instagram, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface InstagramAccount {
  id: number;
  username?: string;
  profile_picture_url?: string;
}

interface Conversation {
  id: number;
  thread_id: string;
  participant_id: string;
  participant_username?: string;
  participant_profile_pic?: string;
  last_message_time?: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  message_text?: string;
  created_time: string;
  is_from_me?: boolean;
  attachments?: any[];
}

export default function InboxPage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchConversations();
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  const fetchAccounts = async () => {
    try {
      const data = await apiClient.getConnectedAccounts();
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccount(data[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load accounts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    if (!selectedAccount) return;
    setLoadingConversations(true);
    try {
      const data = await apiClient.getConversations(selectedAccount.id);
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load conversations');
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    setLoadingMessages(true);
    try {
      const data = await apiClient.getMessages(selectedConversation.id);
      setMessages(data);
    } catch (error: any) {
      toast.error('Failed to load messages');
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedAccount || !selectedConversation) return;

    setSending(true);
    try {
      await apiClient.sendMessage(selectedAccount.id, {
        recipient_id: selectedConversation.participant_id,
        message_text: messageText,
        conversation_id: selectedConversation.id,
      });
      toast.success('Message sent!');
      setMessageText('');
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (accounts.length === 0) {
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
          <div className="container py-16 text-center">
            <Instagram className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Connected Accounts</h2>
            <p className="text-muted-foreground mb-6">
              Connect an Instagram account to view your inbox
            </p>
            <Button asChild>
              <Link href="/dashboard/connect">Connect Account</Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                @{selectedAccount?.username}
              </span>
              <Button variant="outline" size="sm" onClick={fetchConversations}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="container py-4">
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
            {/* Conversations List */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-14rem)]">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-muted-foreground">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left ${
                            selectedConversation?.id === conv.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Instagram className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              @{conv.participant_username || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {conv.last_message_time
                                ? format(new Date(conv.last_message_time), 'MMM d, h:mm a')
                                : 'No messages'}
                            </p>
                          </div>
                          {conv.unread_count > 0 && (
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {conv.unread_count}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages View */}
            <Card className="col-span-8">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Instagram className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>
                          @{selectedConversation.participant_username || 'User'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {selectedConversation.participant_id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col h-[calc(100vh-18rem)]">
                    <ScrollArea className="flex-1 p-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No messages yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg) => {
                            const isFromMe = msg.sender_id === selectedAccount?.id.toString();
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg p-3 ${
                                    isFromMe
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="break-words">{msg.message_text}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    }`}
                                  >
                                    {msg.created_time
                                      ? format(new Date(msg.created_time), 'h:mm a')
                                      : ''}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type your message..."
                          className="resize-none"
                          rows={2}
                          disabled={sending}
                        />
                        <Button type="submit" disabled={sending || !messageText.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Instagram className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a conversation to view messages
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
