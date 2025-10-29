import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Parkway</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/login" className="text-gray-500 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find & Rent Driveways
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              The easiest way to find parking or earn money from your driveway
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn bg-white text-primary-600 hover:bg-gray-100">
                Get Started
              </Link>
              <Link href="/about" className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Parkway Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, secure, and profitable for everyone
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find Parking</h3>
              <p className="text-gray-600">
                Search for available driveways near your destination with real-time availability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Money</h3>
              <p className="text-gray-600">
                List your unused driveway and earn passive income from parking rentals.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                All transactions are secure with instant payments and automatic refunds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who are already using Parkway
          </p>
          <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
            Start Now - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Parkway</h3>
              <p className="text-gray-400">
                The easiest way to find and rent driveways.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Drivers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/find-parking">Find Parking</Link></li>
                <li><Link href="/how-it-works">How It Works</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Owners</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/list-driveway">List Your Driveway</Link></li>
                <li><Link href="/earnings">Earnings</Link></li>
                <li><Link href="/host-guide">Host Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Parkway. All rights reserved. Built with ❤️ for FREE.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
