'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmailAccountModal } from '@/components/EmailAccountManagement'

export default function EmailAccountsPage() {
  const [modalOpen, setModalOpen] = useState(false)

  const handleSuccess = () => {
    // Refresh email accounts list or show success message
    console.log('Email account connected successfully!')
  }

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>
        Connect Email Account
      </Button>

      <EmailAccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}