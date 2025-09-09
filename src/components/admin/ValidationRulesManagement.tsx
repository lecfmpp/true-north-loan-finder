import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  created_at: string;
}

const RULE_TYPES = [
  { value: 'duplicate_check', label: 'Duplicate Check', description: 'Check for duplicate leads across system' },
  { value: 'email_validation', label: 'Email Validation', description: 'Validate email format and deliverability' },
  { value: 'phone_validation', label: 'Phone Validation', description: 'Validate phone numbers via API' },
  { value: 'custom_logic', label: 'Custom Logic', description: 'Apply custom business rules' },
  { value: 'data_quality', label: 'Data Quality', description: 'Check data completeness and quality' }
];

const ValidationRulesManagement = () => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: '',
    conditions: '{}',
    actions: '{}',
    is_active: true,
    priority: 100
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchValidationRules();
  }, []);

  const fetchValidationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_validation_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      toast({
        title: "Error",
        description: "Failed to load validation rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      let conditions, actions;
      try {
        conditions = JSON.parse(formData.conditions);
        actions = JSON.parse(formData.actions);
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please check your conditions and actions JSON format",
          variant: "destructive"
        });
        return;
      }

      const ruleData = {
        ...formData,
        conditions,
        actions
      };

      if (editingRule) {
        const { error } = await supabase
          .from('lead_validation_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        
        if (error) throw error;
        toast({
          title: "Rule Updated",
          description: "Validation rule has been updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('lead_validation_rules')
          .insert([ruleData]);
        
        if (error) throw error;
        toast({
          title: "Rule Created",
          description: "New validation rule has been created successfully"
        });
      }

      setDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchValidationRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save validation rule",
        variant: "destructive"
      });
    }
  };

  const handleEditRule = (rule: ValidationRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      conditions: JSON.stringify(rule.conditions, null, 2),
      actions: JSON.stringify(rule.actions, null, 2),
      is_active: rule.is_active,
      priority: rule.priority
    });
    setDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this validation rule?')) return;

    try {
      const { error } = await supabase
        .from('lead_validation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      toast({
        title: "Rule Deleted",
        description: "Validation rule has been deleted successfully"
      });
      fetchValidationRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete validation rule",
        variant: "destructive"
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('lead_validation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;
      fetchValidationRules();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_type: '',
      conditions: '{}',
      actions: '{}',
      is_active: true,
      priority: 100
    });
  };

  const getRuleTypeInfo = (type: string) => {
    return RULE_TYPES.find(rt => rt.value === type) || { label: type, description: '' };
  };

  const getDefaultConditions = (ruleType: string) => {
    const defaults: Record<string, any> = {
      duplicate_check: {
        check_fields: ['email', 'phone'],
        within_days: 30,
        ignore_same_source: false
      },
      email_validation: {
        check_format: true,
        check_mx_record: true,
        check_disposable: true,
        api_provider: 'zerobounce'
      },
      phone_validation: {
        check_format: true,
        check_carrier: true,
        api_provider: 'bandwidth'
      },
      custom_logic: {
        field: 'loan_amount',
        operator: 'greater_than',
        value: 20000
      },
      data_quality: {
        required_fields: ['name', 'email', 'phone'],
        min_completeness: 80
      }
    };
    return JSON.stringify(defaults[ruleType] || {}, null, 2);
  };

  const getDefaultActions = (ruleType: string) => {
    const defaults: Record<string, any> = {
      duplicate_check: {
        action: 'reject',
        notify_admin: true,
        merge_data: false
      },
      email_validation: {
        action: 'flag',
        require_manual_review: true
      },
      phone_validation: {
        action: 'flag',
        require_manual_review: true
      },
      custom_logic: {
        action: 'reject',
        reason: 'Does not meet minimum criteria'
      },
      data_quality: {
        action: 'flag',
        require_completion: true
      }
    };
    return JSON.stringify(defaults[ruleType] || {}, null, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validation Rules</h2>
          <p className="text-muted-foreground">
            Configure automated lead validation and quality control rules
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRule(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Validation Rule' : 'Create Validation Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure how leads should be validated before routing
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <Select 
                    value={formData.rule_type} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        rule_type: value,
                        conditions: getDefaultConditions(value),
                        actions: getDefaultActions(value)
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Priority (1-1000)</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="conditions">Conditions (JSON)</Label>
                <Textarea
                  id="conditions"
                  value={formData.conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                  placeholder="Enter validation conditions as JSON"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="actions">Actions (JSON)</Label>
                <Textarea
                  id="actions"
                  value={formData.actions}
                  onChange={(e) => setFormData(prev => ({ ...prev, actions: e.target.value }))}
                  placeholder="Enter actions to take as JSON"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRule}>
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Validation Rules
          </CardTitle>
          <CardDescription>
            Rules are processed in priority order (lower numbers first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const typeInfo = getRuleTypeInfo(rule.rule_type);
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{typeInfo.label}</div>
                        <div className="text-xs text-muted-foreground">{typeInfo.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRuleStatus(rule.id, rule.is_active)}
                        />
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(rule.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No validation rules configured. Create your first rule to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationRulesManagement;