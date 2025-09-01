import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, DollarSign, TrendingUp, Users, Shield, Phone, Mail, MapPin, Clock, Star } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendlyInline from "@/components/CalendlyInline";
import { supabase } from "@/integrations/supabase/client";
import VideoEmbed from "@/components/VideoEmbed";
const BrokerSignup = () => {
  const costPerLead = 100; // Fixed at $100
  const [leadsPerMonth, setLeadsPerMonth] = useState([100]);
  const [fundRate, setFundRate] = useState([25]);
  const [avgRevenuePerDeal, setAvgRevenuePerDeal] = useState([3500]);
  const totalSpend = costPerLead * leadsPerMonth[0];
  const applications = Math.round(leadsPerMonth[0] * 0.2); // Assuming 20% application rate from leads
  const funded = Math.round(applications * (fundRate[0] / 100));
  const totalCommission = funded * avgRevenuePerDeal[0];
  const roi = totalSpend > 0 ? Math.round((totalCommission - totalSpend) / totalSpend * 100) : 0;

  // Load video settings for the trial section video
  const [videoSettings, setVideoSettings] = useState<{ video_url: string | null; embed_code: string | null; video_title: string | null } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  useEffect(() => {
    const loadVideo = async () => {
      const { data, error } = await supabase
        .from('video_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (error && (error as any).code !== 'PGRST116') {
        setVideoError(error.message);
      } else {
        setVideoSettings(data);
      }
    };
    loadVideo();
  }, []);

  // Sample leads data
  const sampleLeads = [{
    businessName: "Tony's Italian Restaurant",
    contactName: "Tony Rodriguez",
    loanAmount: "$75,000",
    industry: "Restaurant",
    creditScore: 680,
    timeAgo: "2 mins ago",
    phone: "(555) 123-4567",
    email: "tony@tonysitalian.com"
  }, {
    businessName: "Advanced Auto Repair",
    contactName: "Michael Chen",
    loanAmount: "$125,000",
    industry: "Automotive",
    creditScore: 720,
    timeAgo: "5 mins ago",
    phone: "(555) 987-6543",
    email: "mike@advancedauto.com"
  }, {
    businessName: "Sunshine Daycare Center",
    contactName: "Sarah Johnson",
    loanAmount: "$50,000",
    industry: "Childcare",
    creditScore: 650,
    timeAgo: "8 mins ago",
    phone: "(555) 456-7890",
    email: "sarah@sunshinedaycare.com"
  }];
  const targetAudience = [{
    title: "Established Business Owner",
    revenue: "$300K - $2M Annual Revenue",
    description: "Profitable businesses looking to expand, purchase equipment, or increase working capital.",
    timeInBusiness: "2+ years in business",
    creditScore: "640+ credit score",
    fundingNeed: "$25K - $500K funding need"
  }, {
    title: "High-Growth Companies",
    revenue: "$1M+ Annual Revenue",
    description: "Fast-growing companies needing capital to scale operations, hire staff, or expand locations.",
    timeInBusiness: "3+ years in business",
    creditScore: "680+ credit score",
    fundingNeed: "$100K - $1M funding need"
  }, {
    title: "Asset-Rich Businesses",
    revenue: "$750K+ Annual Revenue",
    description: "Equipment-heavy businesses in construction, manufacturing, transportation, and medical fields.",
    timeInBusiness: "2+ years in business",
    creditScore: "620+ credit score",
    fundingNeed: "$50K - $2M funding need"
  }];
  const benefits = [{
    title: "Pre-Qualified Leads Only",
    description: "Every lead is pre-screened and qualified before delivery",
    percentage: "20%",
    metric: "Qualification Rate"
  }, {
    title: "Exclusive For Your Rights",
    description: "Leads are delivered exclusively to you - no competition",
    percentage: "100%",
    metric: "Exclusivity Rate"
  }, {
    title: "Competitive Lead Price Points",
    description: "Industry-leading prices with volume discounts available",
    percentage: "50%+",
    metric: "Cost Savings"
  }, {
    title: "Same-Day Lead Delivery",
    description: "Leads delivered within hours of qualification",
    percentage: "2x Faster",
    metric: "Speed vs Industry"
  }, {
    title: "In-House Lead Sources",
    description: "All leads generated through our proprietary channels",
    percentage: "100%",
    metric: "First-Party Data"
  }, {
    title: "Performance Analytics",
    description: "Real-time tracking and performance optimization",
    percentage: "Real Time",
    metric: "Analytics Updates"
  }];
  return <div className="min-h-screen bg-background">
      <SEOHead title="Broker Partnership Program - True North Business Loan" description="Join our exclusive broker partnership program and start earning competitive commissions on high-quality business loan referrals." keywords={["broker partnership", "business loan broker", "earn commissions", "broker program", "exclusive leads"]} />
      
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20" variant="outline">
              PARTNER WITH US TODAY
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Stop Paying for the Same Old Lists Every Broker Calls. Start Getting{" "}
              <span className="text-primary">Exclusive Leads</span> That Buy Back Your Time.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join our exclusive broker network and receive pre-qualified, exclusive business loan leads delivered directly to your inbox. No more cold calling shared lists or competing with dozens of other brokers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                Book Free Strategy Call
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View Sample Leads
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trial Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Book your '<span className="text-primary">25 Leads</span>' trial call and find out if we can start filling your pipeline this week.
            </h2>
            
            <div className="bg-card rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <div className="aspect-video bg-muted rounded-lg mb-6 overflow-hidden">
                {videoSettings?.embed_code ? (
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: videoSettings.embed_code }} />
                ) : videoSettings?.video_url ? (
                  <VideoEmbed url={videoSettings.video_url || undefined} title={videoSettings.video_title || 'Broker Program Video'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Video will appear here once configured.
                  </div>
                )}
              </div>
              <p className="text-lg text-muted-foreground">
                See exactly how our exclusive lead system works and get your first 10 leads delivered within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leads Simulation */}
      

      {/* Target Audience */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Target Audience
              </h2>
              <p className="text-lg text-muted-foreground">
                <span className="text-primary font-semibold">Business Owners ready to Fund</span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {targetAudience.map((audience, index) => <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-foreground">{audience.title}</CardTitle>
                    <p className="text-primary font-semibold">{audience.revenue}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{audience.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{audience.timeInBusiness}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{audience.creditScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{audience.fundingNeed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing / ROI Calculator */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                <span className="text-primary font-semibold">Results</span> - Calculator ROI-Calculator for Brokers
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Calculator Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">ROI Calculator for Brokers</CardTitle>
                  <p className="text-muted-foreground">Calculate your potential returns</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <label className="block text-lg font-medium text-foreground mb-3">
                      Good Tier Lead - ${costPerLead} per lead
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                          <p className="text-sm font-semibold">Minimum $25K</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Time in Business</p>
                          <p className="text-sm font-semibold">Minimum 6 Months</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Amount</p>
                          <p className="text-sm font-semibold">Minimum 25k</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Credit Score</p>
                          <p className="text-sm font-semibold">Minimum 600</p>
                        </div>
                      </div>
                    </div>
                    
                    
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-foreground mb-3">
                      How many qualified leads do you need each month to hit your targets?
                    </label>
                    <div className="text-lg font-semibold text-primary mb-2">{leadsPerMonth[0]} leads per month</div>
                    <Slider value={leadsPerMonth} onValueChange={setLeadsPerMonth} max={500} min={50} step={10} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-4">
                      <span>50 leads</span>
                      <span>500 leads</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-foreground mb-3">What's your current closing rate on qualified leads?</label>
                    <div className="text-lg font-semibold text-primary mb-2">{fundRate[0]}% funding rate</div>
                    <Slider value={fundRate} onValueChange={setFundRate} max={80} min={20} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-4">
                      <span>20% (Industry Average)</span>
                      <span>80% (Top Performers)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-foreground mb-3">
                      What's your average commission per funded deal?
                    </label>
                    <div className="text-lg font-semibold text-primary mb-2">${avgRevenuePerDeal[0].toLocaleString()} per funded business</div>
                    <Slider value={avgRevenuePerDeal} onValueChange={setAvgRevenuePerDeal} max={20000} min={3500} step={100} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-4">
                      <span>$3,500 (Small Deals)</span>
                      <span>$20,000 (Large Deals)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">Your Potential Results</CardTitle>
                  <p className="text-muted-foreground">Based on your inputs</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">Total Monthly Spend</span>
                      <span className="text-lg font-semibold text-foreground">${totalSpend.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">Deals Funded</span>
                      <span className="text-lg font-semibold text-primary">{funded}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-foreground font-medium">Total Commission</span>
                      <span className="text-2xl font-bold text-primary">${totalCommission.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-800 font-medium">Gross Profit</span>
                      <span className="text-2xl font-bold text-blue-600">${(totalCommission - totalSpend).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-800 font-medium">Monthly ROI</span>
                      <span className="text-2xl font-bold text-green-600">{roi}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{leadsPerMonth[0]}</p>
                        <p className="text-sm text-muted-foreground">Leads/Month</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{funded}</p>
                        <p className="text-sm text-muted-foreground">Funded</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-primary">${costPerLead}</p>
                        <p className="text-sm text-muted-foreground">Cost/Lead</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      

      {/* Partnership Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Partnership Benefits
              </h2>
              <p className="text-lg text-muted-foreground">
                
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => <Card key={index} className="text-center h-full">
                  <CardContent className="p-6">
                    <div className="text-4xl font-bold text-primary mb-2">{benefit.percentage}</div>
                    <div className="text-sm text-muted-foreground mb-4">{benefit.metric}</div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </div>
      </section>

      {/* Calendly Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Start Getting Exclusive Leads?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Book a strategy call to discuss your lead requirements and get started with your first batch of pre-qualified leads.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <CalendlyInline url="https://calendly.com/leandro-truenorth-businessloan/30min" height={700} />
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default BrokerSignup;