'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ChevronDown, 
  ChevronRight,
  Bot, 
  Database, 
  MessageSquare, 
  Globe, 
  Upload, 
  Settings, 
  Zap,
  Users,
  Shield,
  FileText,
  Link as LinkIcon,
  Check,
  ArrowRight,
  Menu,
  X,
  ArrowUp
} from 'lucide-react';
import { UseCasesSection } from '@/components/sections/UseCasesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { HeroWhoWeHelp } from '@/components/landing/HeroWhoWeHelp';
export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  const handleSignIn = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const faqs = [
    {
      question: 'Can I connect my own data?',
      answer: 'Yes! You can upload Word documents, text files, HTML, Markdown, and JSON files. You can also paste URLs to automatically index web content. All your data is securely stored and indexed into searchable knowledge bases.',
    },
    {
      question: 'Does the chatbot support multiple languages?',
      answer: 'Yes, our AI chatbot supports multiple languages. You can configure your bot to respond in any language, and it will automatically detect and respond in the user\'s preferred language based on their messages.',
    },
    {
      question: 'Can I use this for AI Hotel FAQs?',
      answer: 'Absolutely! AI Chatbot is perfect for hotels like Hayal Hotel. You can upload hotel policies, booking information, amenities details, and frequently asked questions. The bot will automatically answer guest inquiries 24/7, helping reduce front desk workload.',
    },
    {
      question: 'Can I embed the chat widget on any website?',
      answer: 'Yes, you can embed our chat widget on any website. We provide a simple JavaScript snippet that you can add to your site. The widget is fully customizable with your brand colors, positioning, and behavior settings.',
    },
    {
      question: 'How does the AI learn from my documents?',
      answer: 'Our AI automatically processes and indexes your uploaded documents, extracting key information and creating a searchable knowledge base. When users ask questions, the AI searches this knowledge base to provide accurate, context-aware answers based on your content.',
    },
    {
      question: 'What happens if the bot doesn\'t know an answer?',
      answer: 'You can configure fallback behavior for your bot. Options include: redirecting to a human agent, providing a default message, or using our API/webhooks to trigger custom actions. You can also set up handover rules to seamlessly transfer conversations to your support team.',
    },
  ];

    return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]" style={{ scrollBehavior: 'smooth' }}>
      {/* Top Strip */}
   

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-amber-600" />
              <span className="text-xl font-bold text-gray-900">AI Chatbot</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#modern-teams" onClick={(e) => handleSmoothScroll(e, 'modern-teams')} className="text-sm text-gray-700 hover:text-amber-600 transition-colors">Features</a>
              <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="text-sm text-gray-700 hover:text-amber-600 transition-colors">How it works</a>
              <a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="text-sm text-gray-700 hover:text-amber-600 transition-colors">Pricing</a>
              <a href="#faq" onClick={(e) => handleSmoothScroll(e, 'faq')} className="text-sm text-gray-700 hover:text-amber-600 transition-colors">FAQ</a>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleSignIn}
                className="text-sm text-gray-700 hover:text-amber-600 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={handleGetStarted}
                className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-full hover:bg-amber-700 transition-colors shadow-sm hover:shadow-md"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 border-t border-gray-200">
              <a href="#modern-teams" onClick={(e) => { handleSmoothScroll(e, 'modern-teams'); setMobileMenuOpen(false); }} className="block text-sm text-gray-700 hover:text-amber-600">Features</a>
              <a href="#how-it-works" onClick={(e) => { handleSmoothScroll(e, 'how-it-works'); setMobileMenuOpen(false); }} className="block text-sm text-gray-700 hover:text-amber-600">How it works</a>
              <a href="#pricing" onClick={(e) => { handleSmoothScroll(e, 'pricing'); setMobileMenuOpen(false); }} className="block text-sm text-gray-700 hover:text-amber-600">Pricing</a>
              <a href="#faq" onClick={(e) => { handleSmoothScroll(e, 'faq'); setMobileMenuOpen(false); }} className="block text-sm text-gray-700 hover:text-amber-600">FAQ</a>
              <div className="pt-4 space-y-2 border-t border-gray-200">
                <button
                  onClick={handleSignIn}
                  className="block w-full text-left text-sm text-gray-700 hover:text-amber-600"
                >
                  Sign in
                </button>
                <button
                  onClick={handleGetStarted}
                  className="w-full px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-full hover:bg-amber-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb] py-12 lg:py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Boost sales and support with an{' '}
                    <span className="text-amber-600">AI-powered chatbot</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                    Train chatbots from your docs and FAQs. Automate replies, capture leads and assist customers 24/7.
                  </p>
                </div>

                {/* Email Capture Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGetStarted();
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="email"
                    placeholder="Enter your business email"
                    required
                    className="flex-1 px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-600 text-white font-medium rounded-full hover:bg-amber-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    Get Started
                  </button>
                </form>

                {/* Trust Indicators */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm text-gray-600">
                  <span className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>No credit card required</span>
                  </span>
                </div>

                <p className="text-sm text-gray-500">
                  Built for hotels, SaaS and agencies
                </p>
              </div>

              {/* Right Column - Dashboard Preview */}
              <div className="relative mt-8 lg:mt-0">
                <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/60 overflow-hidden max-w-full">
                  {/* Dashboard Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-sm"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-700">AI Chatbot Dashboard</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="w-16"></div>
                  </div>

                  <div className="flex h-[350px] sm:h-[400px] md:h-[450px]">
                    {/* Sidebar */}
                    <div className="hidden sm:block w-40 md:w-52 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-2 md:p-3 space-y-1">
                      <div className="flex items-center space-x-2 px-3 py-2.5 bg-amber-50 rounded-lg text-amber-700 shadow-sm border border-amber-100">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs font-semibold">Bots</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <Database className="w-4 h-4" />
                        <span className="text-xs">Datasets</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">Conversations</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs">Analytics</span>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        <Settings className="w-4 h-4" />
                        <span className="text-xs">Settings</span>
                      </div>
                    </div>

                    {/* Main Panel */}
                    <div className="flex-1 p-3 sm:p-4 md:p-5 bg-white">
                      {/* Bot Header */}
                      <div className="mb-3 sm:mb-4 md:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">Hayal Hotel FAQ Bot</h3>
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                                Active
                              </span>
                              <span className="text-xs text-gray-500">1,234 conversations</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4 text-amber-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="space-y-4 mb-4 max-h-[240px] overflow-y-auto pr-2">
                        {/* Welcome Message */}
                        <div className="flex justify-start">
                          <div className="max-w-[75%]">
                            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5 border border-gray-200">
                              <p className="text-xs text-gray-700 leading-relaxed">Hello! I&apos;m the Hayal Hotel assistant. How can I help you today?</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block ml-2">2:34 PM</span>
                          </div>
                        </div>

                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="max-w-[75%]">
                            <div className="bg-amber-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                              <p className="text-xs leading-relaxed">Can I cancel my booking?</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block mr-2 text-right">2:35 PM</span>
                          </div>
                        </div>

                        {/* Bot Response */}
                        <div className="flex justify-start">
                          <div className="max-w-[75%]">
                            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5 border border-gray-200">
                              <p className="text-xs text-gray-700 leading-relaxed">Yes, up to 7 days before arrival. Cancellations made within 7 days may be subject to a fee. Would you like me to check your booking details?</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block ml-2">2:35 PM</span>
                          </div>
                        </div>

                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="max-w-[75%]">
                            <div className="bg-amber-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                              <p className="text-xs leading-relaxed">What time is check-in?</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block mr-2 text-right">2:36 PM</span>
                          </div>
                        </div>

                        {/* Bot Response */}
                        <div className="flex justify-start">
                          <div className="max-w-[75%]">
                            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-2.5 border border-gray-200">
                              <p className="text-xs text-gray-700 leading-relaxed">Standard check-in is from 2 PM. Early check-in may be available upon request, subject to room availability.</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block ml-2">2:36 PM</span>
                          </div>
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="Type a message..."
                              className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50"
                              readOnly
                            />
                          </div>
                          <button className="px-5 py-2.5 bg-amber-600 text-white text-xs font-medium rounded-xl hover:bg-amber-700 transition-colors shadow-sm flex items-center justify-center">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">AI is typing...</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Status Indicator */}
                <div className="absolute -top-3 -right-3 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-2.5 border border-white/60 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-medium text-gray-700">Live</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <HeroWhoWeHelp />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Features Section */}
        <section className="bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
            {/* Heading */}
            <div className="text-center max-w-3xl mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                Everything you need in one dashboard
              </h2>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-600">
                Four powerful pillars that keep your AI chatbot organized, secure, and always on.
              </p>
            </div>

            {/* 4 floating coins grid - Single row */}
            <div className="mt-8 sm:mt-12 flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-fit px-4 sm:px-0">
                {[
                {
                  title: "Knowledge Base",
                  icon: "📚",
                  desc: [
                    "Upload docs, and URLs.",
                    "Auto‑FAQ extraction from content.",
                    "Versioning and sync across workspaces.",
                  ],
                },
                {
                  title: "Bot Builder",
                  icon: "🤖",
                  desc: [
                    "Multiple bots per workspace.",
                    "Question → answer FAQ mappings.",
                    "Custom prompts and tone control.",
                  ],
                },
                {
                  title: "Multi‑channel",
                  icon: "💬",
                  desc: [
                    "Website widget and shareable links.",
                    "API + webhooks for custom channels.",
                    "Consistent experience across touchpoints.",
                  ],
                },
                {
                  title: "Team & Security",
                  icon: "🛡️",
                  desc: [
                    "Multi‑user workspaces with roles.",
                    "Role‑based access and audit logs.",
                    "Conversation transcript export.",
                  ],
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="relative flex flex-col items-center justify-center"
                >
                  {/* Coin with all content inside */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full
                   bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]
                    p-4 sm:p-6 md:p-8 shadow-[0_18px_40px_rgba(251,191,36,0.25)] ring-2 sm:ring-4 ring-amber-50 animate-float-4s transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(251,191,36,0.35)] flex flex-col items-center justify-center">
                    {/* Icon at top */}
                    <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                      <div className="text-2xl sm:text-3xl md:text-4xl">{item.icon}</div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 text-center mb-2 sm:mb-3 md:mb-4">
                      {item.title}
                    </h3>
                    
                    {/* Description list */}
                    <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[10px] sm:text-xs md:text-sm text-slate-700 text-center">
                      {item.desc.map((line) => (
                        <li key={line} className="text-center leading-tight sm:leading-normal">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        </section>

     

        {/* Pricing Section */}
        <PricingSection onCtaClick={handleGetStarted} />

        {/* FAQ Section */}
        <section id="faq" className="py-12 bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Questions.
              </h2>
              <a
                href="#faq"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                See More
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* FAQ List */}
            <div className="space-y-1">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-amber-300 last:border-b-0"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-0 py-6 flex items-center justify-between text-left hover:opacity-80 transition-opacity group"
                  >
                    <div className="flex items-start gap-6 flex-1">
                      <span className="text-sm font-semibold text-amber-600 tracking-wider flex-shrink-0">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <span className="text-lg font-medium text-gray-900 pr-4 flex-1">
                        {faq.question}
                      </span>
                    </div>
                    {openFaq === index ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="pl-16 pr-12 pb-6">
                      <p className="text-gray-600 leading-relaxed mb-4">{faq.answer}</p>
                      <a
                        href="#"
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
                      >
                        Read Terms
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="w-6 h-6 text-amber-400" />
                <span className="text-xl font-bold text-white">AI Chatbot</span>
              </div>
              <p className="text-sm text-gray-400 mb-4 max-w-md">
                AI-powered chatbot platform that helps businesses automate customer support and boost sales with intelligent, 24/7 assistance.
              </p>
              <p className="text-xs text-gray-500">Made for modern support teams</p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#modern-teams" className="hover:text-amber-400 transition-colors">Features</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How it works</a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-amber-400 transition-colors">Docs</a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-400 transition-colors">Privacy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-amber-400 transition-colors">Terms</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} AI Chatbot. All rights reserved.</p>
          </div>
        </div>
      </footer>

      </div>
    );
}
