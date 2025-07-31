import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Edit3, Save, X } from "lucide-react";

interface PartnerApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  company_name: string;
  company_website: string;
  application_type: string;
  status: string;
  created_at: string;
  business_description: string;
  license_number: string;
  years_of_experience: number;
}

export default function PartnerApplications() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PartnerApplication>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  const fetchUserApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lender_broker_applications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your applications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (app: PartnerApplication) => {
    setEditingApp(app.id);
    setEditForm({
      applicant_name: app.applicant_name,
      applicant_email: app.applicant_email,
      applicant_phone: app.applicant_phone,
      company_name: app.company_name,
      company_website: app.company_website,
      license_number: app.license_number,
      business_description: app.business_description,
    });
  };

  const cancelEditing = () => {
    setEditingApp(null);
    setEditForm({});
  };

  const saveApplication = async () => {
    if (!editingApp) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('lender_broker_applications')
        .update({
          applicant_name: editForm.applicant_name,
          applicant_email: editForm.applicant_email,
          applicant_phone: editForm.applicant_phone,
          company_name: editForm.company_name,
          company_website: editForm.company_website,
          license_number: editForm.license_number,
          business_description: editForm.business_description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingApp);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application updated successfully."
      });

      setEditingApp(null);
      setEditForm({});
      fetchUserApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Applications</h2>
        <p className="text-muted-foreground">View and edit your broker/lender applications</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No applications found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{app.company_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.status)}
                      <span className="text-sm text-muted-foreground">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {app.status === 'pending' && editingApp !== app.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(app)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingApp === app.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="applicant_name">Full Name</Label>
                        <Input
                          id="applicant_name"
                          value={editForm.applicant_name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, applicant_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="applicant_email">Email</Label>
                        <Input
                          id="applicant_email"
                          type="email"
                          value={editForm.applicant_email || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, applicant_email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="applicant_phone">Phone</Label>
                        <Input
                          id="applicant_phone"
                          value={editForm.applicant_phone || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, applicant_phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={editForm.company_name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_website">Website</Label>
                        <Input
                          id="company_website"
                          value={editForm.company_website || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, company_website: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                          id="license_number"
                          value={editForm.license_number || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, license_number: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="business_description">Business Description</Label>
                      <Textarea
                        id="business_description"
                        value={editForm.business_description || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, business_description: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveApplication} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={cancelEditing}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Contact:</span> {app.applicant_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {app.applicant_email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {app.applicant_phone || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {app.application_type}
                      </div>
                      <div>
                        <span className="font-medium">Website:</span> {app.company_website || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">License:</span> {app.license_number || 'Not provided'}
                      </div>
                    </div>
                    {app.business_description && (
                      <div>
                        <span className="font-medium text-sm">Business Description:</span>
                        <p className="text-sm text-muted-foreground mt-1">{app.business_description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}