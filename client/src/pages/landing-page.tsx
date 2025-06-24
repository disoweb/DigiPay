import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DigiPay</h1>
                <p className="text-xs text-gray-500 -mt-1">Trusted P2P Trading</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/auth")}
                className="text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setLocation("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
              Nigeria's Leading P2P Exchange
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
              Trade USDT with
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Complete Security
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Nigeria's most trusted peer-to-peer cryptocurrency exchange. Join 25,000+ verified traders 
              using advanced smart contracts and bank-grade security for safe USDT transactions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => setLocation("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              >
                Start Trading Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl"
              >
                View Live Rates
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-500 mr-2" />
                <span>Smart Contract Protected</span>
              </div>
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-blue-500 mr-2" />
                <span>KYC Verified Traders Only</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 text-purple-500 mr-2" />
                <span>SEC Nigeria Compliant</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-2" />
                <span>24/7 Live Support</span>
              </div>
            </div>
          </div>

          {/* Live Trading Dashboard Preview */}
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Live Market Data</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700 font-medium">Best Buy Rate</p>
                            <p className="text-2xl font-bold text-green-800">₦1,582.50</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-red-700 font-medium">Best Sell Rate</p>
                            <p className="text-2xl font-bold text-red-800">₦1,578.00</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">25,847</p>
                        <p className="text-sm text-gray-600">Active Traders</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">₦2.8B</p>
                        <p className="text-sm text-gray-600">Monthly Volume</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">99.8%</p>
                        <p className="text-sm text-gray-600">Success Rate</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h4>
                    <div className="space-y-3">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white justify-between"
                        onClick={() => setLocation("/marketplace")}
                      >
                        Buy USDT
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white justify-between"
                        onClick={() => setLocation("/marketplace")}
                      >
                        Sell USDT
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-300 text-gray-700 justify-between"
                        onClick={() => setLocation("/auth")}
                      >
                        Create Account
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4 p-3 bg-white/60 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span>1,247 traders online now</span>
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Nigeria's Top Traders Choose DigiPay
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced technology meets user-friendly design for the ultimate trading experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className={`inline-flex p-4 ${feature.bg} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Start Trading in Minutes
            </h2>
            <p className="text-xl text-gray-600">
              Simple, secure, and straightforward process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create & Verify Account",
                description: "Sign up with your email and complete our streamlined KYC process. Verification typically completes within 30 minutes.",
                icon: UserCheck
              },
              {
                step: "02", 
                title: "Browse or Create Offers",
                description: "Find the perfect trading opportunity from thousands of offers, or create your own with your preferred rate and payment method.",
                icon: BarChart3
              },
              {
                step: "03",
                title: "Trade with Confidence",
                description: "Execute trades under smart contract protection. Funds are held securely in escrow until both parties confirm completion.",
                icon: Shield
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                    {step.step}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <step.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about trading on DigiPay
            </p>
          </div>
          
          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <ChevronDown 
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Nigeria's Most Trusted Exchange?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Start trading USDT safely today. Join 25,000+ verified traders who trust DigiPay 
            for secure, fast, and reliable cryptocurrency transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation("/auth")}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl"
            >
              Contact Support
              <Phone className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">DigiPay</h3>
                  <p className="text-sm text-gray-400">Nigeria's Trusted P2P Exchange</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                Leading peer-to-peer cryptocurrency exchange platform in Nigeria, 
                providing secure, fast, and reliable USDT trading services since 2023.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-gray-400">SEC Licensed & Regulated</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fees & Limits</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trading Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issue</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 DigiPay. All rights reserved. Licensed by SEC Nigeria.
              </p>
              <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Legal</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}