import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-light to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Where Classical Economics
                <br />
                <span className="text-primary">Meets Yield Stacking</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Tokenize rental real estate and transparently distribute real rental income,
                automatically stacked with DeFi yield on Mantle.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Key Features</h2>
              <p className="text-xl text-gray-600">
                Everything you need to tokenize and manage rental properties
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              <Card hover>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <CardTitle>Real Asset Backing</CardTitle>
                  <CardDescription>
                    Actual rental properties, not synthetic yield. Transparent and verifiable.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card hover>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <CardTitle>Transparent Accounting</CardTitle>
                  <CardDescription>
                    All cash flow tracked on-chain. Rent, expenses, and yield fully transparent.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card hover>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle>Yield Stacking</CardTitle>
                  <CardDescription>
                    Automatic DeFi integration. Earn rental yield + DeFi yield on idle funds.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card hover>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle>Institutional Logic</CardTitle>
                  <CardDescription>
                    Proper accounting with CapEx and reserves. Built for serious investors.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-xl text-gray-600">
                Simple, transparent, and automated
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Tokenize Property</h3>
                <p className="text-gray-600 text-sm max-w-[200px]">
                  Create NFT and fractional shares for your rental property
                </p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Collect Rent</h3>
                <p className="text-gray-600 text-sm max-w-[200px]">
                  Tenants deposit rent directly to the on-chain vault
                </p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Stack Yield</h3>
                <p className="text-gray-600 text-sm max-w-[200px]">
                  Idle funds automatically deposited into DeFi vaults
                </p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                  <span className="text-white font-bold text-2xl">4</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Distribute</h3>
                <p className="text-gray-600 text-sm max-w-[200px]">
                  Shareholders claim proportional yield (rental + DeFi)
                </p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                  <span className="text-white font-bold text-2xl">5</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Track</h3>
                <p className="text-gray-600 text-sm max-w-[200px]">
                  Monitor cash flow, expenses, and CapEx transparently
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Connect your wallet and start tokenizing your rental properties today.
            </p>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
