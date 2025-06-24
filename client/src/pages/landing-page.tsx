import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Clock, Users, CheckCircle, Star, ArrowRight, Zap, 
  Globe, Lock, CreditCard, BarChart3, TrendingUp, UserCheck, 
  MessageCircle, Award, DollarSign, Eye, Wallet, Plus, Minus,
  ChevronDown, PlayCircle, Building2, Smartphone, Phone
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How secure is DigiPay?",
    answer: "DigiPay uses bank-grade security with smart contract escrow protection. Your funds are held in secure escrow until both parties confirm the transaction, ensuring 100% protection against fraud."
  },
  {
    question: "What are the trading fees?",
    answer: "We charge a competitive 1% fee per completed trade. There are no hidden fees, registration costs, or monthly charges. You only pay when you successfully complete a trade."
  },
  {
    question: "How long do transactions take?",
    answer: "Most transactions are completed within 5-15 minutes. Bank transfers typically take 2-10 minutes, while mobile money transfers are almost instant."
  },
  {
    question: "What payment methods are supported?",
    answer: "We support all major Nigerian banks, mobile money (Opay, PalmPay, Kuda), and popular digital wallets. You can also trade using cash deposits at bank branches."
  },
  {
    question: "Is there a minimum trade amount?",
    answer: "Yes, the minimum trade amount is ₦1,000 (approximately $0.65). This low minimum makes trading accessible to everyone while maintaining transaction security."
  },
  {
    question: "How do I get verified?",
    answer: "Verification is simple and takes 2-5 minutes. Upload a valid ID (NIN, passport, or driver's license) and take a selfie. Most accounts are verified within 30 minutes."
  }
];

const features = [
  {
    icon: Shield,
    title: "Smart Contract Security",
    description: "Your funds are protected by automated escrow smart contracts"
  },
  {
    icon: Clock,
    title: "Instant Settlements",
    description: "Complete trades in under 15 minutes with real-time notifications"
  },
  {
    icon: Users,
    title: "25,000+ Verified Traders",
    description: "Join Nigeria's largest community of trusted USDT traders"
  },
  {
    icon: Lock,
    title: "Bank-Grade Encryption",
    description: "Military-grade encryption protects all your personal data"
  },
  {
    icon: CreditCard,
    title: "Multiple Payment Options",
    description: "Support for all banks, mobile money, and digital wallets"
  },
  {
    icon: UserCheck,
    title: "KYC Verified",
    description: "All traders undergo strict identity verification"
  }
];

const stats = [
  { label: "Active Traders", value: "25,000+", icon: Users },
  { label: "Total Volume", value: "₦2.5B+", icon: BarChart3 },
  { label: "Average Rating", value: "4.9/5", icon: Star },
  { label: "Countries", value: "12+", icon: Globe }
];

const testimonials = [
  {
    name: "Adebayo Johnson",
    role: "Lagos Trader",
    rating: 5,
    comment: "I've been using DigiPay for 8 months. Fast, secure, and reliable. The escrow system gives me complete peace of mind."
  },
  {
    name: "Sarah Okafor",
    role: "Crypto Investor",
    rating: 5,
    comment: "Best rates in Nigeria! The platform is user-friendly and customer support responds within minutes."
  },
  {
    name: "Michael Eze",
    role: "Business Owner",
    rating: 5,
    comment: "I trade over ₦500k monthly on DigiPay. Never had a single issue. Highly recommended for serious traders."
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
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">DigiPay</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => setLocation("/auth")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                Nigeria's #1 USDT Trading Platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Trade USDT with
                <span className="text-yellow-300"> Zero Risk</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl">
                Join 25,000+ verified traders using bank-grade security, instant settlements, 
                and smart contract protection. Your funds are mathematically secured.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/auth")}
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Start Trading Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span>Instant Verification</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-center">Quick Trade</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
                    <span>USDT Rate</span>
                    <span className="font-bold text-green-300">₦1,580.50</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => setLocation("/marketplace")}>
                      Buy USDT
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={() => setLocation("/marketplace")}>
                      Sell USDT
                    </Button>
                  </div>
                  <p className="text-center text-sm text-blue-200">
                    Join thousands trading safely every day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg mb-4">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose DigiPay?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the most secure, fast, and user-friendly USDT trading platform in Nigeria
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl mb-6">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Start trading in 3 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sign Up & Verify</h3>
              <p className="text-gray-600">Create your account and complete KYC verification in under 5 minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Find or Create Offers</h3>
              <p className="text-gray-600">Browse available offers or create your own with your preferred rate and payment method</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trade Safely</h3>
              <p className="text-gray-600">Complete your trade with escrow protection and instant settlement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              See what our community is saying
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about trading on DigiPay
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openFAQ === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied traders who trust DigiPay for secure USDT transactions. 
            Get started in minutes with our simple verification process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              onClick={() => setLocation("/auth")}
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Create Free Account
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
            >
              <Phone className="mr-2 h-5 w-5" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">DigiPay</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Nigeria's most trusted P2P cryptocurrency trading platform with advanced security and instant settlements.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fees</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trading Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AML Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 DigiPay. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-400">Secured by Smart Contracts</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}