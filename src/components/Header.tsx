import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  return <header className="bg-primary border-b border-primary-foreground/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img alt="TrueNorth Business Loan" src="/lovable-uploads/327718f8-3972-44ab-9e0a-0ab928587c31.png" className="w-60 h-16 object-contain p-2" />
            
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/how-it-works" className={`text-sm font-medium transition-colors hover:text-primary-foreground/80 ${isActive("/how-it-works") ? "text-primary-foreground" : "text-primary-foreground/70"}`}>
              How It Works
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground/80 transition-colors">
                Types of Loans
                <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/equipment-financing" className="w-full">
                    Equipment Financing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/small-business-loans" className="w-full">
                    Small Business Loans
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/merchant-cash-advance" className="w-full">
                    Merchant Cash Advance
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/invoice-factoring" className="w-full">
                    Invoice Factoring
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/blog" className={`text-sm font-medium transition-colors hover:text-primary-foreground/80 ${isActive("/blog") ? "text-primary-foreground" : "text-primary-foreground/70"}`}>
              Blog
            </Link>

            <Link to="/partners" className={`text-sm font-medium transition-colors hover:text-primary-foreground/80 ${isActive("/partners") ? "text-primary-foreground" : "text-primary-foreground/70"}`}>
              Partners
            </Link>

            <Link to="/about" className={`text-sm font-medium transition-colors hover:text-primary-foreground/80 ${isActive("/about") ? "text-primary-foreground" : "text-primary-foreground/70"}`}>
              About Us
            </Link>
          </nav>

          {/* Auth & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? <div className="flex items-center space-x-2">
                {isAdmin && <Button asChild variant="outline" size="sm">
                    <Link to="/admin">Admin</Link>
                  </Button>}
                <Button variant="yellow" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div> : <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm" className="bg-white text-primary border-white hover:bg-white/90 hover:text-primary">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild variant="cta" size="sm">
                  <Link to="/loan-estimator">Get My Loan Estimate</Link>
                </Button>
              </div>}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6 text-primary-foreground" /> : <Menu className="h-6 w-6 text-primary-foreground" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="md:hidden border-t border-primary-foreground/20 bg-primary">
            <nav className="py-4 space-y-4">
              <Link to="/how-it-works" className="block text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                How It Works
              </Link>
              <div className="space-y-2">
                <div className="text-sm font-medium text-primary-foreground/70">Types of Loans</div>
                <div className="pl-4 space-y-2">
                  <Link to="/equipment-financing" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Equipment Financing
                  </Link>
                  <Link to="/small-business-loans" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Small Business Loans
                  </Link>
                  <Link to="/merchant-cash-advance" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Merchant Cash Advance
                  </Link>
                  <Link to="/invoice-factoring" className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Invoice Factoring
                  </Link>
                </div>
              </div>
              <Link to="/blog" className="block text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                Blog
              </Link>
              <Link to="/partners" className="block text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                Partners
              </Link>
              <Link to="/about" className="block text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                About Us
              </Link>
              <div className="pt-4 space-y-2">
                {user ? <>
                    {isAdmin && <Button asChild variant="outline" size="lg" className="w-full">
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                          Admin Dashboard
                        </Link>
                      </Button>}
                    <div className="text-sm text-primary-foreground/70 text-center">
                      Signed in as {user.email}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </> : <>
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="cta" size="lg" className="w-full">
                      <Link to="/loan-estimator" onClick={() => setIsMenuOpen(false)}>
                        Get My Loan Quote
                      </Link>
                    </Button>
                  </>}
              </div>
            </nav>
          </div>}
      </div>
    </header>;
};
export default Header;