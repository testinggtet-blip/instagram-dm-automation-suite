"use client";

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit, Bot, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface InstagramAccount {
  id: number;
  username?: string;
}

interface AutomationRule {
  id: number;
  name: string;
  description?: string;
  trigger_type: 'keyword' | 'new_message' | 'scheduled' | 'welcome';
  trigger_keywords?: string[];
  reply_message: string;
  reply_delay_seconds: number;
  status: 'active' | 'inactive' | 'paused';
  priority: number;
  triggered_count: number;
  success_count: number;
  failure_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export default function AutomationPage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'keyword' as const,
    trigger_keywords: '',
    reply_message: '',
    reply_delay_seconds: 0,
    priority: 0,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchRules();
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const data = await apiClient.getConnectedAccounts();
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccount(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load accounts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    if (!selectedAccount) return;
    try {
      const data = await apiClient.getAutomationRules(selectedAccount.id);
      setRules(data);
    } catch (error) {
      toast.error('Failed to load automation rules');
      console.error(error);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      await apiClient.createAutomationRule(selectedAccount.id, {
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        trigger_keywords: formData.trigger_keywords
          ? formData.trigger_keywords.split(',').map((k) => k.trim())
          : [],
        reply_message: formData.reply_message,
        reply_delay_seconds: formData.reply_delay_seconds,
        priority: formData.priority,
      });
      toast.success('Automation rule created!');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create rule');
      console.error(error);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      await apiClient.updateAutomationRule(editingRule.id, {
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        trigger_keywords: formData.trigger_keywords
          ? formData.trigger_keywords.split(',').map((k) => k.trim())
          : [],
        reply_message: formData.reply_message,
        reply_delay_seconds: formData.reply_delay_seconds,
        priority: formData.priority,
      });
      toast.success('Rule updated!');
      setIsEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update rule');
      console.error(error);
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    try {
      await apiClient.toggleAutomationRule(ruleId);
      toast.success('Rule status updated');
      fetchRules();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle rule');
      console.error(error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    try {
      await apiClient.deleteAutomationRule(ruleId);
      toast.success('Rule deleted');
      fetchRules();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete rule');
      console.error(error);
    }
  };

  const handleEditClick = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger_type: rule.trigger_type,
      trigger_keywords: rule.trigger_keywords?.join(', ') || '',
      reply_message: rule.reply_message,
      reply_delay_seconds: rule.reply_delay_seconds,
      priority: rule.priority,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'keyword',
      trigger_keywords: '',
      reply_message: '',
      reply_delay_seconds: 0,
      priority: 0,
    });
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      keyword: 'Keyword',
      new_message: 'New Message',
      scheduled: 'Scheduled',
      welcome: 'Welcome Message',
    };
    return labels[type] || type;
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
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Connected Accounts</h2>
            <p className="text-muted-foreground mb-6">
              Connect an Instagram account to create automation rules
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
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Automation Rule</DialogTitle>
                    <DialogDescription>
                      Set up a new automation rule for your Instagram DMs
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRule} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Rule Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Welcome Message"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trigger_type">Trigger Type *</Label>
                      <Select
                        value={formData.trigger_type}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, trigger_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">Keyword Trigger</SelectItem>
                          <SelectItem value="new_message">Any New Message</SelectItem>
                          <SelectItem value="welcome">Welcome Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.trigger_type === 'keyword' && (
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma-separated) *</Label>
                        <Input
                          id="keywords"
                          value={formData.trigger_keywords}
                          onChange={(e) =>
                            setFormData({ ...formData, trigger_keywords: e.target.value })
                          }
                          placeholder="hello, hi, help"
                          required={formData.trigger_type === 'keyword'}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter keywords separated by commas
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="reply_message">Auto Reply Message *</Label>
                      <Textarea
                        id="reply_message"
                        value={formData.reply_message}
                        onChange={(e) =>
                          setFormData({ ...formData, reply_message: e.target.value })
                        }
                        placeholder="Thank you for your message! We'll get back to you soon."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delay">Delay (seconds)</Label>
                        <Input
                          id="delay"
                          type="number"
                          min="0"
                          value={formData.reply_delay_seconds}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reply_delay_seconds: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Input
                          id="priority"
                          type="number"
                          min="0"
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priority: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">Higher = checked first</p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Rule</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="container py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Automation Rules</h1>
            <p className="text-muted-foreground">
              Create and manage automation rules for your Instagram DMs
            </p>
          </div>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Automation Rules Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first automation rule to start automating your Instagram DMs
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{rule.name}</CardTitle>
                          <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                            {rule.status}
                          </Badge>
                          <Badge variant="outline">{getTriggerTypeLabel(rule.trigger_type)}</Badge>
                        </div>
                        {rule.description && (
                          <CardDescription>{rule.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {rule.trigger_keywords && rule.trigger_keywords.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {rule.trigger_keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium mb-1">Auto Reply:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {rule.reply_message}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Triggered:</span>
                          <span className="font-semibold">{rule.triggered_count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Success:</span>
                          <span className="font-semibold text-green-600">
                            {rule.success_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Failed:</span>
                          <span className="font-semibold text-red-600">
                            {rule.failure_count}
                          </span>
                        </div>
                        {rule.last_triggered_at && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Last triggered:</span>
                            <span className="font-semibold">
                              {format(new Date(rule.last_triggered_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Automation Rule</DialogTitle>
              <DialogDescription>Update your automation rule settings</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateRule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Rule Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-trigger_type">Trigger Type *</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value: any) => setFormData({ ...formData, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword Trigger</SelectItem>
                    <SelectItem value="new_message">Any New Message</SelectItem>
                    <SelectItem value="welcome">Welcome Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger_type === 'keyword' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-keywords">Keywords (comma-separated) *</Label>
                  <Input
                    id="edit-keywords"
                    value={formData.trigger_keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, trigger_keywords: e.target.value })
                    }
                    required={formData.trigger_type === 'keyword'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-reply_message">Auto Reply Message *</Label>
                <Textarea
                  id="edit-reply_message"
                  value={formData.reply_message}
                  onChange={(e) => setFormData({ ...formData, reply_message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-delay">Delay (seconds)</Label>
                  <Input
                    id="edit-delay"
                    type="number"
                    min="0"
                    value={formData.reply_delay_seconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reply_delay_seconds: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Rule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
