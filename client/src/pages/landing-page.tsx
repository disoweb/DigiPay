import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  TrendingUp, 
  Lock, 
  CheckCircle,
  Star,
  ArrowRight,
  BarChart3,
  Wallet,
  MessageCircle,
  Award
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "Your trades are secured by smart contract escrow technology on TRON blockchain",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Zap,
      title: "Instant Settlements",
      description: "Lightning-fast Naira deposits and withdrawals via Paystack integration",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Globe,
      title: "KYC Verified",
      description: "All users undergo BVN verification for maximum security and compliance",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Communicate securely with trading partners during transactions",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const stats = [
    { label: "Active Traders", value: "25,000+", icon: Users },
    { label: "Monthly Volume", value: "₦2.5B+", icon: BarChart3 },
    { label: "Success Rate", value: "99.8%", icon: TrendingUp },
    { label: "Countries", value: "1", icon: Globe }
  ];

  const testimonials = [
    {
      name: "Sarah Adebayo",
      role: "Crypto Trader",
      content: "DigiPay has revolutionized my USDT trading. The escrow system gives me complete peace of mind.",
      rating: 5,
      avatar: "SA"
    },
    {
      name: "Michael Okafor",
      role: "Business Owner",
      content: "Fast, secure, and reliable. I've completed over 200 trades without any issues.",
      rating: 5,
      avatar: "MO"
    },
    {
      name: "Fatima Hassan",
      role: "Freelancer",
      content: "The KYC verification and chat system make trading feel safe and professional.",
      rating: 5,
      avatar: "FH"
    }
  ];

  const securityFeatures = [
    "Smart Contract Escrow on TRON",
    "BVN Identity Verification",
    "Multi-signature Wallets",
    "Real-time Fraud Detection",
    "SSL Encryption",
    "24/7 Security Monitoring"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">DigiPay</h1>
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                Verified Platform
              </Badge>
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
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Trade USDT with
                <span className="block text-yellow-300">Complete Security</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Nigeria's most trusted P2P cryptocurrency trading platform. 
                Trade USDT safely with escrow protection, instant Naira settlements, and verified users.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-gray-50"
                  onClick={() => setLocation("/auth")}
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  <span>Bank-level Security</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Licensed & Regulated</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Trading Stats</h3>
                  <p className="text-gray-600">Real-time platform activity</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose DigiPay?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the most secure and efficient way to trade USDT in Nigeria
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 ${feature.bgColor} rounded-full mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Bank-Level Security Standards
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Your funds and personal information are protected by multiple layers of 
                security infrastructure and compliance protocols.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Security Certifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Award className="h-6 w-6 mr-3" />
                    <span>ISO 27001 Certified</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 mr-3" />
                    <span>SEC Compliant</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-6 w-6 mr-3" />
                    <span>PCI DSS Level 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              See what our users say about DigiPay
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of traders who trust DigiPay for their USDT transactions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-50"
              onClick={() => setLocation("/auth")}
            >
              Create Free Account
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">DigiPay</h3>
              <p className="text-gray-400">
                Nigeria's most trusted P2P cryptocurrency trading platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Trade USDT</li>
                <li>Security</li>
                <li>Fees</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Status</li>
                <li>Bug Reports</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Compliance</li>
                <li>Licenses</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DigiPay. All rights reserved. Licensed by SEC Nigeria.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}