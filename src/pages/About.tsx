import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Users, 
  Target, 
  Heart,
  Shield,
  Handshake,
  TrendingUp,
  Award
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import businessOwnerImage from "@/assets/business-owner-hero.jpg";

const About = () => {
  const values = [
    {
      icon: <Shield className="h-8 w-8 text-secondary" />,
      title: "Transparency",
      description: "We believe in complete honesty. No hidden fees, no misleading promises - just clear, straightforward information about your funding options."
    },
    {
      icon: <Heart className="h-8 w-8 text-accent" />,
      title: "Empowerment",
      description: "We put the power back in your hands. You choose which lenders to work with, when to submit your information, and how to proceed."
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: "Partnership",
      description: "We're not just a platform - we're your partner in growth. We succeed when your business succeeds, and we're here to support you every step of the way."
    },
    {
      icon: <Award className="h-8 w-8 text-secondary" />,
      title: "Excellence",
      description: "We maintain the highest standards in everything we do, from our technology platform to our lender partnerships and customer service."
    }
  ];

  const stats = [
    {
      number: "10,000+",
      label: "Businesses Helped",
      description: "Canadian small businesses connected with funding"
    },
    {
      number: "$250M+",
      label: "Funding Facilitated",
      description: "Total funding matched through our platform"
    },
    {
      number: "50+",
      label: "Lender Partners",
      description: "Vetted, reputable lenders across Canada"
    },
    {
      number: "4.9/5",
      label: "Customer Rating",
      description: "Average satisfaction score from our users"
    }
  ];

  const team = [
    {
      name: "Sarah Mitchell",
      role: "Founder & CEO",
      description: "Former small business owner with 15 years in financial services. Sarah founded True North after experiencing the frustration of traditional business lending firsthand.",
      image: "👩‍💼"
    },
    {
      name: "David Chen",
      role: "Head of Lender Relations",
      description: "20+ years in commercial lending. David built our network of trusted lender partners and ensures every relationship meets our high standards.",
      image: "👨‍💼"
    },
    {
      name: "Maria Gonzalez",
      role: "Chief Technology Officer",
      description: "Former fintech entrepreneur who developed our proprietary matching algorithm. Maria ensures our platform delivers accurate, fast results.",
      image: "👩‍💻"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold font-sans text-primary mb-6">
              About True North Business Loan
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-serif">
              We're a Canadian company dedicated to simplifying business financing and 
              empowering small businesses across the True North to achieve their growth goals.
            </p>
            <div className="flex items-center justify-center gap-2 text-2xl mb-8">
              <span>🍁</span>
              <span className="text-primary font-semibold">Proudly Canadian</span>
              <span>🍁</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground mb-6 font-serif">
                  To empower Canadian small businesses by providing simple, transparent access to financing. 
                  We believe that every business owner should have the opportunity to grow their company without 
                  the frustration and complexity of traditional lending.
                </p>
                <p className="text-lg text-muted-foreground mb-8 font-serif">
                  Founded in Kitchener, Ontario, we understand the unique challenges facing Canadian entrepreneurs. 
                  That's why we've built a platform that puts business owners in control, connecting them directly 
                  with lenders who want to help them succeed.
                </p>
                <Button asChild variant="cta" size="lg">
                  <Link to="/loan-estimator">Use the Loan Estimator</Link>
                </Button>
              </div>
              <div className="relative">
                <Card className="border-0 shadow-[var(--shadow-card)] transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <CardContent className="p-8 bg-gradient-to-br from-secondary/10 to-accent/10">
                    <div className="flex items-center mb-4">
                      <Target className="h-8 w-8 text-secondary mr-3" />
                      <h3 className="text-xl font-semibold font-sans text-primary">Our Vision</h3>
                    </div>
                    <p className="text-muted-foreground font-serif">
                      To become Canada's most trusted business financing platform, where every 
                      small business owner can easily find and secure the funding they need to grow.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Our Values
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {value.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold font-sans text-primary mb-3">
                          {value.title}
                        </h3>
                        <p className="text-muted-foreground font-serif">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Our Impact
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
                Real numbers that show the difference we're making
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="text-3xl lg:text-4xl font-bold text-secondary mb-2">
                      {stat.number}
                    </div>
                    <div className="text-lg font-semibold font-sans text-primary mb-2">
                      {stat.label}
                    </div>
                    <p className="text-sm text-muted-foreground font-serif">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-[var(--shadow-card)] overflow-hidden">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2">
                  <div className="p-8 lg:p-12">
                    <div className="flex items-center mb-6">
                      <MapPin className="h-8 w-8 text-secondary mr-3" />
                      <h2 className="text-2xl lg:text-3xl font-bold font-sans text-primary">
                        Our Location
                      </h2>
                    </div>
                    <p className="text-lg text-muted-foreground mb-6 font-serif">
                      Based in the heart of Canada's technology corridor, we're proud to call 
                      Kitchener, Ontario our home. This vibrant community of entrepreneurs and 
                      innovators inspires us every day.
                    </p>
                    <div className="space-y-3 text-muted-foreground">
                      <div className="flex items-center">
                        <strong className="text-primary mr-2">Address:</strong>
                        Kitchener, Ontario, Canada
                      </div>
                      <div className="flex items-center">
                        <strong className="text-primary mr-2">Phone:</strong>
                        1-800-TRUE-NORTH
                      </div>
                      <div className="flex items-center">
                        <strong className="text-primary mr-2">Email:</strong>
                        info@truenorthbusinessloan.ca
                      </div>
                    </div>
                  </div>
                  <div className="p-0 flex items-center justify-center">
                    <img 
                      src={businessOwnerImage} 
                      alt="Canadian business owner" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold font-sans text-primary mb-4">
                Meet Our Team
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-serif">
                The people behind True North Business Loan
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="text-center border-0 shadow-[var(--shadow-card)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="text-6xl mb-4">{member.image}</div>
                    <h3 className="text-xl font-semibold font-sans text-primary mb-2">
                      {member.name}
                    </h3>
                    <div className="text-secondary font-medium mb-4">
                      {member.role}
                    </div>
                    <p className="text-muted-foreground font-serif text-sm">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-sans mb-4">
            Ready to Join Thousands of Successful Canadian Businesses?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-serif">
            Start your journey to better business financing today
          </p>
          <Button asChild size="xl" variant="secondary" className="text-lg px-8">
            <Link to="/loan-estimator">Get Started Now</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;