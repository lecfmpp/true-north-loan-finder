import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Building2, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle,
  ArrowRight,
  Home,
  Wrench
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
import propertyManagementBusinessImage from "@/assets/property-management-business.webp";

const PropertyManagement = () => {
  const benefits = [
    {
      icon: <Building2 className="h-6 w-6 text-secondary" />,
      title: "Portfolio Growth",
      description: "Expand your property portfolio with acquisition and development financing"
    },
    {
      icon: <Wrench className="h-6 w-6 text-secondary" />,
      title: "Property Improvements",
      description: "Fund renovations and capital improvements to increase property value"
    },
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Cash Flow Management",
      description: "Bridge gaps between tenant payments and operational expenses"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Risk Mitigation",
      description: "Access capital for emergency repairs and vacancy periods"
    }
  ];

  const cashFlowData = [
    { month: "Jan", rental: 45000, expenses: 28000, netIncome: 17000 },
    { month: "Feb", rental: 47000, expenses: 30000, netIncome: 17000 },
    { month: "Mar", rental: 48000, expenses: 25000, netIncome: 23000 },
    { month: "Apr", rental: 52000, expenses: 32000, netIncome: 20000 },
    { month: "May", rental: 55000, expenses: 35000, netIncome: 20000 },
    { month: "Jun", rental: 58000, expenses: 28000, netIncome: 30000 }
  ];

  const portfolioGrowthData = [
    { year: "Year 1", units: 25, monthlyRent: 35000 },
    { year: "Year 2", units: 40, monthlyRent: 56000 },
    { year: "Year 3", units: 65, monthlyRent: 91000 },
    { year: "Year 4", units: 100, monthlyRent: 140000 }
  ];

  const propertyTypeComparison = [
    {
      type: "Residential Apartments",
      units: "20-100+ units",
      avgRent: "$800-2,500/unit",
      financing: "$500K-5M+"
    },
    {
      type: "Student Housing", 
      units: "50-300+ beds",
      avgRent: "$600-1,200/bed",
      financing: "$1M-10M+"
    },
    {
      type: "Senior Living",
      units: "30-150+ units",
      avgRent: "$2,000-5,000/unit",
      financing: "$2M-15M+"
    },
    {
      type: "Mixed-Use Properties",
      units: "10-50+ units",
      avgRent: "$1,000-3,000/unit",
      financing: "$1M-8M+"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Property Acquisition",
      description: "Purchase additional rental properties to expand your portfolio",
      examples: ["Multi-family buildings", "Apartment complexes", "Commercial properties", "Mixed-use developments"]
    },
    {
      icon: <Building2 className="h-8 w-8 text-primary" />,
      title: "Capital Improvements",
      description: "Renovate and upgrade properties to increase rental income",
      examples: ["Unit renovations", "Building upgrades", "Energy efficiency", "Amenity additions"]
    },
    {
      icon: <Home className="h-8 w-8 text-primary" />,
      title: "Tenant Improvements",
      description: "Fund improvements to attract and retain quality tenants",
      examples: ["Kitchen upgrades", "Bathroom remodels", "Flooring replacement", "HVAC systems"]
    },
    {
      icon: <Wrench className="h-8 w-8 text-primary" />,
      title: "Working Capital",
      description: "Manage operational expenses and vacancy periods",
      examples: ["Property maintenance", "Vacancy reserves", "Marketing costs", "Emergency repairs"]
    }
  ];

  const requirements = [
    "Property management business operating 18+ months",
    "Portfolio of 10+ rental units under management",
    "Monthly rental income of $25,000+",
    "Property management licenses current",
    "Tenant lease agreements and rent rolls",
    "Property maintenance and inspection records"
  ];

  const faqData = [
    {
      question: "How does property management cash flow work?",
      answer: "Property management cash flow comes from rental income minus operating expenses including maintenance, insurance, property taxes, and management fees. Cash flow is typically positive but can fluctuate due to vacancies, repairs, and seasonal factors. Most properties generate 5-15% net operating income."
    },
    {
      question: "What financing options work best for property managers?",
      answer: "Commercial real estate loans work for property acquisition, while business lines of credit help manage operational cash flow. Equipment financing can fund maintenance equipment, and renovation loans help improve properties to increase rental income."
    },
    {
      question: "Can I finance properties with existing tenants?",
      answer: "Yes, income-producing properties with existing tenants are often preferred by lenders as they demonstrate cash flow. Lenders will review rent rolls, lease agreements, and occupancy history when evaluating loan applications."
    },
    {
      question: "How do vacancy rates affect property management loans?",
      answer: "Lenders typically underwrite properties assuming 5-10% vacancy rates. Higher vacancy rates may require larger cash reserves or impact loan terms. Many property managers maintain credit lines to cover expenses during vacancy periods."
    },
    {
      question: "What loan amounts are available for property management businesses?",
      answer: "Loan amounts vary widely based on property values and cash flow: $500K-2M for small apartment buildings, $2M-10M for larger complexes, and $10M+ for major commercial properties. Working capital lines typically range from $100K-1M."
    }
  ];

  const businessModelSection = {
    title: "Understanding Property Management Business Models",
    description: "Property management businesses generate revenue by collecting rent from tenants and managing properties on behalf of owners. Success depends on maintaining high occupancy rates, controlling operating expenses, and continuously improving properties to attract quality tenants."
  };

  const cashFlowSection = {
    title: "Property Management Cash Flow Dynamics",
    points: [
      "Monthly rental income from tenants (primary revenue source)",
      "Operating expenses: maintenance, utilities, insurance, taxes",
      "Property management fees (typically 8-12% of rental income)",
      "Capital expenditures for improvements and major repairs",
      "Vacancy allowances for tenant turnover periods",
      "Seasonal fluctuations based on local rental market"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Business Loans for Multi-Unit Property Management | Real Estate Financing Canada & US"
        description="Get business loans for multi-unit property management companies. Finance property acquisitions, renovations, and working capital with specialized real estate business funding in Canada and US."
        keywords={["property management loans", "multi-unit property financing", "real estate business loans", "rental property loans", "commercial property financing", "apartment building loans"]}
        canonicalUrl="https://truenorthbusinessloan.ca/property-management"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Property Management Financing
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Business Loans for
              <span className="text-secondary"> Multi-Unit Property Management</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Grow your property portfolio with $500K to $15M+ in specialized financing. Fund acquisitions, renovations, and working capital for your property management business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/loan-estimator">Get My Property Management Quote</Link>
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
                  Multi-Unit Property Management Success
                </h2>
                <p className="text-lg text-muted-foreground mb-6 font-serif">
                  Property management businesses generate consistent cash flow through rental income while building long-term wealth through appreciation. Strategic financing enables acquisition of additional properties, renovations to increase value, and operational improvements for better tenant satisfaction.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">95%</div>
                    <div className="text-sm text-muted-foreground">Target Occupancy</div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">15-25%</div>
                    <div className="text-sm text-muted-foreground">Annual Returns</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={propertyManagementBusinessImage} 
                  alt="Multi-unit property management business with modern apartment complex and professional management"
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

            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 mb-16">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl font-semibold font-sans text-primary">
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

              {/* Cash Flow Chart */}
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl font-semibold font-sans text-primary">
                    Monthly Property Income & Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ 
                    rental: { label: "Rental Income", color: "hsl(var(--secondary))" },
                    expenses: { label: "Operating Expenses", color: "hsl(var(--muted))" },
                    netIncome: { label: "Net Operating Income", color: "hsl(var(--primary))" }
                  }} className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlowData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="rental" stroke="var(--color-rental)" strokeWidth={2} />
                        <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} />
                        <Line type="monotone" dataKey="netIncome" stroke="var(--color-netIncome)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Growth Chart */}
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold font-sans text-primary text-center">
                  Portfolio Growth & Income Scaling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ 
                  units: { label: "Number of Units", color: "hsl(var(--primary))" },
                  monthlyRent: { label: "Monthly Rental Income ($)", color: "hsl(var(--secondary))" }
                }} className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={portfolioGrowthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="units" fill="var(--color-units)" />
                      <Bar dataKey="monthlyRent" fill="var(--color-monthlyRent)" />
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
              Why Property Managers Need Specialized Financing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Real estate business challenges require tailored funding solutions
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

      {/* Property Types Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Property Types & Investment Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Different property types require different financing strategies
              </p>
            </div>

            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Property Type</TableHead>
                    <TableHead className="font-semibold">Typical Size</TableHead>
                    <TableHead className="font-semibold">Average Rent Range</TableHead>
                    <TableHead className="font-semibold">Financing Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyTypeComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>{item.units}</TableCell>
                      <TableCell>{item.avgRent}</TableCell>
                      <TableCell className="text-secondary font-medium">{item.financing}</TableCell>
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
              Property Management Financing Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Strategic funding for real estate portfolio growth and operations
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
                Property Management Loan Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Qualification criteria for property management business financing
              </p>
            </div>
            
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  Property Management Business Requirements
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
                Property Management Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about business loans for property management companies
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
            Ready to Expand Your Property Portfolio?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Get specialized financing for your property management business. Fund acquisitions, improvements, and working capital with competitive rates.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Property Management Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PropertyManagement;