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
import { Plus, Edit, Trash2, Route, Users, Shuffle, Zap } from 'lucide-react';

interface RoutingRule {
  id: string;
  rule_name: string;
  lead_criteria: any;
  routing_type: string;
  target_buyers: any;
  weights: any;
  max_buyers: number;
  is_active: boolean;
  priority: number;
  created_at: string;
}

interface Partner {
  id: string;
  name: string;
  email: string;
  company_name: string;
  is_active: boolean;
}

const ROUTING_TYPES = [
  { 
    value: 'exclusive', 
    label: 'Exclusive', 
    description: 'Route lead to single best-matching buyer',
    icon: Users
  },
  { 
    value: 'multi_sell', 
    label: 'Multi-Sell', 
    description: 'Send lead to multiple non-competing buyers',
    icon: Shuffle
  },
  { 
    value: 'weighted', 
    label: 'Weighted Distribution', 
    description: 'Distribute leads based on percentage weights',
    icon: Route
  },
  { 
    value: 'ping_post', 
    label: 'Ping-Post Exchange', 
    description: 'Real-time bidding system',
    icon: Zap
  }
];

const RoutingRulesManagement = () => {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    lead_criteria: '{}',
    routing_type: '',
    target_buyers: '[]',
    weights: '{}',
    max_buyers: 1,
    is_active: true,
    priority: 100
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutingRules();
    fetchPartners();
  }, []);

  const fetchRoutingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_routing_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching routing rules:', error);
      toast({
        title: "Error",
        description: "Failed to load routing rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, email, company_name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const handleSaveRule = async () => {
    try {
      let lead_criteria, target_buyers, weights;
      try {
        lead_criteria = JSON.parse(formData.lead_criteria);
        target_buyers = JSON.parse(formData.target_buyers);
        weights = JSON.parse(formData.weights);
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON format in criteria, buyers, or weights",
          variant: "destructive"
        });
        return;
      }

      const ruleData = {
        ...formData,
        lead_criteria,
        target_buyers,
        weights
      };

      if (editingRule) {
        const { error } = await supabase
          .from('lead_routing_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        
        if (error) throw error;
        toast({
          title: "Rule Updated",
          description: "Routing rule has been updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('lead_routing_rules')
          .insert([ruleData]);
        
        if (error) throw error;
        toast({
          title: "Rule Created",
          description: "New routing rule has been created successfully"
        });
      }

      setDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchRoutingRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save routing rule",
        variant: "destructive"
      });
    }
  };

  const handleEditRule = (rule: RoutingRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      lead_criteria: JSON.stringify(rule.lead_criteria, null, 2),
      routing_type: rule.routing_type,
      target_buyers: JSON.stringify(rule.target_buyers, null, 2),
      weights: JSON.stringify(rule.weights, null, 2),
      max_buyers: rule.max_buyers,
      is_active: rule.is_active,
      priority: rule.priority
    });
    setDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;

    try {
      const { error } = await supabase
        .from('lead_routing_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      toast({
        title: "Rule Deleted",
        description: "Routing rule has been deleted successfully"
      });
      fetchRoutingRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete routing rule",
        variant: "destructive"
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('lead_routing_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;
      fetchRoutingRules();
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
      lead_criteria: '{}',
      routing_type: '',
      target_buyers: '[]',
      weights: '{}',
      max_buyers: 1,
      is_active: true,
      priority: 100
    });
  };

  const getRoutingTypeInfo = (type: string) => {
    return ROUTING_TYPES.find(rt => rt.value === type) || { label: type, description: '', icon: Route };
  };

  const getDefaultCriteria = () => {
    return JSON.stringify({
      loan_amount: { min: 10000, max: 500000 },
      credit_score: { min: 600 },
      monthly_revenue: { min: 10000 },
      time_in_business: ['6-12', '1-2', '2-5', '5+'],
      industries: ['restaurant', 'retail', 'construction'],
      states: ['CA', 'NY', 'FL', 'TX']
    }, null, 2);
  };

  const getDefaultTargetBuyers = (routingType: string) => {
    const defaultBuyers = partners.slice(0, 3).map(p => p.id);
    
    if (routingType === 'exclusive') {
      return JSON.stringify([defaultBuyers[0] || ''], null, 2);
    } else if (routingType === 'multi_sell') {
      return JSON.stringify(defaultBuyers, null, 2);
    } else if (routingType === 'weighted') {
      return JSON.stringify(defaultBuyers, null, 2);
    } else if (routingType === 'ping_post') {
      return JSON.stringify(defaultBuyers, null, 2);
    }
    
    return JSON.stringify([], null, 2);
  };

  const getDefaultWeights = (routingType: string) => {
    if (routingType === 'weighted') {
      const defaultBuyers = partners.slice(0, 3).map(p => p.id);
      const weights: Record<string, number> = {};
      defaultBuyers.forEach((id, index) => {
        weights[id] = index === 0 ? 50 : 25;
      });
      return JSON.stringify(weights, null, 2);
    }
    return JSON.stringify({}, null, 2);
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
          <h2 className="text-2xl font-bold">Routing Rules</h2>
          <p className="text-muted-foreground">
            Configure intelligent lead routing and distribution logic
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRule(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Routing Rule' : 'Create Routing Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure how validated leads should be routed to buyers
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
                  <Label htmlFor="routing_type">Routing Type</Label>
                  <Select 
                    value={formData.routing_type} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        routing_type: value,
                        target_buyers: getDefaultTargetBuyers(value),
                        weights: getDefaultWeights(value),
                        max_buyers: value === 'exclusive' ? 1 : 5
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select routing type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTING_TYPES.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <Label>Max Buyers</Label>
                  <Input
                    type="number"
                    value={formData.max_buyers}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_buyers: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="10"
                    disabled={formData.routing_type === 'exclusive'}
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
                <Label htmlFor="lead_criteria">Lead Criteria (JSON)</Label>
                <Textarea
                  id="lead_criteria"
                  value={formData.lead_criteria}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_criteria: e.target.value }))}
                  placeholder="Enter lead matching criteria as JSON"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Define which leads match this rule (loan amount, credit score, location, etc.)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_buyers">Target Buyers (JSON)</Label>
                  <Textarea
                    id="target_buyers"
                    value={formData.target_buyers}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_buyers: e.target.value }))}
                    placeholder="Enter buyer IDs as JSON array"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Array of partner IDs to route leads to
                  </p>
                </div>
                
                {formData.routing_type === 'weighted' && (
                  <div>
                    <Label htmlFor="weights">Weights (JSON)</Label>
                    <Textarea
                      id="weights"
                      value={formData.weights}
                      onChange={(e) => setFormData(prev => ({ ...prev, weights: e.target.value }))}
                      placeholder="Enter distribution weights as JSON"
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentage weights for each buyer (must sum to 100)
                    </p>
                  </div>
                )}
              </div>

              {/* Partner Reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Available Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {partners.map(partner => (
                      <div key={partner.id} className="flex items-center gap-2 p-2 border rounded">
                        <code className="bg-muted px-1 rounded">{partner.id}</code>
                        <span>{partner.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
            <Route className="h-5 w-5" />
            Active Routing Rules
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
                <TableHead>Max Buyers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const typeInfo = getRoutingTypeInfo(rule.routing_type);
                const IconComponent = typeInfo.icon;
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{typeInfo.label}</div>
                          <div className="text-xs text-muted-foreground">{typeInfo.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>{rule.max_buyers}</TableCell>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No routing rules configured. Create your first rule to get started.
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

export default RoutingRulesManagement;