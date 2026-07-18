import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, DollarSign, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const Compare = () => {
  const comparisonData = [
    {
      feature: "Approval Time",
      us: "24-48 hours",
      banks: "2-8 weeks",
      usIcon: <Clock className="h-5 w-5 text-success" />,
      bankIcon: <Clock className="h-5 w-5 text-destructive" />
    },
    {
      feature: "Credit Requirements",
      us: "550+ credit score",
      banks: "700+ credit score",
      usIcon: <Check className="h-5 w-5 text-success" />,
      bankIcon: <X className="h-5 w-5 text-destructive" />
    },
    {
      feature: "Documentation",
      us: "Minimal paperwork",
      banks: "Extensive documentation",
      usIcon: <FileText className="h-5 w-5 text-success" />,
      bankIcon: <FileText className="h-5 w-5 text-destructive" />
    },
    {
      feature: "Loan Amounts",
      us: "$5K - $5M available",
      banks: "Limited small amounts",
      usIcon: <DollarSign className="h-5 w-5 text-success" />,
      bankIcon: <DollarSign className="h-5 w-5 text-destructive" />
    },
    {
      feature: "Personal Service",
      us: "Dedicated loan specialist",
      banks: "Automated process",
      usIcon: <Users className="h-5 w-5 text-success" />,
      bankIcon: <Users className="h-5 w-5 text-destructive" />
    },
    {
      feature: "Flexible Terms",
      us: "Customized solutions",
      banks: "Rigid requirements",
      usIcon: <Check className="h-5 w-5 text-success" />,
      bankIcon: <X className="h-5 w-5 text-destructive" />
    }
  ];

  const benefits = [
    {
      title: "Faster Funding",
      description: "Get approved and funded in 24-48 hours vs weeks with banks",
      icon: <Clock className="h-8 w-8 text-primary" />
    },
    {
      title: "Lower Credit Requirements",
      description: "Qualify with 550+ credit score instead of perfect credit",
      icon: <Check className="h-8 w-8 text-primary" />
    },
    {
      title: "Less Paperwork",
      description: "Simple application process without mountains of documentation",
      icon: <FileText className="h-8 w-8 text-primary" />
    },
    {
      title: "Personal Service",
      description: "Work with a dedicated specialist who understands your business",
      icon: <Users className="h-8 w-8 text-primary" />
    }
  ];

  return (
    <>
      <SEOHead
        title="Banks vs Alternative Lenders | Business Loan Comparison"
        description="Compare business loan options: Banks vs Alternative Lenders. See approval times, rates, and requirements side-by-side. Choose better!"
        keywords={[
          "business loan comparison",
          "banks vs alternative lenders", 
          "loan approval comparison",
          "business financing options",
          "loan requirements",
          "fast business loan approval",
          "flexible loan requirements",
          "bank alternatives",
          "quick business funding",
          "alternative business lenders"
        ]}
        canonicalUrl="https://truenorthbusinessloan.ca/compare"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Business Loan Comparison - Banks vs Alternative Lenders",
          "description": "Compare business loan options, approval times, requirements, and terms between traditional banks and alternative lenders.",
          "url": "https://truenorthbusinessloan.ca/compare"
        }}
      />
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
                Banks Taking Too Long? <span className="text-secondary">Compare Your Options</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
                See exactly why thousands of Canadian businesses choose alternative lenders over banks: 24-48hr approval, lower credit requirements, and flexible terms that actually work for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="cta" asChild className="shadow-lg hover:shadow-xl transition-all">
                  <Link to="/loan-estimator">Skip the Bank - Apply Now →</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-2 hover:bg-primary hover:text-primary-foreground">
                  <Link to="/how-it-works">See Why We're Better</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                  Side-by-Side Comparison
                </h2>
                <p className="text-xl text-muted-foreground font-serif">
                  See exactly how we stack up against traditional banks
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Header */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div></div>
                    <Card className="bg-primary text-primary-foreground">
                      <CardHeader className="text-center py-6">
                        <CardTitle className="text-2xl">True North Business Loan</CardTitle>
                        <Badge variant="secondary" className="mx-auto">Better Choice</Badge>
                      </CardHeader>
                    </Card>
                    <Card className="bg-muted">
                      <CardHeader className="text-center py-6">
                        <CardTitle className="text-2xl">Traditional Banks</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Comparison Rows */}
                  {comparisonData.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 mb-4">
                      <Card className="flex items-center justify-center">
                        <CardContent className="py-4">
                          <h3 className="font-semibold text-center">{item.feature}</h3>
                        </CardContent>
                      </Card>
                      <Card className="bg-success/10 border-success/20">
                        <CardContent className="py-4 flex items-center justify-center gap-2">
                          {item.usIcon}
                          <span className="font-medium">{item.us}</span>
                        </CardContent>
                      </Card>
                      <Card className="bg-destructive/10 border-destructive/20">
                        <CardContent className="py-4 flex items-center justify-center gap-2">
                          {item.bankIcon}
                          <span className="font-medium">{item.banks}</span>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                  The True North Advantage
                </h2>
                <p className="text-xl text-muted-foreground font-serif">
                  Here's what makes us the better choice for your business
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="p-6 border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">{benefit.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold font-sans text-primary mb-2">{benefit.title}</h3>
                        <p className="text-muted-foreground font-serif">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Real Stories Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                  Real Stories from Real Businesses
                </h2>
                <p className="text-xl text-muted-foreground font-serif">
                  See why businesses switched from banks to True North
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6 border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-500">
                        {"★".repeat(5)}
                      </div>
                    </div>
                    <blockquote className="text-lg italic font-serif">
                      "The bank wanted me to wait 6 weeks and provide endless paperwork. 
                      True North approved me in 2 days with minimal documentation. 
                      I was able to purchase the equipment I needed immediately."
                    </blockquote>
                    <footer className="font-semibold font-sans">
                      - Sarah M., Manufacturing Business Owner
                    </footer>
                  </CardContent>
                </Card>

                <Card className="p-6 border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex text-yellow-500">
                        {"★".repeat(5)}
                      </div>
                    </div>
                    <blockquote className="text-lg italic font-serif">
                      "My credit wasn't perfect, and every bank turned me down. 
                      True North looked at my business potential, not just my credit score. 
                      They gave me the funding to grow my restaurant."
                    </blockquote>
                    <footer className="font-semibold font-sans">
                      - Mike R., Restaurant Owner
                    </footer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
              Ready to Experience the Difference?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
              Don't wait weeks for a bank decision. Get your business loan quote in minutes 
              and funding in 24-48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/loan-estimator">Get Your Free Quote</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-black hover:bg-primary-foreground hover:text-black focus:text-black active:text-black" asChild>
                <Link to="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Compare;