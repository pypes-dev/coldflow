import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coldflow - Open Source Cold Email Platform',
  description:
    'Open source cold email platform that makes all aspects of cold outbound functional, transparent, and accessible. Infrastructure setup, list creation, enrichment, AI personalization, and sequencing.',
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl mb-6">
            Open Source Cold Email That Actually Works
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop paying enterprise prices for cold email. Coldflow makes cold outbound functional,
            transparent, and accessible for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
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

      {/* Features Introduction */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            Everything You Need for Cold Outbound
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for transparency and control. No black boxes, no vendor lock-in.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-16">
          <FeatureCard
            title="Infrastructure & Domain Setup"
            description="Automated infrastructure provisioning and domain warming. Get your sending domains configured correctly from day one with proper SPF, DKIM, and DMARC records."
          />
          <FeatureCard
            title="Smart List Creation"
            description="Build targeted prospect lists with advanced filtering and segmentation. Import from multiple sources or use built-in discovery tools to find your ideal customers."
          />
          <FeatureCard
            title="Data Enrichment"
            description="Enrich your contacts with verified email addresses, phone numbers, company data, and social profiles. Integrate with leading data providers or use your own sources."
          />
          <FeatureCard
            title="AI-Powered Research"
            description="Automated prospect research that finds relevant talking points, company news, and personalization opportunities at scale. Know your prospects before you reach out."
          />
          <FeatureCard
            title="Intelligent Personalization"
            description="AI-driven personalization that writes unique, contextual emails for each prospect. Go beyond simple merge tags with genuine personalization that converts."
          />
          <FeatureCard
            title="Advanced Sequencing"
            description="Create sophisticated multi-touch campaigns with conditional logic, A/B testing, and automatic follow-ups. Control every aspect of your outreach strategy."
          />
        </div>
      </section>

      {/* Why Coldflow CTA */}
      <section className="bg-card border-y border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-8 text-center">
              Why Coldflow?
            </h2>
            <div className="space-y-6 mb-10">
              <div>
                <p className="text-lg">
                  <strong className="font-semibold">Functional.</strong> Every feature you need to
                  run successful cold email campaigns, from infrastructure to inbox.
                </p>
              </div>
              <div>
                <p className="text-lg">
                  <strong className="font-semibold">Transparent.</strong> Full visibility into your
                  data, deliverability, and performance. No black boxes or hidden algorithms.
                </p>
              </div>
              <div>
                <p className="text-lg">
                  <strong className="font-semibold">Accessible.</strong> Open source and
                  self-hostable. Own your infrastructure, control your costs, customize everything.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start Your First Campaign
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Read the Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Sections */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 max-w-6xl mx-auto">
          {/* Built for Developers */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Built for Developers</h2>
            <p className="text-muted-foreground">
              Coldflow is built with modern technologies and designed to be extended. Use our REST
              API, webhooks, and plugin system to integrate with your existing tools or build custom
              workflows.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>RESTful API with comprehensive documentation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>Webhook events for real-time integrations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>Plugin architecture for custom functionality</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>Docker deployment for easy self-hosting</span>
              </li>
            </ul>
            <div className="pt-4">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View Documentation
              </Link>
            </div>
          </div>

          {/* Open Source & Community Driven */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Open Source & Community Driven</h2>
            <p className="text-muted-foreground">
              We believe cold email software shouldn't be a black box. Coldflow is completely open
              source, giving you full control over your outreach infrastructure and the freedom to
              customize everything.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>100% open source code on GitHub</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>Active community and regular updates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>Self-host or use our managed service</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">"</span>
                <span>Contribute and shape the roadmap</span>
              </li>
            </ul>
            <div className="pt-4">
              <Link
                href="https://github.com/pypes-dev/coldflow"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Star on GitHub
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
              Ready to Transform Your Cold Outbound?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join developers and sales teams who are taking control of their cold email
              infrastructure. Get started in minutes with our Docker deployment or sign up for our
              managed service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started Now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
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
