import Footer from '@/components/Footer';
import { ArrowLeft, Shield, Lock, Eye, Globe } from 'lucide-react';
import Link from 'next/link';

const PrivacyPolicy = () => {
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
          <Shield className="w-8 h-8 text-green-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-blue-200 bg-clip-text text-transparent">
            Privacy Policy
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
              RL.TCG (we, our, or us) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our digital trading card platform.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Eye className="w-6 h-6 text-blue-400" />
                <span>1. Information We Collect</span>
              </h2>
              
              <h3 className="text-xl font-medium text-green-200 mb-3">Personal Information</h3>
              <p className="text-gray-300 leading-relaxed mb-3">When you create an account, we collect:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>Email address (via Google OAuth)</li>
                <li>Username</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-medium text-green-200 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Gameplay statistics and card collection data</li>
                <li>Time and date of visits</li>
                <li>Pages viewed and features used</li>
              </ul>

              <h3 className="text-xl font-medium text-green-200 mb-3">Cookies and Tracking Technologies</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Essential cookies for authentication and preferences</li>
                <li>Analytics cookies to improve our Service</li>
                <li>No third-party advertising cookies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Lock className="w-6 h-6 text-blue-400" />
                <span>2. How We Use Your Information</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Provide and maintain the RL.TCG service</li>
                <li>Process your card pack openings and credit transactions</li>
                <li>Track your collection and gameplay progress</li>
                <li>Send important service notifications</li>
                <li>Improve our platform and user experience</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Globe className="w-6 h-6 text-blue-400" />
                <span>3. Information Sharing</span>
              </h2>
              
              <div className="bg-green-900/20 border border-green-400/20 rounded-lg p-4 mb-4">
                <h3 className="text-xl font-medium text-green-200 mb-3">We Do Not Sell Your Data</h3>
                <p className="text-gray-300 leading-relaxed">
                  We never sell, rent, or trade your personal information to third parties.
                </p>
              </div>

              <h3 className="text-xl font-medium text-green-200 mb-3">Limited Sharing</h3>
              <p className="text-gray-300 leading-relaxed mb-3">We may share information only when:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li><strong>Service Providers:</strong> With trusted vendors who help operate our platform</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                <li><strong>User Consent:</strong> When you explicitly authorize sharing</li>
              </ul>

              <h3 className="text-xl font-medium text-green-200 mb-3">Third-Party Services</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Google OAuth:</strong> For secure authentication</li>
                <li><strong>Analytics Providers:</strong> For platform improvement (anonymized data only)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-400" />
                <span>4. Data Security</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication systems</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data by authorized personnel only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">5.</span>
                <span>Your Rights and Choices</span>
              </h2>
              
              <h3 className="text-xl font-medium text-green-200 mb-3">Access and Control</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>View and update your profile information</li>
                <li>Download your personal data</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
              </ul>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-900/20 border border-blue-400/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-200 mb-3">GDPR Rights (EU Users)</h3>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    <li>Right to access your personal data</li>
                    <li>Right to rectification of incorrect data</li>
                    <li>Right to erasure (right to be forgotten)</li>
                    <li>Right to data portability</li>
                    <li>Right to object to processing</li>
                  </ul>
                </div>
                
                <div className="bg-purple-900/20 border border-purple-400/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-200 mb-3">CCPA Rights (California Users)</h3>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    <li>Right to know what information is collected</li>
                    <li>Right to delete personal information</li>
                    <li>Right to opt-out of sale (we do not sell data)</li>
                    <li>Right to non-discrimination</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">6.</span>
                <span>Children's Privacy</span>
              </h2>
              <div className="bg-yellow-900/20 border border-yellow-400/20 rounded-lg p-4">
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>RL.TCG is not intended for children under 13</li>
                  <li>We do not knowingly collect information from children under 13</li>
                  <li>If we learn we have collected such information, we will delete it promptly</li>
                  <li>Users aged 13-17 should have parental consent</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="text-blue-400">7.</span>
                <span>Contact Us</span>
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                For privacy-related questions or to exercise your rights:
              </p>
              <div className="bg-black/30 border border-white/10 rounded-lg p-4 mb-4">
                <ul className="list-none text-gray-300 space-y-2">
                  <li><strong>Email:</strong> support@pdfdino.com</li>
                  <li><strong>Twitter:</strong> <a href="https://twitter.com/axenieady" className="text-blue-400 hover:text-blue-300">@axenieady</a></li>
                </ul>
              </div>
              
              <h3 className="text-xl font-medium text-green-200 mb-3">Response Times</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>General inquiries: Within 5 business days</li>
                <li>Data subject requests: Within 30 days</li>
                <li>Urgent security matters: Within 24 hours</li>
              </ul>
            </section>

            <div className="border-t border-white/10 pt-6 mt-8">
              <p className="text-center text-gray-400 italic">
                Your privacy matters to us. Thank you for trusting RL.TCG with your information.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;