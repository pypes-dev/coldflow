import Link from 'next/link'
import { Metadata } from 'next'
import { Footer } from '@/Footer/Component'

export const metadata: Metadata = {
  title: 'Coldflow - Open Source Email Marketing',
  description:
    'Open source email marketing for sales outreach, SaaS onboarding, and online education.',
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl mb-6">
            Email Marketing for Growth
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sales outreach. SaaS welcome flows. Online education. One platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="https://github.com/pypes-dev/coldflow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            More Than Just Cold Outreach
          </h2>
          <p className="text-lg text-muted-foreground">
            One platform. Multiple ways to convert and engage.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto mb-16">
          <FeatureCard
            title="Sales Outreach"
            description="Find prospects, personalize at scale, and book meetings."
          />
          <FeatureCard
            title="SaaS Onboarding"
            description="Welcome new users and convert trials into customers."
          />
          <FeatureCard
            title="Education Programs"
            description="Nurture students and drive course completion."
          />
        </div>
      </section>

      {/* Why Coldflow CTA */}
      <section className="bg-card border-y border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-8 text-center">
              Built Different
            </h2>
            <div className="space-y-6 mb-10">
              <div>
                <p className="text-lg">
                  <strong className="font-semibold">Open Source.</strong> No vendor lock-in. Self-host or use our managed service.
                </p>
              </div>
              <div>
                <p className="text-lg">
                  <strong className="font-semibold">Developer-Friendly.</strong> REST API, webhooks, and plugin architecture.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Read Docs
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="bg-card border-y border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-6">
              Start Converting More Leads
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Open source. Self-host or managed. Get started in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="https://github.com/pypes-dev/coldflow"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
