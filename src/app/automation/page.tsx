"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus, Trash2, Loader2, Edit, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { InstagramAccount, AutomationRule, TriggerType } from "@/types";

export default function Automation() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    instagram_account_id: "",
    name: "",
    description: "",
    trigger_type: "keyword" as TriggerType,
    trigger_keywords: "",
    reply_message: "",
    reply_delay_seconds: 0,
    priority: 0,
  });

  useEffect(() => {
    loadData();
  }, [router]);

  const loadData = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const [accountsData, rulesData] = await Promise.all([
        apiClient.getInstagramAccounts(),
        apiClient.getAutomationRules(),
      ]);

      setAccounts(accountsData);
      setRules(rulesData);
      
      if (accountsData.length > 0 && !formData.instagram_account_id) {
        setFormData(prev => ({
          ...prev,
          instagram_account_id: accountsData[0].id.toString()
        }));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const payload = {
        instagram_account_id: parseInt(formData.instagram_account_id),
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        trigger_keywords: formData.trigger_keywords.split(",").map(k => k.trim()).filter(k => k),
        reply_message: formData.reply_message,
        reply_delay_seconds: formData.reply_delay_seconds,
        priority: formData.priority,
      };

      if (editingRule) {
        await apiClient.updateAutomationRule(editingRule.id, payload);
      } else {
        await apiClient.createAutomationRule(payload);
      }

      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to save rule");
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await apiClient.deleteAutomationRule(ruleId);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to delete rule");
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    try {
      await apiClient.toggleAutomationRule(ruleId);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to toggle rule");
    }
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      instagram_account_id: rule.instagram_account_id.toString(),
      name: rule.name,
      description: rule.description || "",
      trigger_type: rule.trigger_type,
      trigger_keywords: rule.trigger_keywords?.join(", ") || "",
      reply_message: rule.reply_message,
      reply_delay_seconds: rule.reply_delay_seconds,
      priority: rule.priority,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRule(null);
    setFormData({
      instagram_account_id: accounts.length > 0 ? accounts[0].id.toString() : "",
      name: "",
      description: "",
      trigger_type: "keyword",
      trigger_keywords: "",
      reply_message: "",
      reply_delay_seconds: 0,
      priority: 0,
    });
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
            <Zap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Instagram Account Connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your Instagram Business account to create automation rules
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Automation Rules</h1>
            <p className="text-muted-foreground">
              Create and manage automation rules for your Instagram DMs
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Rule" : "Create New Automation Rule"}</DialogTitle>
              <DialogDescription>
                Set up rules to automatically respond to messages
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Instagram Account</Label>
                <Select
                  value={formData.instagram_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, instagram_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        @{account.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  placeholder="e.g., Welcome Message"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Brief description of this rule"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trigger_type: value as TriggerType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword Match</SelectItem>
                    <SelectItem value="new_message">Any New Message</SelectItem>
                    <SelectItem value="welcome">Welcome Message (First Contact)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger_type === "keyword" && (
                <div className="space-y-2">
                  <Label>Keywords (comma-separated)</Label>
                  <Input
                    placeholder="e.g., hello, hi, help"
                    value={formData.trigger_keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, trigger_keywords: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Messages containing any of these keywords will trigger this rule
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Reply Message</Label>
                <Textarea
                  placeholder="Enter your automated reply message..."
                  value={formData.reply_message}
                  onChange={(e) =>
                    setFormData({ ...formData, reply_message: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reply Delay (seconds)</Label>
                  <Input
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
                  <Label>Priority</Label>
                  <Input
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
                  <p className="text-xs text-muted-foreground">
                    Higher priority rules are checked first
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Automation Rules Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first automation rule to start automating responses
              </p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => {
            const account = accounts.find(a => a.id === rule.instagram_account_id);
            
            return (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle>{rule.name}</CardTitle>
                        <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                          {rule.status}
                        </Badge>
                        <Badge variant="outline">{rule.trigger_type}</Badge>
                      </div>
                      {rule.description && (
                        <CardDescription>{rule.description}</CardDescription>
                      )}
                      <div className="text-sm text-muted-foreground mt-2">
                        Account: @{account?.username || "Unknown"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.status === "active"}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rule.trigger_keywords && rule.trigger_keywords.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Keywords:</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.trigger_keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-1">Reply Message:</p>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {rule.reply_message}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Triggered</p>
                        <p className="font-semibold">{rule.triggered_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success</p>
                        <p className="font-semibold text-green-600">{rule.success_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Priority</p>
                        <p className="font-semibold">{rule.priority}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Delay</p>
                        <p className="font-semibold">{rule.reply_delay_seconds}s</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
