import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
const Footer = () => {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img alt="TrueNorth Business Loan" src="/lovable-uploads/327718f8-3972-44ab-9e0a-0ab928587c31.png" className="h-12 object-contain" />
            </Link>
            <p className="text-primary-foreground/80 text-sm">
              Empowering Canadian and US small businesses with simple, transparent access to financing.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <span>Helping Business to Grow</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/how-it-works" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                How It Works
              </Link>
              <Link to="/loan-estimator" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Loan Estimator
              </Link>
              <Link to="/industries-we-serve" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Industries We Serve
              </Link>
              <Link to="/compare" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Compare
              </Link>
              <Link to="/about" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                About Us
              </Link>
              <Link to="/blog" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Blog
              </Link>
              <Link to="/broker-signup" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Broker Partnership
              </Link>
            </div>
          </div>

          {/* Loan Types */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Loan Types</h3>
            <div className="space-y-2">
              <Link to="/equipment-financing" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Equipment Financing
              </Link>
              <Link to="/small-business-loans" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Small Business Loans
              </Link>
              <Link to="/merchant-cash-advance" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Merchant Cash Advance
              </Link>
              <Link to="/invoice-factoring" className="block text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors">
                Invoice Factoring
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-accent" />
                <div>
                  <div>Kitchener, Ontario</div>
                  <div className="text-primary-foreground/80">Canada</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-accent" />
                <span>info@truenorthbusinessloan.ca</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-foreground/80 text-sm">
              © 2024 True North Business Loan. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;