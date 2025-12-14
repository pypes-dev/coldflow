export type EmailProvider = 'gmail' | 'outlook' | 'imap'

export interface EmailAccount {
  id: string
  email: string
  provider: EmailProvider
  status: 'connected' | 'disconnected' | 'error'
  createdAt: string
  lastSyncedAt?: string
}

export interface ConnectGmailRequest {
  provider: 'gmail'
  credential?: string // Google OAuth credential token
}

export interface ConnectOutlookRequest {
  provider: 'outlook'
  // Outlook uses OAuth, so minimal data needed upfront
}

export interface ConnectImapRequest {
  provider: 'imap'
  email: string
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  username: string
  password: string
  useSsl: boolean
}

export type ConnectEmailAccountRequest =
  | ConnectGmailRequest
  | ConnectOutlookRequest
  | ConnectImapRequest

export interface ConnectEmailAccountResponse {
  success: boolean
  account?: EmailAccount
  error?: string
  authUrl?: string // For OAuth providers
}

export interface DisconnectEmailAccountRequest {
  accountId: string
}

export interface DisconnectEmailAccountResponse {
  success: boolean
  error?: string
}
