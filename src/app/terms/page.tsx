'use client';
import Footer from '@/components/Footer';
import { ArrowLeft, Scale, Shield } from 'lucide-react';
import Link from 'next/link';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative">
      {/* Header */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-8">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        
        <div className="flex items-center space-x-3 mb-8">
          <Scale className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Terms of Service
          </h1>
        </div>
        
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-2 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-300">
            <span><strong>Effective Date:</strong> July 19, 2025</span>
            <span><strong>Last Updated:</strong> July 19, 2025</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 text-lg mb-6">
              Welcome to RL.TCG (we, our, or us). These Terms of Service (Terms) govern your use of our website and digital trading card platform located at [your-domain.com] (the Service).
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">1.</span>
                <span>Acceptance of Terms</span>
              </h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing or using RL.TCG, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">2.</span>
                <span>Description of Service</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                RL.TCG is a digital trading card platform featuring Rocket League esports professionals. Users can:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Collect digital trading cards</li>
                <li>Open card packs using in-game credits</li>
                <li>Build and manage card collections</li>
                <li>Earn daily credits through gameplay</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">3.</span>
                <span>User Accounts</span>
              </h2>
              
              <h3 className="text-xl font-medium text-blue-200 mb-3">Account Creation</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
              
              <h3 className="text-xl font-medium text-blue-200 mb-3">Account Eligibility</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>You must be at least 13 years old to create an account</li>
                <li>Users under 18 must have parental consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">4.</span>
                <span>Virtual Currency and Credits</span>
              </h2>
              
              <div className="bg-yellow-900/20 border border-yellow-400/20 rounded-lg p-4 mb-4">
                <h3 className="text-xl font-medium text-yellow-200 mb-3">Credits System</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Credits are virtual currency used within RL.TCG</li>
                  <li>Credits have no monetary value and cannot be exchanged for real money</li>
                  <li>Credits cannot be transferred between users</li>
                  <li>We reserve the right to modify credit earning rates at any time</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-medium text-blue-200 mb-3">Purchases</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>All purchases of credits or packs are final</li>
                <li>Virtual items have no real-world value</li>
                <li>We do not guarantee any specific outcomes from pack openings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">5.</span>
                <span>User Conduct</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to manipulate the credit system or pack opening mechanics</li>
                <li>Harass other users or engage in inappropriate behavior</li>
                <li>Use automated tools or bots to interact with the Service</li>
                <li>Attempt to reverse engineer or hack the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">6.</span>
                <span>Limitation of Liability</span>
              </h2>
              <div className="bg-red-900/20 border border-red-400/20 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed font-medium">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-3">
                  <li>RL.TCG IS PROVIDED "AS IS" WITHOUT WARRANTIES</li>
                  <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
                  <li>OUR TOTAL LIABILITY SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID US IN THE LAST 12 MONTHS</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">7.</span>
                <span>Contact Information</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                For questions about these Terms, contact us at:
              </p>
              <ul className="list-none text-gray-300 space-y-2 ml-4">
                <li><strong>Email:</strong> support@pdfdino.com</li>
                <li><strong>Twitter:</strong> <a href="https://twitter.com/axenieady" className="text-blue-400 hover:text-blue-300">@axenieady</a></li>
              </ul>
            </section>

            <div className="border-t border-white/10 pt-6 mt-8">
              <p className="text-center text-gray-400 italic">
                Thank you for being part of the RL.TCG community!
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;