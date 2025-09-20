import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Warehouse, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle,
  ArrowRight,
  Lock,
  Camera
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import selfStorageBusinessImage from "@/assets/self-storage-business.webp";

const SelfStorage = () => {
  const benefits = [
    {
      icon: <Warehouse className="h-6 w-6 text-secondary" />,
      title: "Facility Expansion",
      description: "Build additional storage units and expand facility capacity"
    },
    {
      icon: <Camera className="h-6 w-6 text-secondary" />,
      title: "Technology Upgrades",
      description: "Implement modern security systems and management software"
    },
    {
      icon: <Lock className="h-6 w-6 text-secondary" />,
      title: "Security Enhancement",
      description: "Invest in advanced security features to protect customer belongings"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Operational Efficiency",
      description: "Automate operations to reduce costs and improve customer experience"
    }
  ];

  const revenueData = [
    { month: "Jan", occupancy: 75, revenue: 28000, expenses: 12000 },
    { month: "Feb", occupancy: 78, revenue: 29200, expenses: 12500 },
    { month: "Mar", occupancy: 82, revenue: 30700, expenses: 13000 },
    { month: "Apr", occupancy: 85, revenue: 31800, expenses: 13200 },
    { month: "May", occupancy: 88, revenue: 33000, expenses: 13500 },
    { month: "Jun", occupancy: 92, revenue: 34400, expenses: 14000 }
  ];

  const facilityGrowthData = [
    { phase: "Phase 1", units: 200, sqft: 20000, monthlyRevenue: 30000 },
    { phase: "Phase 2", units: 350, sqft: 35000, monthlyRevenue: 52500 },
    { phase: "Phase 3", units: 500, sqft: 50000, monthlyRevenue: 75000 },
    { phase: "Phase 4", units: 750, sqft: 75000, monthlyRevenue: 112500 }
  ];

  const storageComparison = [
    {
      type: "Climate Controlled",
      size: "5x5 to 10x30",
      avgRate: "$1.50-3.00/sq ft",
      occupancy: "85-95%"
    },
    {
      type: "Standard Indoor", 
      size: "5x5 to 10x30",
      avgRate: "$0.75-1.50/sq ft",
      occupancy: "80-90%"
    },
    {
      type: "Drive-Up Units",
      size: "10x10 to 12x40",
      avgRate: "$0.60-1.25/sq ft",
      occupancy: "75-85%"
    },
    {
      type: "Vehicle Storage",
      size: "10x20 to 14x40",
      avgRate: "$75-200/month",
      occupancy: "70-80%"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Facility Development",
      description: "Build new self-storage facilities or expand existing ones",
      examples: ["New construction", "Additional buildings", "Unit subdivisions", "Site preparation"]
    },
    {
      icon: <Warehouse className="h-8 w-8 text-primary" />,
      title: "Technology Investment",
      description: "Implement modern management and security systems",
      examples: ["Access control systems", "Security cameras", "Management software", "Mobile apps"]
    },
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      title: "Security Upgrades",
      description: "Enhance facility security to protect customer belongings",
      examples: ["Surveillance systems", "Gate automation", "Individual unit alarms", "Lighting improvements"]
    },
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "Operational Improvements",
      description: "Upgrade facilities and operations for better customer experience",
      examples: ["Climate control systems", "Facility maintenance", "Office improvements", "Customer amenities"]
    }
  ];

  const requirements = [
    "Self-storage facility operating for 12+ months",
    "Minimum 100 storage units or equivalent",
    "Monthly revenue of $20,000+",
    "Proper zoning and permits for storage facility",
    "Occupancy rate of 70%+ over 6 months",
    "Current insurance and security systems"
  ];

  const faqData = [
    {
      question: "How does self-storage business cash flow work?",
      answer: "Self-storage facilities generate monthly rental income from tenants with relatively low operating costs (typically 35-45% of revenue). Cash flow includes rent collections minus property taxes, insurance, utilities, maintenance, and debt service. The business model provides steady recurring revenue with high profit margins."
    },
    {
      question: "What financing options work best for self-storage facilities?",
      answer: "Commercial real estate loans are ideal for facility acquisition or construction, while equipment financing can fund security systems and technology. Business lines of credit help with operational expenses and seasonal fluctuations in occupancy."
    },
    {
      question: "Can I finance self-storage facility improvements?",
      answer: "Yes, renovation loans and equipment financing can fund climate control systems, security upgrades, technology implementations, and facility expansions. These improvements often increase rental rates and occupancy levels."
    },
    {
      question: "How do occupancy rates affect self-storage financing?",
      answer: "Lenders typically look for facilities with 70%+ occupancy rates and stable rental income. Higher occupancy rates (85%+) often qualify for better loan terms. Many facilities maintain 80-95% occupancy once established in good locations."
    },
    {
      question: "What loan amounts are available for self-storage businesses?",
      answer: "Loan amounts vary based on facility size and cash flow: $500K-2M for smaller facilities (100-300 units), $2M-10M for larger facilities (500+ units), and $10M+ for major developments or portfolios."
    }
  ];

  const businessModelSection = {
    title: "Understanding Self-Storage Business Models",
    description: "Self-storage facilities provide rental storage space to consumers and businesses. The business model generates recurring monthly revenue with relatively low operating costs, making it an attractive real estate investment with predictable cash flows and expansion opportunities."
  };

  const cashFlowSection = {
    title: "Self-Storage Cash Flow Characteristics",
    points: [
      "Monthly rental income from storage unit tenants",
      "Low operating costs (35-45% of revenue typically)",
      "Property taxes, insurance, and basic utilities",
      "Minimal staffing requirements (often unstaffed facilities)",
      "Seasonal fluctuations in demand (moving seasons)",
      "High gross margins (55-65% profit margins common)"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Business Loans for Self-Storage Facilities | Storage Facility Financing Canada & US"
        description="Get business loans for self-storage facilities. Finance facility expansion, security upgrades, and technology improvements with specialized self-storage business funding in Canada and US."
        keywords={["self storage loans", "storage facility financing", "self storage business loans", "storage facility expansion loans", "storage business financing", "storage facility development"]}
        canonicalUrl="https://truenorthbusinessloan.ca/self-storage"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Self-Storage Business Financing
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Business Loans for
              <span className="text-secondary"> Self-Storage Facilities</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Expand your storage empire with $500K to $10M+ in specialized financing. Fund facility development, technology upgrades, and operational improvements for your self-storage business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/loan-estimator">Get My Storage Facility Quote</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8">
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Overview Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-6">
                  Self-Storage Industry Excellence
                </h2>
                <p className="text-lg text-muted-foreground mb-6 font-serif">
                  Self-storage facilities provide essential space solutions for individuals and businesses, generating steady recurring revenue with minimal operating costs. With strategic investment in expansion and technology, storage facilities can achieve exceptional profitability and long-term value appreciation.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">90%</div>
                    <div className="text-sm text-muted-foreground">Industry Occupancy</div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">65%</div>
                    <div className="text-sm text-muted-foreground">Profit Margins</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={selfStorageBusinessImage} 
                  alt="Self-storage facility business with modern storage units and security features"
                  className="w-full h-auto rounded-xl shadow-xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                {businessModelSection.title}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-serif">
                {businessModelSection.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    {cashFlowSection.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {cashFlowSection.points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground font-serif">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Revenue Chart */}
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    Occupancy Rate & Revenue Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ 
                    occupancy: { label: "Occupancy %", color: "hsl(var(--secondary))" },
                    revenue: { label: "Monthly Revenue ($)", color: "hsl(var(--primary))" }
                  }} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="occupancy" stroke="var(--color-occupancy)" strokeWidth={2} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Facility Growth Chart */}
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary text-center">
                  Facility Expansion & Revenue Scaling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ 
                  units: { label: "Storage Units", color: "hsl(var(--primary))" },
                  monthlyRevenue: { label: "Monthly Revenue ($)", color: "hsl(var(--secondary))" }
                }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facilityGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="phase" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="units" fill="var(--color-units)" />
                      <Bar dataKey="monthlyRevenue" fill="var(--color-monthlyRevenue)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Why Self-Storage Facilities Attract Investors
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Predictable cash flows and low operating costs make storage facilities attractive
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold font-sans text-primary mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground font-serif text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Storage Types Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Storage Unit Types & Market Rates
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Different storage types command different rental rates and occupancy levels
              </p>
            </div>

            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Storage Type</TableHead>
                    <TableHead className="font-semibold">Unit Sizes</TableHead>
                    <TableHead className="font-semibold">Average Rate/Sq Ft</TableHead>
                    <TableHead className="font-semibold">Typical Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell className="text-secondary font-medium">{item.avgRate}</TableCell>
                      <TableCell>{item.occupancy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Self-Storage Financing Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Strategic funding for storage facility development and operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {useCase.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold font-sans text-primary">
                    {useCase.title}
                  </CardTitle>
                  <p className="text-muted-foreground font-serif text-sm">
                    {useCase.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-secondary mr-2 flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Self-Storage Loan Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Qualification criteria for self-storage facility financing
              </p>
            </div>
            
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  Self-Storage Business Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground font-serif">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Self-Storage Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about business loans for self-storage facilities
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                      <span className="font-semibold text-primary">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-muted-foreground font-serif leading-relaxed pl-8">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
            Ready to Expand Your Storage Empire?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Get specialized financing for your self-storage facility. Fund expansion, technology upgrades, and operational improvements with competitive rates.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Storage Facility Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SelfStorage;