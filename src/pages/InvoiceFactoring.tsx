import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  FileText, 
  Clock, 
  Users,
  TrendingUp,
  DollarSign,
  Calculator,
  Building,
  Truck,
  Shield,
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
import SEOHead from "@/components/SEOHead";

const InvoiceFactoring = () => {
  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Immediate Cash Flow",
      description: "Convert outstanding invoices into immediate working capital"
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary" />,
      title: "No Debt Created",
      description: "Factoring is a sale, not a loan - no debt added to your balance sheet"
    },
    {
      icon: <Users className="h-6 w-6 text-secondary" />,
      title: "Credit Collection",
      description: "Factor handles collection, reducing your administrative burden"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-secondary" />,
      title: "Scalable Funding",
      description: "Funding grows with your business - more invoices = more cash"
    }
  ];

  const requirements = [
    "Business operating for at least 6 months",
    "B2B invoices with net 30-90 day terms",
    "Creditworthy customers (your customers' credit matters)",
    "Monthly invoice volume of $10,000+",
    "Clean invoicing process",
    "No significant customer concentration (typically <20%)"
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Submit Invoices",
      description: "Submit your outstanding B2B invoices for approval"
    },
    {
      step: "2",
      title: "Credit Check",
      description: "Factor reviews your customers' creditworthiness"
    },
    {
      step: "3",
      title: "Receive Advance",
      description: "Get 80-95% of invoice value within 24 hours"
    },
    {
      step: "4",
      title: "Customer Pays",
      description: "Your customer pays the factor directly when invoice is due"
    },
    {
      step: "5",
      title: "Receive Balance",
      description: "Get remaining balance minus factoring fee when invoice is paid"
    }
  ];

  const idealBusinesses = [
    {
      type: "Manufacturing",
      description: "Manufacturers with long production cycles and extended payment terms",
      challenges: ["Cash flow gaps", "Raw material purchases", "Payroll needs", "Equipment maintenance"]
    },
    {
      type: "Trucking & Logistics",
      description: "Transportation companies with 30-60 day payment cycles",
      challenges: ["Fuel costs", "Equipment maintenance", "Driver payments", "Insurance premiums"]
    },
    {
      type: "Staffing Agencies",
      description: "Temporary staffing with weekly payroll and monthly client payments",
      challenges: ["Weekly payroll", "Payroll taxes", "Worker compensation", "Office expenses"]
    },
    {
      type: "Professional Services",
      description: "B2B service providers with project-based billing",
      challenges: ["Project expenses", "Employee salaries", "Office overhead", "Growth investments"]
    }
  ];

  const factorTypes = [
    {
      title: "Recourse Factoring",
      description: "Lower cost option where you remain responsible if customer doesn't pay",
      rate: "1-3%",
      advance: "80-90%"
    },
    {
      title: "Non-Recourse Factoring",
      description: "Higher cost but factor assumes credit risk of customer non-payment",
      rate: "2-5%",
      advance: "75-85%"
    },
    {
      title: "Spot Factoring",
      description: "Factor individual invoices as needed without ongoing commitment",
      rate: "2-6%",
      advance: "70-85%"
    }
  ];

  const faqData = [
    {
      question: "What is invoice factoring?",
      answer: "Invoice factoring is a financial service where a business sells its outstanding invoices to a third-party company (called a factor) at a discount. The factor provides immediate cash (typically 80-95% of the invoice value) and collects payment directly from your customers when the invoice is due."
    },
    {
      question: "How is factoring different from a loan?",
      answer: "Factoring is the sale of an asset (your invoices), not borrowing money. This means it doesn't create debt on your balance sheet and doesn't require fixed monthly payments. Approval is based more on your customers' creditworthiness than your own credit score."
    },
    {
      question: "What types of businesses benefit most from invoice factoring?",
      answer: "B2B businesses with extended payment terms (30-90 days) benefit most, including manufacturers, trucking companies, staffing agencies, and professional service providers. Any business that invoices other businesses and waits for payment can potentially use factoring."
    },
    {
      question: "How quickly can I get my money?",
      answer: "Once approved, most factors can provide funding within 24 hours of submitting your invoices. The initial setup and approval process typically takes 1-3 business days."
    },
    {
      question: "What happens if my customer doesn't pay?",
      answer: "This depends on whether you choose recourse or non-recourse factoring. With recourse factoring (lower cost), you're responsible if the customer doesn't pay. With non-recourse factoring (higher cost), the factor assumes the credit risk."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Invoice Factoring | Get 80-95% Cash in 24hrs Canada"
        description="Convert invoices to cash in 24hrs! Get 80-95% of invoice value immediately. No debt, flexible funding grows with your business."
        keywords={[
          "invoice factoring canada",
          "accounts receivable factoring",
          "cash flow solutions",
          "B2B financing",
          "invoice financing",
          "immediate cash flow",
          "working capital factoring",
          "receivables financing",
          "business cash flow problems",
          "invoice cash advance"
        ]}
        canonicalUrl="https://truenorthbusinessloan.ca/invoice-factoring"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": "Invoice Factoring - True North Business Loan", 
          "description": "Convert your outstanding invoices into immediate cash flow. Get 80-95% of invoice value within 24 hours.",
          "provider": {
            "@type": "Organization",
            "name": "True North Business Loan",
            "url": "https://truenorthbusinessloan.ca"
          },
          "offers": {
            "@type": "Offer",
            "description": "Invoice factoring with 80-95% advance rates and 24-hour funding"
          }
        }}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              Invoice Factoring for Your Business
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Turn Invoices into 
              <span className="text-secondary">Cash in 24 Hours</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Solve cash flow problems instantly! Get 80-95% of your invoice value in 24 hours. No debt on your balance sheet. Perfect for B2B businesses waiting 30-90 days for payment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                <Link to="/loan-estimator">Get Cash in 24 Hours →</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8 border-2 hover:bg-primary hover:text-primary-foreground">
                <Link to="/how-it-works">See How Factoring Works</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">80-95%</div>
                <div className="text-sm text-muted-foreground">Advance Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24 Hours</div>
                <div className="text-sm text-muted-foreground">Funding Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">1-5%</div>
                <div className="text-sm text-muted-foreground">Factor Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">No Limits</div>
                <div className="text-sm text-muted-foreground">Invoice Amount</div>
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
              Why Choose Invoice Factoring?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Invoice factoring provides immediate cash flow without taking on debt
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

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              How Invoice Factoring Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              A simple 5-step process to convert your invoices into immediate cash
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {howItWorks.map((step, index) => (
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

      {/* Types of Factoring Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Types of Invoice Factoring
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Choose the factoring option that best fits your business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {factorTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold font-sans text-primary">
                    {type.title}
                  </CardTitle>
                  <p className="text-muted-foreground font-serif">
                    {type.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-primary">Factor Rate:</span>
                    <span className="text-muted-foreground font-serif">{type.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-primary">Advance Rate:</span>
                    <span className="text-muted-foreground font-serif">{type.advance}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal Businesses Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Perfect for These Industries
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Invoice factoring works best for B2B businesses with extended payment terms
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {idealBusinesses.map((business, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center mb-3">
                    {business.type === "Manufacturing" && <Building className="h-8 w-8 text-primary mr-3" />}
                    {business.type === "Trucking & Logistics" && <Truck className="h-8 w-8 text-primary mr-3" />}
                    {business.type === "Staffing Agencies" && <Users className="h-8 w-8 text-primary mr-3" />}
                    {business.type === "Professional Services" && <FileText className="h-8 w-8 text-primary mr-3" />}
                    <CardTitle className="text-xl font-semibold font-sans text-primary">
                      {business.type}
                    </CardTitle>
                  </div>
                  <p className="text-muted-foreground font-serif">
                    {business.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <span className="font-semibold text-primary">Common Cash Flow Challenges:</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {business.challenges.map((challenge, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-secondary mr-2 flex-shrink-0" />
                        {challenge}
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
                Invoice factoring focuses on your customers' creditworthiness, not just yours
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
                    <div className="font-semibold text-primary mb-1">Advance Rate:</div>
                    <div className="text-muted-foreground font-serif">80-95% of invoice value</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Factor Rate:</div>
                    <div className="text-muted-foreground font-serif">1-5% per month</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Funding Time:</div>
                    <div className="text-muted-foreground font-serif">24 hours after approval</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary mb-1">Invoice Terms:</div>
                    <div className="text-muted-foreground font-serif">Net 30, 60, or 90 days</div>
                  </div>
                </CardContent>
              </Card>
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
                Invoice Factoring FAQ
              </h2>
              <p className="text-xl text-muted-foreground font-serif">
                Common questions about invoice factoring and how it works
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
            Turn Your Invoices Into Cash Today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Stop waiting 30-90 days for payment. Get the cash you need to grow your business now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="secondary" className="text-lg px-8">
              <Link to="/loan-estimator">
                <Clock className="h-5 w-5 mr-2" />
                Check My Factoring Options
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="text-lg px-8 border-primary-foreground text-black hover:bg-primary-foreground hover:text-black active:text-black focus:text-black">
              <Link to="/blog">
                Learn More About Invoice Factoring
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvoiceFactoring;