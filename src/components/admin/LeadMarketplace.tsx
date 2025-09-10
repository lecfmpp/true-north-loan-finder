import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, intervalToDuration } from 'date-fns';
import { Search, Filter, DollarSign, Clock, Building, User, Phone, Mail, AlertTriangle, CheckCircle, XCircle, CreditCard, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { EmailVerificationIcon } from '@/components/EmailVerificationIcon';

// Helper function to get credit score number from classification
const getCreditScoreNumber = (creditScore: string) => {
  switch (creditScore) {
    case "excellent":
      return "750+";
    case "good":
      return "700-749";
    case "fair":
      return "650-699";
    case "poor":
      return "300-649";
    default:
      return creditScore;
  }
};

// Helper to map credit score category to an approximate numeric value
const getCreditScoreApprox = (creditScore: string) => {
  switch (creditScore) {
    case "excellent":
      return 775;
    case "good":
      return 725;
    case "fair":
      return 675;
    case "poor":
      return 625;
    case "unsure":
      return 650;
    default:
      // If it's a direct number, parse it
      {
        const n = parseInt(creditScore, 10);
        return isNaN(n) ? 0 : n;
      }
  }
};

// Helper function to get tier from score (merged Strong and Good into Qualified)
const getScoreTier = (score: number | null): string => {
  if (!score) return 'Potential (0-44)';
  if (score >= 85) return 'Exceptional (85+)';
  if (score >= 45) return 'Qualified (45-84)';
  return 'Potential (0-44)';
};

// Helper to get tier name without score range
const getScoreTierName = (score: number | null): string => {
  if (!score) return 'Potential';
  if (score >= 85) return 'Exceptional';
  if (score >= 45) return 'Qualified';
  return 'Potential';
};

// Calculate lead base price using tier-based pricing with decay
const calculateLeadBasePrice = async (lead: any): Promise<number> => {
  const score = lead.score || 0;
  const tierName = getScoreTierName(score);
  
  try {
    // Fetch tier pricing from database
    const { data: tierPricing, error } = await supabase
      .from('lead_tier_pricing')
      .select('base_price_min, base_price_max')
      .eq('tier_name', tierName)
      .eq('is_active', true)
      .single();

    let basePriceCents = 5000; // Default $50 in cents

    if (error || !tierPricing) {
      console.error('Error fetching tier pricing:', error);
      // Fallback to default pricing based on tier (in cents)
      switch (tierName) {
        case 'Exceptional':
          basePriceCents = 28000; // $280 in cents
          break;
        case 'Qualified':
          basePriceCents = 7000; // $70 in cents
          break;
        case 'Potential':
        default:
          basePriceCents = 3700; // $37 in cents
          break;
      }
    } else {
      // Use the average of min and max as base price (already in cents)
      basePriceCents = Math.round((tierPricing.base_price_min + tierPricing.base_price_max) / 2);
    }

    // Apply price decay based on lead age
    const { data: decayedPrice, error: decayError } = await supabase
      .rpc('calculate_lead_price_with_decay', {
        lead_created_at: lead.created_at,
        base_price: basePriceCents
      });
    
    if (decayError) {
      console.error('Error calculating price decay:', decayError);
      return Math.round(basePriceCents / 100); // Return base price in dollars if decay fails
    }
    
    // Convert from cents to dollars
    return Math.round((decayedPrice || basePriceCents) / 100);
  } catch (error) {
    console.error('Error calculating base price:', error);
    return 50; // $50 fallback
  }
};

// Qualified rule: revenue >= $10k, business age >= 6 months, credit score >= 600
const isTimeInBusinessAtLeast6Months = (tib?: string) => {
  return tib !== 'startup' && tib !== '0-6';
};

const isQualified = (lead: QuizResponse) => {
  const revenueOk = (lead.monthly_revenue || 0) >= 10000;
  const tibOk = isTimeInBusinessAtLeast6Months(lead.time_in_business);
  const creditOk = getCreditScoreApprox(lead.credit_score) >= 600;
  return revenueOk && tibOk && creditOk;
};

interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  company_name: string;
  monthly_revenue: number;
  loan_amount: number;
  credit_score: string;
  time_in_business: string;
  use_of_funds: string;
  score: number;
  status: string;
  admin_notes: string;
  created_at: string;
  country: string;
  city_province: string;
  attribution_channel?: string;
  attribution_url?: string | null;
  bank_account_type?: string;
  homeowner_status?: string;
  email_verified?: boolean;
  email_verified_at?: string;
  // Marketplace specific fields
  base_price: number;
  current_highest_bid?: number;
  bid_count: number;
  marketplace_status: 'available' | 'bidding' | 'sold' | 'expired' | 'invalid';
  expires_at: string;
}

interface Bid {
  id: string;
  lead_id: string;
  buyer_id: string;
  bid_amount: number;
  status: 'active' | 'winning' | 'outbid' | 'expired' | 'declined';
  created_at: string;
  buyer_name?: string;
}

const LeadMarketplace: React.FC = () => {
  const [leads, setLeads] = useState<QuizResponse[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculatingPrices, setRecalculatingPrices] = useState(false);
  const [selectedLead, setSelectedLead] = useState<QuizResponse | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [sortField, setSortField] = useState<keyof QuizResponse>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    country: 'all',
    industry: 'all',
    status: 'all',
    qualified: 'all',
    min_amount: '',
    max_amount: '',
    min_score: '',
    search: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
    fetchMyBids();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Fetch real leads from Supabase - last 20 leads
      const { data: quizResponses, error } = await supabase
        .from('quiz_responses')
        .select(`
          id,
          name,
          email,
          phone,
          website,
          company_name,
          monthly_revenue,
          loan_amount,
          credit_score,
          time_in_business,
          use_of_funds,
          score,
          status,
          admin_notes,
          created_at,
          country,
          city_province,
          attribution_channel,
          attribution_url,
          bank_account_type,
          homeowner_status,
          email_verified,
          email_verified_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      // Map Supabase data to LeadMarketplace format with tier-based pricing
      const mappedLeads: QuizResponse[] = await Promise.all(
        (quizResponses || []).map(async (lead) => ({
          id: lead.id,
          name: lead.name || 'Unknown',
          email: lead.email || '',
          phone: lead.phone || '',
          website: lead.website || '',
          company_name: lead.company_name || 'Unknown Company',
          monthly_revenue: lead.monthly_revenue || 0,
          loan_amount: lead.loan_amount || 0,
          credit_score: lead.credit_score || 'unknown',
          time_in_business: lead.time_in_business || 'unknown',
          use_of_funds: lead.use_of_funds || '',
          score: lead.score || 0,
          status: lead.status || 'New',
          admin_notes: lead.admin_notes || '',
          created_at: lead.created_at || new Date().toISOString(),
          country: lead.country || 'US',
          city_province: lead.city_province || '',
          attribution_channel: lead.attribution_channel,
          attribution_url: lead.attribution_url,
          bank_account_type: lead.bank_account_type,
          homeowner_status: lead.homeowner_status,
          email_verified: lead.email_verified || false,
          email_verified_at: lead.email_verified_at,
          // Marketplace fields with tier-based pricing
          base_price: await calculateLeadBasePrice(lead),
          current_highest_bid: undefined,
          bid_count: 0,
          marketplace_status: 'available' as const,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
      );
      
      setLeads(mappedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBids = async () => {
    try {
      // Mock data - in real implementation, fetch user's bids
      const mockBids: Bid[] = [
        {
          id: '1',
          lead_id: '1',
          buyer_id: 'current-user',
          bid_amount: 300,
          status: 'outbid',
          created_at: '2024-01-09T11:00:00Z',
          buyer_name: 'My Company'
        }
      ];
      setBids(mockBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const recalculateAllPrices = async () => {
    try {
      setRecalculatingPrices(true);
      
      // Update all leads with recalculated tier-based prices
      const updatedLeads = await Promise.all(
        leads.map(async (lead) => ({
          ...lead,
          base_price: await calculateLeadBasePrice(lead)
        }))
      );
      
      setLeads(updatedLeads);
      
      toast({
        title: "Prices Recalculated",
        description: "All base prices updated with tier-based pricing structure",
      });
      
    } catch (error) {
      console.error('Error recalculating prices:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate prices",
        variant: "destructive"
      });
    } finally {
      setRecalculatingPrices(false);
    }
  };

  const handleSort = (field: keyof QuizResponse) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedLead || !bidAmount) return;
    
    const amount = parseFloat(bidAmount);
    const minimumBid = Math.max(selectedLead.base_price, (selectedLead.current_highest_bid || 0) + 10);
    
    if (amount < minimumBid) {
      toast({
        title: "Invalid Bid",
        description: `Minimum bid is $${minimumBid}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // In real implementation, this would call your bid API
      toast({
        title: "Bid Placed Successfully",
        description: `Your bid of $${amount} has been placed for ${selectedLead.name}`,
      });
      
      setBidAmount('');
      setBidNotes('');
      setSelectedLead(null);
      fetchLeads();
      fetchMyBids();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place bid",
        variant: "destructive"
      });
    }
  };

  const getMarketplaceStatusBadge = (status: QuizResponse['marketplace_status']) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
      case 'bidding':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active Bidding</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Sold</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQualityBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-600">Exceptional</Badge>;
    if (score >= 45) return <Badge className="bg-blue-600">Qualified</Badge>;
    return <Badge variant="outline">Potential</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.country !== 'all' && lead.country !== filters.country) return false;
    if (filters.status !== 'all' && lead.marketplace_status !== filters.status) return false;
    if (filters.qualified === 'qualified' && !isQualified(lead)) return false;
    if (filters.qualified === 'unqualified' && isQualified(lead)) return false;
    if (filters.min_amount && lead.loan_amount < parseInt(filters.min_amount)) return false;
    if (filters.max_amount && lead.loan_amount > parseInt(filters.max_amount)) return false;
    if (filters.min_score && lead.score < parseInt(filters.min_score)) return false;
    if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !lead.company_name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !lead.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBusinessAge = (timeInBusiness: string) => {
    switch (timeInBusiness) {
      case 'startup':
        return 'Startup';
      case '6-12':
        return '6-12 months';
      case '1-2':
        return '1-2 years';
      case '2-5':
        return '2-5 years';
      case '+5':
        return '5+ years';
      default:
        return timeInBusiness || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Lead Marketplace</h1>
          <p className="text-muted-foreground">Browse and bid on qualified business loan leads</p>
        </div>
        <Button 
          onClick={recalculateAllPrices}
          disabled={recalculatingPrices}
          className="flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {recalculatingPrices ? 'Recalculating...' : 'Recalculate Prices'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Available Leads</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.marketplace_status === 'available').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Active Bidding</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.marketplace_status === 'bidding').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Qualified Leads</p>
                <p className="text-2xl font-bold">{leads.filter(l => isQualified(l)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg. Price</p>
                <p className="text-2xl font-bold">${Math.round(leads.reduce((acc, lead) => acc + (lead.current_highest_bid || lead.base_price), 0) / leads.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, company, email..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Country</Label>
              <Select value={filters.country} onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="bidding">Active Bidding</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Qualified</Label>
              <Select value={filters.qualified} onValueChange={(value) => setFilters(prev => ({ ...prev, qualified: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  <SelectItem value="qualified">Qualified Only</SelectItem>
                  <SelectItem value="unqualified">Unqualified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Min Amount</Label>
              <Input
                placeholder="$0"
                value={filters.min_amount}
                onChange={(e) => setFilters(prev => ({ ...prev, min_amount: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Max Amount</Label>
              <Input
                placeholder="$1M+"
                value={filters.max_amount}
                onChange={(e) => setFilters(prev => ({ ...prev, max_amount: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Min Score</Label>
              <Input
                placeholder="0"
                value={filters.min_score}
                onChange={(e) => setFilters(prev => ({ ...prev, min_score: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Leads ({sortedLeads.length})</CardTitle>
          <CardDescription>Click on a lead to view details and place bids</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('name')}>
                    Name
                    {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    {sortField !== 'name' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[100px]">Verified</TableHead>
                <TableHead className="min-w-[120px]">Phone</TableHead>
                <TableHead className="min-w-[80px]">Country</TableHead>
                <TableHead className="min-w-[120px]">
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('monthly_revenue')}>
                    Monthly Revenue
                    {sortField === 'monthly_revenue' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    {sortField !== 'monthly_revenue' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[120px]">Bank Account</TableHead>
                <TableHead className="min-w-[120px]">Homeowner</TableHead>
                <TableHead className="min-w-[120px]">
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('loan_amount')}>
                    Loan Amount
                    {sortField === 'loan_amount' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    {sortField !== 'loan_amount' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[100px]">
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('credit_score')}>
                    Credit Score
                    {sortField === 'credit_score' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    {sortField !== 'credit_score' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('time_in_business')}>
                    Business Age
                    {sortField === 'time_in_business' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    {sortField !== 'time_in_business' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[180px]">Use of Funds</TableHead>
                <TableHead className="min-w-[100px]">
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent hover:text-current" onClick={() => handleSort('score')}>
                    Score
                    {sortField === 'score' && (sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />)}
                    {sortField !== 'score' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[100px]">Base Price</TableHead>
                <TableHead className="min-w-[100px]">Current Bid</TableHead>
                <TableHead className="min-w-[80px]">Bids</TableHead>
                <TableHead className="min-w-[100px]">Time Left</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.company_name}</div>
                      {isQualified(lead) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Qualified</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.email}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <EmailVerificationIcon 
                      isVerified={lead.email_verified || false}
                      verifiedAt={lead.email_verified_at}
                      size="md"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.country}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      ${lead.monthly_revenue?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium capitalize">
                      {lead.bank_account_type || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium capitalize">
                      {lead.homeowner_status || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      ${lead.loan_amount?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {getCreditScoreNumber(lead.credit_score)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatBusinessAge(lead.time_in_business)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-[180px] truncate" title={lead.use_of_funds}>
                      {lead.use_of_funds}
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full ${lead.score >= 85 ? 'bg-green-500' : lead.score >= 45 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                       <span className="font-medium">{lead.score}/100</span>
                     </div>
                  </TableCell>
                   <TableCell>
                     <div className="font-medium text-green-600">
                       ${lead.base_price}
                       <div className="text-xs text-muted-foreground">
                         {getScoreTier(lead.score)}
                       </div>
                     </div>
                   </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {lead.current_highest_bid ? `$${lead.current_highest_bid}` : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">{lead.bid_count}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatTimeRemaining(lead.expires_at)}
                    </div>
                  </TableCell>
                  <TableCell>{getMarketplaceStatusBadge(lead.marketplace_status)}</TableCell>
                  <TableCell>
                    {(lead.marketplace_status === 'available' || lead.marketplace_status === 'bidding') && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedLead(lead)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Place Bid - {lead.name}</DialogTitle>
                            <DialogDescription>
                              Enter your bid amount. Minimum bid: ${Math.max(lead.base_price, (lead.current_highest_bid || 0) + 10)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="bid">Bid Amount ($)</Label>
                              <Input
                                id="bid"
                                type="number"
                                placeholder={`${Math.max(lead.base_price, (lead.current_highest_bid || 0) + 10)}`}
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Any additional notes..."
                                value={bidNotes}
                                onChange={(e) => setBidNotes(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handlePlaceBid} className="flex-1">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Place Bid
                              </Button>
                              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadMarketplace;