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
import { Search, Filter, DollarSign, Clock, Building, User, Phone, Mail, AlertTriangle, CheckCircle, XCircle, CreditCard } from 'lucide-react';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  loan_amount: number;
  submitted_at: string;
  credit_score_range: string;
  industry: string;
  loan_type: string;
  country: string;
  phone_verified: boolean;
  base_price: number;
  current_highest_bid?: number;
  bid_count: number;
  status: 'available' | 'bidding' | 'sold' | 'expired' | 'invalid';
  expires_at: string;
  lead_quality_score: number;
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [filters, setFilters] = useState({
    country: 'all',
    industry: 'all',
    loan_type: 'all',
    min_amount: '',
    max_amount: '',
    status: 'all',
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
      
      // Mock data - in real implementation, this would come from your leads API
      const mockLeads: Lead[] = [
        {
          id: '1',
          business_name: 'Restaurant Solutions Inc',
          contact_name: 'John Smith',
          email: 'j***@restaurantsolutions.com',
          phone: '***-***-4567',
          loan_amount: 150000,
          submitted_at: '2024-01-09T10:30:00Z',
          credit_score_range: '720-750',
          industry: 'Restaurant',
          loan_type: 'Term Loan',
          country: 'US',
          phone_verified: true,
          base_price: 250,
          current_highest_bid: 320,
          bid_count: 3,
          status: 'bidding',
          expires_at: '2024-01-10T10:30:00Z',
          lead_quality_score: 85
        },
        {
          id: '2',
          business_name: 'Tech Startup LLC',
          contact_name: 'Sarah Johnson',
          email: 's***@techstartup.com',
          phone: '***-***-8901',
          loan_amount: 75000,
          submitted_at: '2024-01-09T14:15:00Z',
          credit_score_range: '680-720',
          industry: 'Technology',
          loan_type: 'Equipment Financing',
          country: 'US',
          phone_verified: false,
          base_price: 180,
          current_highest_bid: 180,
          bid_count: 0,
          status: 'available',
          expires_at: '2024-01-10T14:15:00Z',
          lead_quality_score: 72
        },
        {
          id: '3', 
          business_name: 'Construction Co',
          contact_name: 'Mike Davis',
          email: 'm***@constructionco.com',
          phone: '***-***-2345',
          loan_amount: 500000,
          submitted_at: '2024-01-08T09:00:00Z',
          credit_score_range: '750-800',
          industry: 'Construction',
          loan_type: 'SBA Loan',
          country: 'US',
          phone_verified: true,
          base_price: 450,
          current_highest_bid: 525,
          bid_count: 5,
          status: 'sold',
          expires_at: '2024-01-09T09:00:00Z',
          lead_quality_score: 92
        }
      ];
      
      setLeads(mockLeads);
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
        description: `Your bid of $${amount} has been placed for ${selectedLead.business_name}`,
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

  const getStatusBadge = (status: Lead['status']) => {
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
    if (score >= 90) return <Badge className="bg-green-600">Premium</Badge>;
    if (score >= 80) return <Badge className="bg-blue-600">High Quality</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-600">Standard</Badge>;
    return <Badge variant="outline">Basic</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.country !== 'all' && lead.country !== filters.country) return false;
    if (filters.industry !== 'all' && lead.industry !== filters.industry) return false;
    if (filters.loan_type !== 'all' && lead.loan_type !== filters.loan_type) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.min_amount && lead.loan_amount < parseInt(filters.min_amount)) return false;
    if (filters.max_amount && lead.loan_amount > parseInt(filters.max_amount)) return false;
    if (filters.search && !lead.business_name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !lead.contact_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
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
      <div>
        <h1 className="text-3xl font-bold">Lead Marketplace</h1>
        <p className="text-muted-foreground">Browse and bid on high-quality business loan leads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Available Leads</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.status === 'available').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Active Bids</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.status === 'bidding').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">My Active Bids</p>
                <p className="text-2xl font-bold">{bids.filter(b => b.status === 'active' || b.status === 'winning').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg. Lead Price</p>
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
                  placeholder="Business or contact name..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Country</Label>
              <Select value={filters.country} onValueChange={(value) => setFilters(prev => ({ ...prev, country: value === 'all' ? '' : value }))}>
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
              <Label>Industry</Label>
              <Select value={filters.industry} onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Loan Type</Label>
              <Select value={filters.loan_type} onValueChange={(value) => setFilters(prev => ({ ...prev, loan_type: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Term Loan">Term Loan</SelectItem>
                  <SelectItem value="SBA Loan">SBA Loan</SelectItem>
                  <SelectItem value="Equipment Financing">Equipment Financing</SelectItem>
                  <SelectItem value="Merchant Cash Advance">MCA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
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
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>Click on a lead to view details and place bids</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Loan Request</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Current Bid</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead>Time Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{lead.business_name}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {lead.phone_verified && <CheckCircle className="h-3 w-3 text-green-600" />}
                        {lead.country}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {lead.contact_name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">${lead.loan_amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{lead.loan_type}</div>
                    </div>
                  </TableCell>
                  <TableCell>{lead.industry}</TableCell>
                  <TableCell>{lead.credit_score_range}</TableCell>
                  <TableCell>{getQualityBadge(lead.lead_quality_score)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">${lead.base_price}</div>
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
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    {(lead.status === 'available' || lead.status === 'bidding') && (
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
                            <DialogTitle>Place Bid - {lead.business_name}</DialogTitle>
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