"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, User, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { InstagramAccount, Conversation, Message } from "@/types";

export default function Inbox() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const accountsData = await apiClient.getInstagramAccounts();
        setAccounts(accountsData);
        
        if (accountsData.length > 0) {
          setSelectedAccount(accountsData[0]);
          await loadConversations(accountsData[0].id);
        }
      } catch (error) {
        console.error("Failed to load accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [router]);

  const loadConversations = async (accountId: number) => {
    try {
      const conversationsData = await apiClient.getConversations(accountId);
      setConversations(conversationsData);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    setLoadingMessages(true);
    setSelectedConversation(conversation);
    try {
      const messagesData = await apiClient.getMessages(conversation.id);
      setMessages(messagesData);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedAccount || !selectedConversation) return;

    setSending(true);
    try {
      await apiClient.sendMessage(
        selectedAccount.id,
        selectedConversation.participant_id || "",
        messageText
      );
      
      setMessageText("");
      // Reload messages
      await loadMessages(selectedConversation);
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Instagram Account Connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your Instagram Business account to view messages
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            Manage your Instagram conversations
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conversation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => loadMessages(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold truncate">
                              @{conversation.participant_username || "Unknown"}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground text-xs">
                            {conversation.last_message_time
                              ? new Date(conversation.last_message_time).toLocaleDateString()
                              : "No messages"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-8">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>
                      @{selectedConversation.participant_username || "Unknown"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.participant_id}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[calc(100vh-400px)]">
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No messages yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.is_from_me ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.is_from_me
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs opacity-70">
                                {message.sent_at
                                  ? new Date(message.sent_at).toLocaleTimeString()
                                  : ""}
                              </p>
                              {message.is_automated && (
                                <span className="text-xs bg-white/20 rounded px-1">
                                  Auto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !messageText.trim()}
                      className="px-6"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full py-12">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
