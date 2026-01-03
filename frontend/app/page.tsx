import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white py-24 lg:py-32 relative overflow-hidden pattern-dots">
          {/* Decorative blobs */}
          <div className="decorative-blob blob-1"></div>
          <div className="decorative-blob blob-2"></div>
          
          <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-foreground mb-8 leading-tight tracking-tight">
                Where Classical Economics
                <br />
                <span className="font-medium bg-gradient-to-r from-primary to-[#06B6D4] bg-clip-text text-transparent">
                  Meets Yield Stacking
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                Tokenize rental real estate and transparently distribute real rental income,
                automatically stacked with DeFi yield on Mantle.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/dashboard">
                  <Button variant="primary" size="lg" className="relative overflow-hidden">
                    <span className="relative z-10">Get Started</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="text" size="lg" className="text-accent hover:text-accent-dark">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gray-50 relative pattern-grid">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
                Key Features
              </h2>
              <p className="text-lg text-gray-600 font-light">
                Everything you need to tokenize and manage rental properties
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              <Card hover elevation={1} className="card-layered relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-3xl"></div>
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                    <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <CardTitle className="relative z-10">Real Asset Backing</CardTitle>
                  <CardDescription className="relative z-10">
                    Actual rental properties, not synthetic yield. Transparent and verifiable.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card hover elevation={1} className="card-layered relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/10 to-primary/10 rounded-bl-3xl"></div>
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                    <svg className="w-7 h-7 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <CardTitle className="relative z-10">Transparent Accounting</CardTitle>
                  <CardDescription className="relative z-10">
                    All cash flow tracked on-chain. Rent, expenses, and yield fully transparent.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card hover elevation={1} className="card-layered relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-bl-3xl"></div>
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                    <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <CardTitle className="relative z-10">Yield Stacking</CardTitle>
                  <CardDescription className="relative z-10">
                    Automatic DeFi integration. Earn rental yield + DeFi yield on idle funds.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card hover elevation={1} className="card-layered relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/10 to-primary/10 rounded-bl-3xl"></div>
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                    <svg className="w-7 h-7 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h1.125A2.25 2.25 0 0118 12.75v6.75a2.25 2.25 0 01-2.25 2.25H16.5v-4.5A2.25 2.25 0 0014.25 13h-1.5A2.25 2.25 0 0110.5 15.75v4.5H6A2.25 2.25 0 013.75 18v-6.75A2.25 2.25 0 016 9h1.5a3 3 0 013-3m0 0h3a3 3 0 013 3m-3-3v1.5" />
                    </svg>
                  </div>
                  <CardTitle className="relative z-10">Institutional Logic</CardTitle>
                  <CardDescription className="relative z-10">
                    Proper accounting with CapEx and reserves. Built for serious investors.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-white relative pattern-waves overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 font-light">
                Simple, transparent, and automated
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
              <div className="text-center flex flex-col items-center relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 elevation-2 relative z-10 group-hover:elevation-3 transition-material">
                  <span className="text-white font-medium text-2xl">1</span>
                </div>
                <h3 className="font-medium text-base mb-3 text-foreground relative z-10">Tokenize Property</h3>
                <p className="text-gray-600 text-sm max-w-[200px] leading-relaxed font-light relative z-10">
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
        <section className="py-24 bg-gradient-to-br from-primary via-primary to-[#06B6D4] text-white relative overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-light mb-6 tracking-tight">Ready to Get Started?</h2>
            <p className="text-lg md:text-xl mb-10 opacity-95 font-light leading-relaxed">
              Connect your wallet and start tokenizing your rental properties today.
            </p>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-50 elevation-3 hover:elevation-4">
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
