import type { Metadata } from 'next'
import Script from "next/script";
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
         {/* GA loader */}
         <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-CGGZ0GMVGQ"
        />

        {/* GA config */}
        <Script id="ga-setup" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CGGZ0GMVGQ');
          `}
        </Script>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'Coldflow – Open Source Cold Email Platform',
  description:
    'Coldflow is an open-source cold email platform for running transparent, self-hostable cold email campaigns with built-in deliverability tools.',
  keywords: ['cold email', 'open source email', 'outbound email', 'email marketing', 'email outreach', 'email automation', 'email sequencer', 'email personalization', 'email deliverability', 'email verification'],
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@coldflow',
  },
}