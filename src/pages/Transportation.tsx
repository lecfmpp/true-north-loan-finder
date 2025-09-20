import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  TrendingUp, 
  Truck, 
  Users,
  Clock,
  Shield,
  DollarSign,
  FileText,
  Calculator,
  Target,
  HelpCircle,
  ArrowRight,
  Fuel,
  MapPin
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
import transportationBusinessImage from "@/assets/transportation-business.webp";

const Transportation = () => {
  const benefits = [
    {
      icon: <Truck className="h-6 w-6 text-secondary" />,
      title: "Fleet Expansion",
      description: "Grow your fleet to meet increasing demand and expand service areas"
    },
    {
      icon: <Fuel className="h-6 w-6 text-secondary" />,
      title: "Fuel Cost Management",
      description: "Access working capital to manage fluctuating fuel costs"
    },
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Fast Deployment",
      description: "Quick financing to capitalize on new contracts and opportunities"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Equipment Protection",
      description: "Finance maintenance and upgrades to protect your fleet investment"
    }
  ];

  const revenueData = [
    { month: "Jan", revenue: 85000, expenses: 65000, netCashFlow: 20000 },
    { month: "Feb", revenue: 92000, expenses: 68000, netCashFlow: 24000 },
    { month: "Mar", revenue: 88000, expenses: 70000, netCashFlow: 18000 },
    { month: "Apr", revenue: 95000, expenses: 72000, netCashFlow: 23000 },
    { month: "May", revenue: 105000, expenses: 75000, netCashFlow: 30000 },
    { month: "Jun", revenue: 115000, expenses: 78000, netCashFlow: 37000 }
  ];

  const fleetGrowthData = [
    { quarter: "Q1", vehicles: 5, capacity: 100 },
    { quarter: "Q2", vehicles: 7, capacity: 140 },
    { quarter: "Q3", vehicles: 10, capacity: 200 },
    { quarter: "Q4", vehicles: 15, capacity: 300 }
  ];

  const transportationComparison = [
    {
      service: "Local Delivery",
      avgRevenue: "$5,000-15,000/month per vehicle",
      equipment: "Vans, Box Trucks",
      financing: "$25K-75K per vehicle"
    },
    {
      service: "Long-Haul Trucking", 
      avgRevenue: "$15,000-25,000/month per truck",
      equipment: "Semi-trucks, Trailers",
      financing: "$100K-200K per unit"
    },
    {
      service: "Specialized Transport",
      avgRevenue: "$20,000-40,000/month per unit",
      equipment: "Refrigerated, Flatbed",
      financing: "$150K-300K per unit"
    },
    {
      service: "Logistics Services",
      avgRevenue: "$50,000-200,000/month",
      equipment: "Warehouse, Technology",
      financing: "$100K-1M+ total"
    }
  ];

  const useCases = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Fleet Expansion",
      description: "Purchase additional vehicles to grow your transportation capacity",
      examples: ["New truck purchases", "Trailer acquisitions", "Specialized vehicles", "Fleet upgrades"]
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: "Equipment Financing",
      description: "Finance transportation equipment and technology upgrades",
      examples: ["GPS tracking systems", "Load securing equipment", "Maintenance tools", "Safety technology"]
    },
    {
      icon: <Fuel className="h-8 w-8 text-primary" />,
      title: "Working Capital",
      description: "Manage operational costs and cash flow fluctuations",
      examples: ["Fuel purchases", "Driver payroll", "Insurance premiums", "Maintenance costs"]
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Route Expansion",
      description: "Finance expansion into new markets and service areas",
      examples: ["New depot setup", "Regional expansion", "Contract fulfillment", "Market entry costs"]
    }
  ];

  const requirements = [
    "Valid transportation licenses and permits",
    "Minimum 12 months in transportation business",
    "Monthly revenue of $25,000+",
    "Good driving records for key personnel",
    "Proper insurance coverage in place",
    "Fleet maintenance records available"
  ];

  const faqData = [
    {
      question: "How does cash flow work in transportation businesses?",
      answer: "Transportation businesses typically have predictable revenue from contracts but face significant upfront costs. Cash flow includes revenue from deliveries/services, minus fuel costs (20-30%), vehicle payments, insurance, driver wages, and maintenance. Payment terms from clients can create 30-60 day gaps between service delivery and payment."
    },
    {
      question: "What financing options work best for transportation companies?",
      answer: "Equipment financing works well for vehicle purchases, while lines of credit help manage fuel costs and operational expenses. Invoice factoring can bridge payment gaps, and term loans are ideal for fleet expansion or facility upgrades."
    },
    {
      question: "Can I finance used transportation equipment?",
      answer: "Yes, many lenders finance used trucks, trailers, and transportation equipment. Used vehicle financing often requires equipment to be less than 10 years old with acceptable mileage and maintenance records."
    },
    {
      question: "How do fuel costs impact transportation business loans?",
      answer: "Fuel costs typically represent 20-30% of transportation operating expenses. Lenders consider fuel cost volatility when evaluating loan applications. Many transportation companies use fuel cards or working capital lines to manage these fluctuating costs."
    },
    {
      question: "What loan amounts are typical for transportation businesses?",
      answer: "Loan amounts vary widely: $25K-75K for delivery vans, $100K-200K for semi-trucks, and $500K+ for fleet expansion or logistics operations. Working capital lines typically range from $50K-500K based on monthly revenue."
    }
  ];

  const businessModelSection = {
    title: "Understanding Transportation Business Models",
    description: "Transportation businesses generate revenue by moving goods or people from point A to point B. Success depends on efficient route planning, vehicle utilization, fuel management, and maintaining reliable equipment to meet delivery commitments."
  };

  const cashFlowSection = {
    title: "Transportation Cash Flow Dynamics",
    points: [
      "Revenue from delivery contracts and service agreements",
      "Major expenses: fuel (20-30%), driver wages, vehicle payments",
      "Insurance costs for comprehensive fleet coverage",
      "Maintenance and repair expenses for vehicle uptime",
      "Seasonal fluctuations based on shipping demands",
      "Payment delays of 30-60 days from commercial clients"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Business Loans for Transportation Companies | Fleet Financing Canada & US"
        description="Get business loans for transportation and logistics companies. Finance fleet expansion, equipment purchases, and working capital with specialized transportation business funding in Canada and US."
        keywords={["transportation loans", "fleet financing", "truck loans", "logistics business loans", "transportation equipment financing", "commercial vehicle loans"]}
        canonicalUrl="https://truenorthbusinessloan.ca/transportation"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Transportation & Logistics Financing
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Business Loans for
              <span className="text-secondary"> Transportation Companies</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Fuel your fleet expansion with $25K to $2M+ in transportation financing. Fund new vehicles, equipment, and working capital to grow your logistics business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/loan-estimator">Get My Fleet Financing Quote</Link>
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
                  Transportation & Logistics Excellence
                </h2>
                <p className="text-lg text-muted-foreground mb-6 font-serif">
                  The transportation industry is the backbone of commerce, moving goods and materials across Canada and the US. With strategic financing, transportation companies can expand their fleets, upgrade equipment, and capture new market opportunities in this growing sector.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">7.2%</div>
                    <div className="text-sm text-muted-foreground">Annual Growth</div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-secondary mb-1">$12-35K</div>
                    <div className="text-sm text-muted-foreground">Monthly Revenue/Vehicle</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={transportationBusinessImage} 
                  alt="Transportation logistics business with modern delivery trucks and warehouse operations"
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
                    Monthly Cash Flow Pattern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ 
                    revenue: { label: "Revenue", color: "hsl(var(--secondary))" },
                    expenses: { label: "Expenses", color: "hsl(var(--muted))" },
                    netCashFlow: { label: "Net Cash Flow", color: "hsl(var(--primary))" }
                  }} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                        <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} />
                        <Line type="monotone" dataKey="netCashFlow" stroke="var(--color-netCashFlow)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Fleet Growth Chart */}
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary text-center">
                  Fleet Growth Impact on Revenue Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ 
                  vehicles: { label: "Number of Vehicles", color: "hsl(var(--primary))" },
                  capacity: { label: "Revenue Capacity ($K)", color: "hsl(var(--secondary))" }
                }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="vehicles" fill="var(--color-vehicles)" />
                      <Bar dataKey="capacity" fill="var(--color-capacity)" />
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
              Why Transportation Companies Need Specialized Financing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Unique challenges require tailored funding solutions
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

      {/* Transportation Services Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Transportation Service Types & Financing Needs
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Different transportation services require different financing strategies
              </p>
            </div>

            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Service Type</TableHead>
                    <TableHead className="font-semibold">Average Revenue</TableHead>
                    <TableHead className="font-semibold">Equipment Needed</TableHead>
                    <TableHead className="font-semibold">Typical Financing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportationComparison.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.service}</TableCell>
                      <TableCell>{item.avgRevenue}</TableCell>
                      <TableCell>{item.equipment}</TableCell>
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
              Transportation Financing Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Strategic funding for transportation business growth
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
                Transportation Loan Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Qualification criteria for transportation business financing
              </p>
            </div>
            
            <Card className="border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-secondary" />
                  Transportation Business Requirements
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
                Transportation Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about business loans for transportation companies
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
            Ready to Expand Your Transportation Business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Get specialized financing for your fleet. Fund vehicle purchases, equipment upgrades, and working capital with competitive rates.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/loan-estimator">
              Get My Transportation Loan Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Transportation;