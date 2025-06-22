import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, Phone, Shield, Clock, Users, CheckCircle, 
  Star, ArrowRight, Zap, Globe, Lock, CreditCard,
  BarChart3, Banknote, TrendingUp, TrendingDown, UserCheck, MessageCircle,
  Building2, Award, DollarSign, Eye, Wallet
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Military-grade encryption with smart contract escrow on TRON blockchain. Your funds are mathematically secured.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      highlight: "99.99% Secure"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant Naira deposits & withdrawals via Paystack. Complete trades in under 60 seconds.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      highlight: "< 60 Seconds"
    },
    {
      icon: UserCheck,
      title: "BVN Verified Only",
      description: "Every trader undergoes strict BVN verification. Trade only with verified, legitimate users.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      highlight: "100% Verified"
    },
    {
      icon: MessageCircle,
      title: "Secure Communication",
      description: "End-to-end encrypted chat with your trading partners. Complete transparency, zero fraud.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      highlight: "E2E Encrypted"
    }
  ];

  const stats = [
    { label: "Verified Traders", value: "25,000+", icon: Users, change: "+12% this month" },
    { label: "Monthly Volume", value: "₦2.5B+", icon: BarChart3, change: "+28% growth" },
    { label: "Success Rate", value: "99.8%", icon: TrendingUp, change: "Industry leading" },
    { label: "Zero Fraud", value: "24/7", icon: Shield, change: "Protected always" }
  ];

  const testimonials = [
    {
      name: "Sarah Adebayo",
      role: "Crypto Trader • Lagos",
      content: "I've tried other platforms but DigiPay's security is unmatched. The escrow system means I never worry about losing my money. It's like having a bank guarantee every trade.",
      rating: 5,
      avatar: "SA",
      amount: "₦15M+ traded",
      verified: true
    },
    {
      name: "Michael Okafor",
      role: "Business Owner • Abuja",
      content: "DigiPay transformed my USDT trading business. 200+ successful trades, zero issues. The instant Naira withdrawals keep my cash flow smooth.",
      rating: 5,
      avatar: "MO",
      amount: "₦32M+ traded",
      verified: true
    },
    {
      name: "Fatima Hassan",
      role: "Digital Nomad • Port Harcourt",
      content: "Finally, a platform I can trust completely. The BVN verification means no fake accounts, and the chat system makes every trade feel professional and safe.",
      rating: 5,
      avatar: "FH",
      amount: "₦8M+ traded",
      verified: true
    }
  ];

  const securityFeatures = [
    { text: "Smart Contract Escrow Protection", icon: Shield },
    { text: "BVN Identity Verification Required", icon: UserCheck },
    { text: "Multi-Signature Wallet Technology", icon: Wallet },
    { text: "Real-time Fraud Detection AI", icon: Eye },
    { text: "256-bit SSL Encryption", icon: Lock },
    { text: "24/7 Security Operations Center", icon: Clock }
  ];

  const trustIndicators = [
    { text: "SEC Nigeria Licensed", icon: Building2 },
    { text: "ISO 27001 Certified", icon: Award },
    { text: "PCI DSS Compliant", icon: Shield },
    { text: "Insured up to ₦50M", icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-primary">DigiPay</h1>
              <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800 text-xs hidden sm:inline-flex">
                SEC Licensed
              </Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/auth")} className="text-sm sm:text-base">
                Sign In
              </Button>
              <Button onClick={() => setLocation("/auth")} className="text-sm sm:text-base px-3 sm:px-4">
                Start Trading
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <section className="pt-8 sm:pt-16 pb-12 sm:pb-20 bg-gradient-to-br from-primary via-blue-600 to-purple-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Ccircle%20cx=%227%22%20cy=%227%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-white text-center lg:text-left">
              {/* Mobile-first headline */}
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4 sm:mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium">Live: 847 traders online now</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                Nigeria's Most
                <span className="block text-yellow-300">Trusted USDT</span>
                <span className="block">Trading Platform</span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Join 25,000+ verified traders using bank-grade security, instant settlements, 
                and smart contract protection. Your funds are mathematically secured.
              </p>

              {/* Buy/Sell Buttons */}
              <div className="flex flex-row gap-4 mb-6 sm:mb-8 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white text-base sm:text-lg px-8 py-3 sm:py-4 shadow-xl flex-1 sm:flex-none"
                  onClick={() => setLocation("/marketplace?tab=buy")}
                >
                  Buy USDT
                </Button>
                <Button 
                  size="lg" 
                  className="bg-red-600 hover:bg-red-700 text-white text-base sm:text-lg px-8 py-3 sm:py-4 shadow-xl flex-1 sm:flex-none"
                  onClick={() => setLocation("/marketplace?tab=sell")}
                >
                  Sell USDT
                </Button>
              </div>

              {/* Trust Indicators - Mobile Stack */}
              <div className="grid grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-6 text-sm">
                <div className="flex items-center justify-center lg:justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>SEC Licensed</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>₦50M Insured</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>99.8% Success</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Stats Card - Mobile Optimized */}
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-100">
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Live Platform Stats</h3>
                  <p className="text-sm sm:text-base text-gray-600">Real-time trading activity</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                      <stat.icon className="h-6 sm:h-8 w-6 sm:w-8 text-primary mx-auto mb-2" />
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</div>
                      <div className="text-xs text-emerald-600 font-medium">{stat.change}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 sm:mt-6 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-center text-emerald-800 text-xs sm:text-sm font-medium">
                    <Shield className="h-4 w-4 mr-2" />
                    All funds protected by smart contract escrow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Grid */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge className="mb-4 bg-primary text-white">Security First</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why 25,000+ Traders Choose DigiPay
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              The only platform with military-grade security, instant settlements, and zero fraud guarantee
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6 text-center h-full flex flex-col">
                  <div className={`inline-flex p-3 ${feature.bgColor} rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <Badge className="mb-3 text-xs" variant="secondary">{feature.highlight}</Badge>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 flex-grow">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section - Mobile Friendly */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge className="mb-4 bg-emerald-100 text-emerald-800">Bank-Level Security</Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Your Money is Safer Than in Traditional Banks
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                Every trade is protected by smart contracts on the TRON blockchain. 
                It's mathematically impossible for anyone to steal your funds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <feature.icon className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {trustIndicators.map((indicator, index) => (
                  <div key={index} className="flex items-center p-2 sm:p-3 border border-gray-200 rounded-lg">
                    <indicator.icon className="h-4 w-4 text-primary mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{indicator.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Security Guarantee</h3>
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start">
                    <Shield className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Smart Contract Protection</p>
                      <p className="text-sm text-white/80">Your funds are locked in smart contracts until trade completion</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <DollarSign className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">₦50 Million Insurance</p>
                      <p className="text-sm text-white/80">Platform covered by comprehensive insurance policy</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Award className="h-6 w-6 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Licensed & Regulated</p>
                      <p className="text-sm text-white/80">Fully compliant with SEC Nigeria regulations</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                  <p className="text-center font-bold">99.8% Success Rate</p>
                  <p className="text-center text-sm text-white/80">Over 1 million successful trades</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile Carousel Style */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-800">Customer Success</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands of Traders
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Real stories from verified DigiPay users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    {testimonial.verified && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-gray-700 mb-4 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3 text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                        <p className="text-xs text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600">{testimonial.amount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-primary via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%227%22%20cy=%227%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Badge className="mb-4 bg-white/20 text-white">Start Trading Today</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Join Nigeria's #1 USDT Trading Platform
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Start with just ₦1,000. Join 25,000+ verified traders who trust DigiPay 
            for secure USDT transactions with guaranteed protection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-50 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-xl"
              onClick={() => setLocation("/auth")}
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Start Trading - It's Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
            >
              <Phone className="mr-2 h-5 w-5" />
              Talk to Expert
            </Button>
          </div>

          <div className="text-center text-white/80 text-sm">
            <p>✅ No setup fees • ✅ Instant verification • ✅ 24/7 support</p>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-xl font-bold mb-4">DigiPay</h3>
              <p className="text-gray-400 text-sm mb-4">
                Nigeria's most trusted P2P cryptocurrency trading platform. SEC licensed and insured.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">SEC Licensed</p>
                  <p className="text-xs text-gray-400">License #DG2024-001</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Trade USDT</li>
                <li>Security Features</li>
                <li>Pricing & Fees</li>
                <li>Mobile App</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>24/7 Live Chat</li>
                <li>Help Center</li>
                <li>+234-800-DIGIPAY</li>
                <li>Security Report</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>AML/KYC Policy</li>
                <li>Insurance Coverage</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
              <p className="text-gray-400 text-sm mb-4 sm:mb-0">
                &copy; 2024 DigiPay Ltd. All rights reserved. Licensed by SEC Nigeria.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span>🔒 SSL Secured</span>
                <span>🛡️ Insured</span>
                <span>✅ Regulated</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}