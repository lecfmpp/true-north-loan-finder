import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp, 
  CreditCard,
  Star,
  Quote
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Home = () => {
  const trustIndicators = [
    { icon: "🍁", text: "Proudly Canadian" },
    { icon: "🔒", text: "Secure Application" },
    { icon: "⚡", text: "Fast Funding" }
  ];

  const steps = [
    {
      number: "1",
      title: "Take the Quiz",
      description: "Answer simple questions about your business in 60 seconds",
      icon: <CheckCircle className="h-8 w-8 text-secondary" />
    },
    {
      number: "2", 
      title: "See Your Score & Matches",
      description: "Get your instant Loan Readiness Score and pre-qualified lender matches",
      icon: <TrendingUp className="h-8 w-8 text-secondary" />
    },
    {
      number: "3",
      title: "Connect with Lenders", 
      description: "Choose which lenders to connect with and receive competitive offers",
      icon: <Users className="h-8 w-8 text-secondary" />
    }
  ];

  const loanCategories = [
    {
      title: "Equipment Financing",
      description: "Finance vehicles, machinery, and equipment with competitive rates",
      amount: "$5K - $500K",
      icon: <CreditCard className="h-6 w-6 text-secondary" />,
      link: "/equipment-financing"
    },
    {
      title: "Small Business Loans",
      description: "Flexible term loans for growth, inventory, and working capital",
      amount: "$10K - $800K", 
      icon: <TrendingUp className="h-6 w-6 text-secondary" />,
      link: "/small-business-loans"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      business: "Chen's Bakery, Toronto",
      quote: "The quiz was so simple, and I had three lender matches within minutes. We got our equipment loan approved in just 5 days!",
      rating: 5
    },
    {
      name: "Mike Thompson", 
      business: "Thompson Construction, Calgary",
      quote: "True North connected us with the perfect lender for our truck financing. The whole process was transparent and professional.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      business: "Digital Solutions Inc, Vancouver", 
      quote: "As a tech startup, finding the right financing was crucial. The quiz matched us with lenders who understood our business model.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              🍁 Canada's Trusted Business Loan Marketplace
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold font-sans text-primary mb-6 leading-tight">
              Find the Right Business Loan for Your 
              <span className="text-secondary"> Canadian Small Business</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              Take our 60-second quiz to see your loan options from Canada's top lenders. Get $5K to $800K.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild variant="cta" size="xl" className="text-lg px-8">
                <Link to="/quiz">Check My Loan Options</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="text-lg px-8">
                <Link to="/how-it-works">How It Works</Link>
              </Button>
            </div>
            
            {/* Trust Bar */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              {trustIndicators.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Get matched with the right lenders in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    {step.icon}
                  </div>
                  <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold font-sans text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground font-serif">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              Our Top-Rated Loan Categories
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Explore financing options tailored to your business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {loanCategories.map((category, index) => (
              <Card key={index} className="group border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      {category.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {category.amount}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold font-sans text-primary mb-3">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 font-serif">
                    {category.description}
                  </p>
                  <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Link to={category.link}>Learn More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild variant="cta" size="lg">
              <Link to="/quiz">Start Your Application Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
              What Canadian Business Owners Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
              Real stories from businesses we've helped secure funding
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-accent mb-4" />
                  <p className="text-muted-foreground mb-6 font-serif italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-semibold font-sans text-primary">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.business}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
            Ready to Find Your Perfect Loan Match?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Join thousands of Canadian businesses who've found their ideal funding through our platform
          </p>
          <Button asChild size="xl" variant="secondary" className="text-lg px-8">
            <Link to="/quiz">Take the 60-Second Quiz</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;