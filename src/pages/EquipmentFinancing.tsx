import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Truck, 
  Settings, 
  Calculator,
  Clock,
  Shield,
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  HelpCircle
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EquipmentFinancing = () => {
  const benefits = [
    {
      icon: <DollarSign className="h-6 w-6 text-secondary" />,
      title: "Preserve Working Capital",
      description: "Keep your cash reserves for daily operations and unexpected expenses"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "Equipment as Collateral",
      description: "Lower risk for lenders means better rates and terms for you"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-secondary" />,
      title: "Tax Advantages",
      description: "Equipment purchases may qualify for Capital Cost Allowance (CCA) deductions"
    },
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Flexible Terms",
      description: "Repayment schedules that match your equipment's useful life and cash flow"
    }
  ];

  const equipmentTypes = [
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: "Vehicles & Transportation",
      examples: ["Delivery trucks", "Company cars", "Commercial vehicles", "Fleet vehicles"]
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Machinery & Manufacturing",
      examples: ["Production equipment", "CNC machines", "Industrial tools", "Processing equipment"]
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: "Technology & Office",
      examples: ["Computer systems", "Software licenses", "Office furniture", "POS systems"]
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Professional Services",
      examples: ["Medical equipment", "Laboratory tools", "Professional software", "Specialized tools"]
    }
  ];

  const requirements = [
    "Business operating for at least 6 months",
    "Minimum monthly revenue of $10,000",
    "Good credit score (typically 650+)",
    "Clear business purpose for equipment",
    "Equipment quote from vendor",
    "Financial statements (last 2 years)"
  ];

  const applicationSteps = [
    {
      step: "1",
      title: "Determine Your Needs",
      description: "Calculate exactly how much financing you need and get equipment quotes"
    },
    {
      step: "2", 
      title: "Gather Documentation",
      description: "Prepare financial statements, tax returns, and equipment specifications"
    },
    {
      step: "3",
      title: "Compare Options",
      description: "Shop around for the best rates, terms, and lender requirements"
    },
    {
      step: "4",
      title: "Submit Application",
      description: "Complete application with all required documents and equipment details"
    },
    {
      step: "5",
      title: "Get Approved & Purchase",
      description: "Once approved, purchase your equipment and start growing your business"
    }
  ];

  const faqData = [
    {
      question: "What is equipment financing?",
      answer: "Equipment financing is a type of business loan used specifically to purchase new or used machinery and equipment essential for your operations. The equipment itself typically serves as the collateral for the loan, making it easier to qualify for than some other types of financing."
    },
    {
      question: "What's the difference between an equipment loan and a lease?",
      answer: "An equipment loan is like a traditional loan where you borrow money to buy the equipment and own it outright once the loan is repaid. An equipment lease is more like a long-term rental; you make regular payments to use the equipment for a set period. At the end of the lease, you may have the option to buy it, return it, or renew the lease."
    },
    {
      question: "What kind of equipment can I finance in Canada?",
      answer: "You can finance almost any type of business-related equipment. This is especially common in capital-intensive industries and includes: Construction equipment (excavators, bulldozers), Commercial vehicles (transport trucks, delivery vans), Restaurant equipment (ovens, freezers, kitchen appliances), Manufacturing machinery, and IT hardware and office tech."
    },
    {
      question: "How do I qualify for equipment financing in Canada?",
      answer: "Qualification is often more flexible than for traditional bank loans because the equipment acts as security. Lenders will typically look at your business's time in operation, monthly revenue, and personal credit score. To see exactly what you pre-qualify for, you can use our Business Loan Estimator."
    },
    {
      question: "Can I get financing for used equipment?",
      answer: "Yes, most lenders in our network offer financing for both new and used equipment. Financing used equipment can be a great way to lower your monthly payments and conserve cash flow."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              🍁 Equipment Financing for Canadian Businesses
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Finance Your Business Equipment with 
              <span className="text-secondary"> Competitive Rates</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Get $5K to $500K to purchase vehicles, machinery, technology, and other essential business equipment. Preserve your working capital while growing your business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/loan-estimator">Get My Equipment Loan Estimate</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8">
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">$5K - $500K</div>
                <div className="text-sm text-muted-foreground">Loan Amount</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24-84 Months</div>
                <div className="text-sm text-muted-foreground">Terms Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">Same Day</div>
                <div className="text-sm text-muted-foreground">Decision</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Financing Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Why Choose Equipment Financing?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Equipment financing offers unique advantages for growing businesses
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

      {/* Equipment Types Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Types of Equipment We Finance
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              From vehicles to technology, we finance all types of business equipment
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {equipmentTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {type.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold font-sans text-primary">
                    {type.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.examples.map((example, idx) => (
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
                Qualification Requirements
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Most equipment financing approvals require the following criteria
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-secondary" />
                    Basic Requirements
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

              <Card className="border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-secondary" />
                    Typical Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-semibold text-primary mb-1">Loan Amount:</div>
                    <div className="text-muted-foreground font-serif">$5,000 - $500,000</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Interest Rates:</div>
                    <div className="text-muted-foreground font-serif">Prime + 1% to 12% (varies by credit)</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Repayment Terms:</div>
                    <div className="text-muted-foreground font-serif">24 to 84 months</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Down Payment:</div>
                    <div className="text-muted-foreground font-serif">0% to 20% (equipment dependent)</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Simple Application Process
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Get approved for equipment financing in 5 easy steps
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {applicationSteps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg mr-6 flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold font-sans text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground font-serif">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Equipment Financing FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Get answers to the most common questions about equipment financing
              </p>
            </div>
            
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqData.map(faq => ({
                  "@type": "Question",
                  "name": faq.question,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                  }
                }))
              })}
            </script>
            
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <div className="flex items-center">
                      <HelpCircle className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                      <span className="font-semibold text-primary">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground font-serif leading-relaxed">
                    {faq.answer}
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
            Ready to Finance Your Equipment?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Use our Business Loan Estimator to see your equipment financing options and get matched with the right lenders
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="secondary" className="text-lg px-8">
              <Link to="/loan-estimator">
                <Users className="h-5 w-5 mr-2" />
                Check My Equipment Loan Options
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/blog">
                Learn More About Equipment Financing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EquipmentFinancing;