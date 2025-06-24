import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { 
  Shield, Clock, Users, CheckCircle, Star, TrendingUp, Globe, 
  Lock, CreditCard, BarChart3, UserCheck, MessageCircle, Award, 
  DollarSign, Wallet, ChevronDown, ArrowRight, Zap, Building2,
  Phone, Mail, MapPin, ChevronRight
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How secure is DigiPay?",
    answer: "DigiPay employs military-grade encryption and smart contract escrow technology. All funds are held in secure escrow until trade completion, with multi-signature verification and real-time fraud detection."
  },
  {
    question: "What are the trading fees?",
    answer: "We charge a transparent 1% fee on completed trades only. No registration fees, no monthly charges, no hidden costs. You only pay when you successfully complete a transaction."
  },
  {
    question: "How quickly can I start trading?",
    answer: "Account creation takes 2 minutes, KYC verification completes in under 30 minutes, and you can start trading immediately after approval. Most users begin trading within an hour of signup."
  },
  {
    question: "What payment methods do you support?",
    answer: "All major Nigerian banks, mobile money platforms (Opay, PalmPay, Kuda), USSD transfers, and digital wallets. We continuously add new payment methods based on user demand."
  },
  {
    question: "What is the minimum trade amount?",
    answer: "The minimum trade is ₦1,000 (approximately $0.65 USD). This low threshold ensures accessibility while maintaining security standards and economic viability."
  },
  {
    question: "How does dispute resolution work?",
    answer: "Our automated dispute system activates if issues arise. Professional mediators review evidence within 2-4 hours. Decisions are final and enforced through smart contracts with full fund protection."
  }
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [currentRate, setCurrentRate] = useState(1583);
  const [onlineTraders, setOnlineTraders] = useState(1247);
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const heroTexts = [
    "Complete Security",
    "Complete Confidence", 
    "Complete Trust"
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // Initialize animations
  useEffect(() => {
    const rateInterval = setInterval(() => {
      setCurrentRate(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);

    const tradersInterval = setInterval(() => {
      setOnlineTraders(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 3000);

    const heroTextInterval = setInterval(() => {
      setIsTextVisible(false); // Start fade out
      setTimeout(() => {
        setHeroTextIndex(prev => (prev + 1) % heroTexts.length);
        setIsTextVisible(true); // Fade in new text
      }, 1000); // 1 second delay for fade out before changing text
    }, 5000); // Change every 5 seconds

    return () => {
      clearInterval(rateInterval);
      clearInterval(tradersInterval);
      clearInterval(heroTextInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DigiPay</h1>
                <p className="text-xs text-gray-500 -mt-1">Trusted P2P Trading</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/auth")}
                className="text-gray-700 hover:text-gray-900 hover:scale-105 transition-all duration-200"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setLocation("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-8 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
              Nigeria's Leading P2P Exchange
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-7xl font-extrabold text-gray-900 mb-4 leading-tight">
              Trade USDT with
              <span className={`block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-1000 ${isTextVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}>
                {heroTexts[heroTextIndex]}
              </span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Nigeria's most trusted peer-to-peer cryptocurrency exchange. Join 25,000+ verified traders 
              using advanced smart contracts and bank-grade security for safe USDT transactions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button 
                size="lg" 
                onClick={() => setLocation("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-xl shadow-lg w-auto hover:scale-105 hover:shadow-xl transition-all duration-300 group"
              >
                Start Trading Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 text-base font-semibold rounded-xl w-auto hover:scale-105 hover:border-blue-400 transition-all duration-300 group"
              >
                View Live Rates
                <TrendingUp className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </div>

            {/* Trust Indicators - 2x2 Grid on Mobile */}
            <div className="grid grid-cols-2 lg:flex lg:justify-center gap-4 lg:gap-8 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center justify-center lg:justify-start hover:scale-105 transition-transform duration-200">
                <Shield className="h-4 w-4 text-green-500 mr-1 sm:mr-2 animate-pulse" />
                <span>Smart Contract Protected</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start hover:scale-105 transition-transform duration-200">
                <UserCheck className="h-4 w-4 text-blue-500 mr-1 sm:mr-2" />
                <span>KYC Verified Traders Only</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start hover:scale-105 transition-transform duration-200">
                <Award className="h-4 w-4 text-purple-500 mr-1 sm:mr-2" />
                <span>SEC Nigeria Compliant</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start hover:scale-105 transition-transform duration-200">
                <Clock className="h-4 w-4 text-orange-500 mr-1 sm:mr-2" />
                <span>24/7 Live Support</span>
              </div>
            </div>
          </div>

          {/* Live Trading Dashboard Preview */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
              <CardContent className="p-4 sm:p-6">
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Live Market Data</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200 hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-green-700 font-medium">Best Buy Rate</p>
                            <p className="text-lg font-bold text-green-800 transition-all duration-500">₦{currentRate.toLocaleString()}</p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-green-600 animate-bounce" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-xl border border-red-200 hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-red-700 font-medium">Best Sell Rate</p>
                            <p className="text-lg font-bold text-red-800 transition-all duration-500">₦{(currentRate - 5).toLocaleString()}</p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-red-600 rotate-180 animate-bounce" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="hover:scale-105 transition-transform duration-200">
                        <p className="text-lg sm:text-xl font-bold text-gray-900">25,847</p>
                        <p className="text-xs text-gray-600">Active Traders</p>
                      </div>
                      <div className="hover:scale-105 transition-transform duration-200">
                        <p className="text-lg sm:text-xl font-bold text-gray-900">₦2.8B</p>
                        <p className="text-xs text-gray-600">Monthly Volume</p>
                      </div>
                      <div className="hover:scale-105 transition-transform duration-200">
                        <p className="text-lg sm:text-xl font-bold text-gray-900">99.8%</p>
                        <p className="text-xs text-gray-600">Success Rate</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white justify-between text-sm hover:scale-105 transition-all duration-200 group"
                        onClick={() => setLocation("/marketplace")}
                      >
                        Buy USDT
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white justify-between text-sm hover:scale-105 transition-all duration-200 group"
                        onClick={() => setLocation("/marketplace")}
                      >
                        Sell USDT
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-300 text-gray-700 justify-between text-sm hover:scale-105 transition-all duration-200 group"
                        onClick={() => setLocation("/auth")}
                      >
                        Create Account
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </div>
                    <div className="mt-3 p-2 bg-white/60 rounded-lg">
                      <div className="flex items-center text-xs text-gray-600">
                        <LoadingSpinner size="sm" className="mr-2 w-3 h-3" />
                        <span className="transition-all duration-500">{onlineTraders.toLocaleString()} traders online now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Nigeria's Top Traders Choose DigiPay
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Advanced technology meets user-friendly design for the ultimate trading experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Smart Contract Escrow",
                description: "Mathematical guarantee of fund safety through blockchain technology",
                color: "text-green-600",
                bg: "bg-green-50"
              },
              {
                icon: Zap,
                title: "Instant Settlements",
                description: "Complete trades in under 5 minutes with real-time processing",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: UserCheck,
                title: "Verified Community",
                description: "Trade only with KYC-verified, legitimate users for maximum safety",
                color: "text-purple-600",
                bg: "bg-purple-50"
              },
              {
                icon: CreditCard,
                title: "All Payment Methods",
                description: "Support for every major bank and digital wallet in Nigeria",
                color: "text-orange-600",
                bg: "bg-orange-50"
              },
              {
                icon: BarChart3,
                title: "Best Market Rates",
                description: "Competitive pricing with real-time rate updates and transparency",
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                icon: MessageCircle,
                title: "Secure Communications",
                description: "End-to-end encrypted chat for safe trader-to-trader communication",
                color: "text-pink-600",
                bg: "bg-pink-50"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-500 group cursor-pointer hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-700`}
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`inline-flex p-3 ${feature.bg} rounded-xl mr-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <feature.icon className={`h-6 w-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Trading in Minutes
            </h2>
            <p className="text-lg text-gray-600">
              Simple, secure, and straightforward process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create & Verify Account",
                description: "Sign up with your email and complete our streamlined KYC process. Verification typically completes within 30 minutes.",
                icon: UserCheck,
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "02", 
                title: "Browse or Create Offers",
                description: "Find the perfect trading opportunity from thousands of offers, or create your own with your preferred rate and payment method.",
                icon: BarChart3,
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "03",
                title: "Trade with Confidence",
                description: "Execute trades under smart contract protection. Funds are held securely in escrow until both parties confirm completion.",
                icon: Shield,
                color: "from-green-500 to-green-600"
              }
            ].map((step, index) => (
              <Card 
                key={index} 
                className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden cursor-pointer hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-700`}
                style={{ animationDelay: `${index * 200 + 300}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.color} text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      {step.step}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-3 w-3 text-gray-700 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm group-hover:text-gray-700 transition-colors duration-300">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about trading on DigiPay
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <Card 
                key={index} 
                className={`border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 animate-in fade-in slide-in-from-left duration-500`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <h3 className="text-base font-semibold text-gray-900 pr-4 group-hover:text-blue-600 transition-colors duration-200">{faq.question}</h3>
                    <ChevronDown 
                      className={`h-4 w-4 text-gray-500 transition-all duration-300 group-hover:text-blue-500 ${
                        openFAQ === index ? 'rotate-180 text-blue-500' : ''
                      }`} 
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                      <p className="text-gray-600 leading-relaxed pt-3 text-sm">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Nigeria's Most Trusted Exchange?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Start trading USDT safely today. Join 25,000+ verified traders who trust DigiPay 
            for secure, fast, and reliable cryptocurrency transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom duration-700 delay-500">
            <Button 
              size="lg" 
              onClick={() => setLocation("/auth")}
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 text-base font-semibold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 group"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 text-base font-semibold rounded-xl hover:scale-105 transition-all duration-300 group"
            >
              Contact Support
              <Phone className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">DigiPay</h3>
                  <p className="text-xs text-gray-400">Nigeria's Trusted P2P Exchange</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4 max-w-md text-sm">
                Leading peer-to-peer cryptocurrency exchange platform in Nigeria, 
                providing secure, fast, and reliable USDT trading services since 2023.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-green-400 mr-2" />
                  <span className="text-gray-400 text-xs">SEC Licensed & Regulated</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-base font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fees & Limits</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trading Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issue</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 text-xs">
                © 2024 DigiPay. All rights reserved. Licensed by SEC Nigeria.
              </p>
              <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-xs transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-xs transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-xs transition-colors">Legal</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}