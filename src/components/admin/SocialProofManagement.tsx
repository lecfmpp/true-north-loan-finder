import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, GripVertical, Eye } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type SocialProofNotification = Tables<"social_proof_notifications">;

const SocialProofManagement = () => {
  const [notifications, setNotifications] = useState<SocialProofNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotification, setEditingNotification] = useState<SocialProofNotification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewNotification, setPreviewNotification] = useState<SocialProofNotification | null>(null);
  const { toast } = useToast();

  const colorOptions = [
    '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
  ];

  const emojiOptions = ['💰', '🚀', '🔥', '🎯', '✨', '💪', '🍰', '🔧', '🌿', '📦', '🎉', '💵', '👑', '⭐', '🏆'];

  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    amount_funded: 0,
    lender: '',
    background_color: '#10B981',
    emoji: '🎉',
    profile_picture_url: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('social_proof_notifications')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch social proof notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingNotification) {
        const { error } = await supabase
          .from('social_proof_notifications')
          .update(formData)
          .eq('id', editingNotification.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Social proof notification updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('social_proof_notifications')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Social proof notification created successfully"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: "Error",
        description: "Failed to save social proof notification",
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_proof_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Social proof notification deleted successfully"
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete social proof notification",
        variant: "destructive"
      });
    }
  };

  const toggleNotificationStatus = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('social_proof_notifications')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Notification ${is_active ? 'activated' : 'deactivated'} successfully`
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification status:', error);
      toast({
        title: "Error",
        description: "Failed to update notification status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_company: '',
      amount_funded: 0,
      lender: '',
      background_color: '#10B981',
      emoji: '🎉',
      profile_picture_url: '',
      is_active: true,
      display_order: 0
    });
    setEditingNotification(null);
  };

  const openEditDialog = (notification: SocialProofNotification) => {
    setFormData({
      client_name: notification.client_name,
      client_company: notification.client_company,
      amount_funded: notification.amount_funded,
      lender: notification.lender,
      background_color: notification.background_color,
      emoji: notification.emoji,
      profile_picture_url: notification.profile_picture_url || '',
      is_active: notification.is_active,
      display_order: notification.display_order
    });
    setEditingNotification(notification);
    setIsDialogOpen(true);
  };

  const openPreview = (notification: SocialProofNotification) => {
    setPreviewNotification(notification);
    setIsPreviewOpen(true);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Social Proof Notifications</h2>
          <p className="text-muted-foreground">
            Manage the social proof popups that appear on your website
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'Edit Notification' : 'Create New Notification'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client_company">Company Name</Label>
                  <Input
                    id="client_company"
                    value={formData.client_company}
                    onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount_funded">Amount Funded ($)</Label>
                  <Input
                    id="amount_funded"
                    type="number"
                    value={formData.amount_funded}
                    onChange={(e) => setFormData({ ...formData, amount_funded: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lender">Lender Name</Label>
                  <Input
                    id="lender"
                    value={formData.lender}
                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
                <Input
                  id="profile_picture_url"
                  value={formData.profile_picture_url}
                  onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
                  placeholder="https://example.com/profile.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${formData.background_color === color ? 'border-primary' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, background_color: color })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Emoji</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`w-8 h-8 text-lg rounded border-2 ${formData.emoji === emoji ? 'border-primary' : 'border-gray-300'}`}
                        onClick={() => setFormData({ ...formData, emoji })}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNotification ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">#{notification.display_order}</span>
                </div>
                
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: notification.background_color }}
                >
                  {notification.emoji}
                </div>

                {notification.profile_picture_url && (
                  <img 
                    src={notification.profile_picture_url} 
                    alt={notification.client_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}

                <div>
                  <div className="font-medium">
                    {notification.client_name} from {notification.client_company}
                  </div>
                  <div className="text-sm text-gray-600">
                    just got {formatAmount(notification.amount_funded)} with {notification.lender}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant={notification.is_active ? "default" : "secondary"}>
                  {notification.is_active ? "Active" : "Inactive"}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPreview(notification)}
                >
                  <Eye className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(notification)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Switch
                  checked={notification.is_active}
                  onCheckedChange={(checked) => toggleNotificationStatus(notification.id, checked)}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {notifications.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No social proof notifications yet. Create your first one!</p>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewNotification && (
            <div 
              className="rounded-lg p-4 text-white shadow-lg"
              style={{ backgroundColor: previewNotification.background_color }}
            >
              <div className="flex items-center space-x-3">
                {previewNotification.profile_picture_url ? (
                  <img 
                    src={previewNotification.profile_picture_url} 
                    alt={previewNotification.client_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    {previewNotification.emoji}
                  </div>
                )}
                
                <div>
                  <div className="font-medium">
                    {previewNotification.client_name} from {previewNotification.client_company}
                  </div>
                  <div className="text-sm opacity-90">
                    just got {formatAmount(previewNotification.amount_funded)} with {previewNotification.lender} {previewNotification.emoji}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialProofManagement;