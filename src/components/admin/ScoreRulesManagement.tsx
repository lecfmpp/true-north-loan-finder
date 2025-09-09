import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit3, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ScoreRule {
  id: string;
  rule_name: string;
  criteria_field: string;
  criteria_operator: string;
  criteria_value: string;
  score_points: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

const ScoreRulesManagement = () => {
  const [rules, setRules] = useState<ScoreRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoreRule | null>(null);
  const { toast } = useToast();

  // Note: Currently using mock data until database types are updated
  const [formData, setFormData] = useState({
    rule_name: '',
    criteria_field: '',
    criteria_operator: 'greater_than',
    criteria_value: '',
    score_points: 0,
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchScoreRules();
  }, []);

  const fetchScoreRules = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_score_rules')
        .select('*')
        .order('criteria_field', { ascending: true })
        .order('score_points', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching score rules:', error);
      toast({
        title: "Error",
        description: "Failed to load score rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRule) {
        // Update existing rule
        const { error } = await supabase
          .from('lead_score_rules')
          .update({
            rule_name: formData.rule_name,
            criteria_field: formData.criteria_field,
            criteria_operator: formData.criteria_operator,
            criteria_value: formData.criteria_value,
            score_points: formData.score_points,
            description: formData.description,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Score rule updated successfully"
        });
      } else {
        // Create new rule
        const { error } = await supabase
          .from('lead_score_rules')
          .insert({
            rule_name: formData.rule_name,
            criteria_field: formData.criteria_field,
            criteria_operator: formData.criteria_operator,
            criteria_value: formData.criteria_value,
            score_points: formData.score_points,
            description: formData.description,
            is_active: formData.is_active
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Score rule created successfully"
        });
      }

      await fetchScoreRules();
      handleDialogClose();
    } catch (error) {
      console.error('Error saving score rule:', error);
      toast({
        title: "Error",
        description: "Failed to save score rule",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (rule: ScoreRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      criteria_field: rule.criteria_field,
      criteria_operator: rule.criteria_operator,
      criteria_value: rule.criteria_value,
      score_points: rule.score_points,
      description: rule.description || '',
      is_active: rule.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this score rule?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_score_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Score rule deleted successfully"
      });
      
      await fetchScoreRules();
    } catch (error) {
      console.error('Error deleting score rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete score rule",
        variant: "destructive"
      });
    }
  };

  const recalculateAllScores = async () => {
    try {
      toast({
        title: "Processing",
        description: "Recalculating scores for all leads..."
      });

      const { error } = await supabase.functions.invoke('recalculate-all-scores');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "All lead scores have been recalculated"
      });
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate scores",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      criteria_field: '',
      criteria_operator: 'greater_than',
      criteria_value: '',
      score_points: 0,
      description: '',
      is_active: true
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRule(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Score Rules</h2>
          <p className="text-muted-foreground">
            Configure scoring rules to automatically score incoming leads
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={recalculateAllScores}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate All Scores
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Score Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Score Rule' : 'Add New Score Rule'}
                </DialogTitle>
                <DialogDescription>
                  Define criteria and points for lead scoring
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule_name">Rule Name</Label>
                    <Input
                      id="rule_name"
                      value={formData.rule_name}
                      onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                      placeholder="High Revenue Rule"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="score_points">Score Points</Label>
                    <Select 
                      value={formData.score_points.toString()} 
                      onValueChange={(value) => setFormData({...formData, score_points: parseInt(value) || 0})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select points" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="5">5 Points - Minor Bonus</SelectItem>
                        <SelectItem value="10">10 Points - Small Bonus</SelectItem>
                        <SelectItem value="15">15 Points - Good Bonus</SelectItem>
                        <SelectItem value="20">20 Points - Strong Bonus</SelectItem>
                        <SelectItem value="25">25 Points - Major Bonus</SelectItem>
                        <SelectItem value="30">30 Points - Excellent Bonus</SelectItem>
                        <SelectItem value="35">35 Points - Premium Bonus</SelectItem>
                        <SelectItem value="40">40 Points - Maximum Bonus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="criteria_field">Field</Label>
                    <Select value={formData.criteria_field} onValueChange={(value) => setFormData({...formData, criteria_field: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="loan_amount">Loan Amount</SelectItem>
                        <SelectItem value="monthly_revenue">Monthly Revenue</SelectItem>
                        <SelectItem value="credit_score">Credit Score</SelectItem>
                        <SelectItem value="time_in_business">Time in Business</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="criteria_operator">Operator</Label>
                    <Select value={formData.criteria_operator} onValueChange={(value) => setFormData({...formData, criteria_operator: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="criteria_value">Value</Label>
                    <Input
                      id="criteria_value"
                      value={formData.criteria_value}
                      onChange={(e) => setFormData({...formData, criteria_value: e.target.value})}
                      placeholder="100000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description of this scoring rule"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Rules</CardTitle>
          <CardDescription>
            Active rules that determine how leads are scored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criteria Field</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {rule.criteria_field.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.rule_name}</div>
                      {rule.description && (
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {rule.criteria_operator} {rule.criteria_value}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.score_points > 0 ? "default" : "secondary"}>
                      {rule.score_points > 0 ? '+' : ''}{rule.score_points}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No score rules configured. Add a rule to start scoring leads.
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

export default ScoreRulesManagement;