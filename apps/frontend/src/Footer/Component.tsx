import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-12 gap-8 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link className="flex items-center mb-4" href="/">
              <Logo className="text-white" />
            </Link>
            <p className="text-sm text-gray-400">
              Open source cold email that&apos;s functional, transparent, and accessible.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                Documentation
              </Link>
              <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">
                Get Started
              </Link>
              <Link href="https://github.com/pypes-dev/coldflow" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                GitHub
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                API Reference
              </Link>
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                Guides
              </Link>
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                Community
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between items-center pt-8 border-t border-gray-800 gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Coldflow. Forever open source.
          </p>
          <ThemeSelector />
        </div>
      </div>
    </footer>
  )
}
