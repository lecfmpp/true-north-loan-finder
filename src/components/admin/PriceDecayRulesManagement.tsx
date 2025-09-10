import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Clock, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeBracket {
  label: string;
  min_minutes: number;
  max_minutes: number | null;
  percentage: number;
}

interface PriceDecayRule {
  id: string;
  rule_name: string;
  description: string | null;
  time_brackets: TimeBracket[];  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BracketFormData {
  label: string;
  min_minutes: string;
  max_minutes: string;
  percentage: string;
}

export default function PriceDecayRulesManagement() {
  const [rules, setRules] = useState<PriceDecayRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<PriceDecayRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_price_decay_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast the JSONB data to proper TypeScript types
      const typedRules: PriceDecayRule[] = (data || []).map(rule => ({
        ...rule,
        time_brackets: Array.isArray(rule.time_brackets) ? (rule.time_brackets as unknown as TimeBracket[]) : []
      }));
      
      setRules(typedRules);
    } catch (error) {
      console.error('Error fetching price decay rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch price decay rules.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (formData: any) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('lead_price_decay_rules')
        .insert([{
          rule_name: formData.rule_name,
          description: formData.description,
          time_brackets: formData.time_brackets,
          is_active: formData.is_active
        }]);

      if (error) throw error;

      await fetchRules();
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Price decay rule created successfully.",
      });
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create price decay rule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (ruleId: string, formData: any) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('lead_price_decay_rules')
        .update({
          rule_name: formData.rule_name,
          description: formData.description,
          time_brackets: formData.time_brackets,
          is_active: formData.is_active
        })
        .eq('id', ruleId);

      if (error) throw error;

      await fetchRules();
      setEditingRule(null);
      toast({
        title: "Success",
        description: "Price decay rule updated successfully.",
      });
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Error",
        description: "Failed to update price decay rule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this price decay rule?')) return;

    try {
      const { error } = await supabase
        .from('lead_price_decay_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      await fetchRules();
      toast({
        title: "Success",
        description: "Price decay rule deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete price decay rule.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <span>Loading price decay rules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-primary" />
            Price Decay Rules
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure time-based pricing rules that automatically decrease lead prices as they age
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            How Price Decay Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>Time Tracking:</strong> The system tracks each lead's age from creation</p>
            <p>• <strong>Automatic Pricing:</strong> Lead prices decrease based on configured time brackets</p>
            <p>• <strong>Real-time Updates:</strong> Prices update dynamically in the marketplace</p>
            <p>• <strong>Single Active Rule:</strong> Only one rule can be active at a time</p>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {(showCreateForm || editingRule) && (
        <RuleForm
          rule={editingRule}
          onSave={editingRule ? 
            (formData) => updateRule(editingRule.id, formData) : 
            createRule
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingRule(null);
          }}
          saving={saving}
        />
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onEdit={setEditingRule}
            onDelete={deleteRule}
          />
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No price decay rules configured</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="mt-4"
            >
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RuleCardProps {
  rule: PriceDecayRule;
  onEdit: (rule: PriceDecayRule) => void;
  onDelete: (ruleId: string) => void;
}

function RuleCard({ rule, onEdit, onDelete }: RuleCardProps) {
  return (
    <Card className={rule.is_active ? 'border-green-200 bg-green-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
            {rule.is_active && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(rule)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(rule.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {rule.description && (
          <CardDescription>{rule.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Time Brackets:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rule.time_brackets.map((bracket, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <div className="font-medium text-sm">{bracket.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {bracket.min_minutes}min - {bracket.max_minutes ? `${bracket.max_minutes}min` : '∞'}
                  </div>
                </div>
                <div className="font-bold text-right">
                  {bracket.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RuleFormProps {
  rule: PriceDecayRule | null;
  onSave: (formData: any) => void;
  onCancel: () => void;
  saving: boolean;
}

function RuleForm({ rule, onSave, onCancel, saving }: RuleFormProps) {
  const [formData, setFormData] = useState({
    rule_name: rule?.rule_name || '',
    description: rule?.description || '',
    is_active: rule?.is_active ?? true,
    time_brackets: rule?.time_brackets || []
  });

  const [brackets, setBrackets] = useState<BracketFormData[]>(
    rule?.time_brackets.map(b => ({
      label: b.label,
      min_minutes: b.min_minutes.toString(),
      max_minutes: b.max_minutes?.toString() || '',
      percentage: b.percentage.toString()
    })) || [
      { label: 'Hot (0-5 min)', min_minutes: '0', max_minutes: '5', percentage: '100' },
      { label: 'Warm (5-60 min)', min_minutes: '5', max_minutes: '60', percentage: '85' },
      { label: 'Aged (1-24 hours)', min_minutes: '60', max_minutes: '1440', percentage: '60' },
      { label: 'Old (24+ hours)', min_minutes: '1440', max_minutes: '', percentage: '40' }
    ]
  );

  const addBracket = () => {
    setBrackets([...brackets, { label: '', min_minutes: '', max_minutes: '', percentage: '' }]);
  };

  const removeBracket = (index: number) => {
    setBrackets(brackets.filter((_, i) => i !== index));
  };

  const updateBracket = (index: number, field: keyof BracketFormData, value: string) => {
    const updated = [...brackets];
    updated[index] = { ...updated[index], [field]: value };
    setBrackets(updated);
  };

  const handleSubmit = () => {
    // Validate and convert brackets
    const processedBrackets = brackets.map(b => ({
      label: b.label,
      min_minutes: parseInt(b.min_minutes) || 0,
      max_minutes: b.max_minutes ? parseInt(b.max_minutes) : null,
      percentage: parseFloat(b.percentage) || 0
    }));

    onSave({
      ...formData,
      time_brackets: processedBrackets
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{rule ? 'Edit' : 'Create'} Price Decay Rule</CardTitle>
        <CardDescription>
          Configure time-based pricing that automatically adjusts lead prices based on age
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rule_name">Rule Name</Label>
            <Input
              id="rule_name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              placeholder="e.g., Standard Age-Based Pricing"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active Rule</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe when and how this rule should be applied..."
            rows={2}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Time Brackets</h4>
            <Button variant="outline" size="sm" onClick={addBracket}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bracket
            </Button>
          </div>

          <div className="space-y-3">
            {brackets.map((bracket, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                <div className="col-span-4">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={bracket.label}
                    onChange={(e) => updateBracket(index, 'label', e.target.value)}
                    placeholder="e.g., Hot Leads"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Min (min)</Label>
                  <Input
                    type="number"
                    value={bracket.min_minutes}
                    onChange={(e) => updateBracket(index, 'min_minutes', e.target.value)}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Max (min)</Label>
                  <Input
                    type="number"
                    value={bracket.max_minutes}
                    onChange={(e) => updateBracket(index, 'max_minutes', e.target.value)}
                    placeholder="∞"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Price %</Label>
                  <Input
                    type="number"
                    value={bracket.percentage}
                    onChange={(e) => updateBracket(index, 'percentage', e.target.value)}
                    placeholder="100"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBracket(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {rule ? 'Update' : 'Create'} Rule
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}