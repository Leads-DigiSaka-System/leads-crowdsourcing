import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const BRAND_PRIMARY = "#3E63DD"
const NEUTRAL_BG = "#F6F8FF"
const TEXT_COLOR = "#111827"

const DEFAULT_FROM = process.env.APP_EMAIL_SENDER || "IMPACT R&D <support@impactofresearch.fund>"



function getLogoHtml() {
  // Logo removed by request — use plain text heading instead
  return `<div style="font-weight:700;color:${TEXT_COLOR};font-size:16px">ResearchBayanihan</div>`
}

function otpHtml({ code, expiresMinutes, maskedEmail }) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:${NEUTRAL_BG};padding:24px;color:${TEXT_COLOR}">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,0.06);overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:12px">
        ${getLogoHtml()}
      </div>
      <div style="padding:28px 24px 8px 24px">
        <h1 style="margin:0 0 6px 0;font-size:20px;color:${TEXT_COLOR}">Verify your email</h1>
        <p style="margin:0;color:#4b5563">We sent a one-time code to <strong>${maskedEmail}</strong>. Enter this code in the app to complete verification.</p>
        <div style="margin:20px 0;padding:16px 20px;background:${BRAND_PRIMARY};color:white;border-radius:10px;letter-spacing:6px;font-weight:700;font-size:22px;text-align:center">${code}</div>
        <p style="margin:0;color:#4b5563">This code expires in ${expiresMinutes} minutes. If you didn't request this, you can ignore this email.</p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">
        Secured by NextAuth • ResearchBayanihan
      </div>
    </div>
  </div>`
}

export async function sendVerificationCodeEmail({ to, code, expiresMinutes = 120, maskedEmail }) {
  const from = DEFAULT_FROM
  const subject = "Your IMPACT R&D verification code"
  const html = otpHtml({ code, expiresMinutes, maskedEmail })
  
  // Add headers for better deliverability
  return resend.emails.send({ 
    from, 
    to, 
    subject, 
    html,
    headers: {
      'X-Entity-Ref-ID': `otp-${Date.now()}`, // Helps with deliverability
    }
  })
}

function donationThankYouHtml({ projectTitle, amountPhp, signature, explorerUrl }) {
  const formatted = `₱${Number(amountPhp || 0).toLocaleString()}`
  const hasSig = Boolean(signature)
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:${NEUTRAL_BG};padding:24px;color:${TEXT_COLOR}">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,0.06);overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:12px">
        ${getLogoHtml()}
      </div>
      <div style="padding:28px 24px 8px 24px">
        <h1 style="margin:0 0 8px 0;font-size:20px;color:${TEXT_COLOR}">Thank you for your donation</h1>
        <p style="margin:0 0 12px 0;color:#4b5563">We received your donation of <strong>${formatted}</strong> to <strong>${projectTitle}</strong>. Your support helps advance important research.</p>
        ${hasSig ? `
        <div style="margin:16px 0 8px 0;padding:12px 14px;background:#F9FAFB;border:1px solid #e5e7eb;border-radius:10px">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">Solana transaction signature</div>
          <code style="display:block;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#111827;word-break:break-all">${signature}</code>
        </div>
        ${explorerUrl ? `<a href="${explorerUrl}" style="display:inline-block;margin-top:10px;background:${BRAND_PRIMARY};color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">View on Solana Explorer</a>` : ''}
        ` : `
        <p style="margin:12px 0 0 0;color:#6b7280">We will email your on-chain receipt once it's finalized.</p>
        `}
        <p style="margin:12px 0 0 0;color:#4b5563">You can download your donation certificate from your dashboard — <a href="https://www.impactofresearch.fund/dashboard" style="color:${BRAND_PRIMARY};text-decoration:underline">https://www.impactofresearch.fund/dashboard</a></p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">
        Thank you for supporting open research • ResearchBayanihan
      </div>
    </div>
  </div>`
}

function solanaExplorerUrl(signature, cluster) {
  if (!signature) return null

  const c = (cluster || '').toLowerCase()
  const base = `https://explorer.solana.com/tx/${encodeURIComponent(signature)}`
  if (c === 'mainnet-beta' || c === 'mainnet') return base
  if (c === 'devnet' || c === 'testnet') return `${base}?cluster=${c}`
  return base
}

export async function sendDonationThankYouEmail({ to, projectTitle, amountPhp, signature, cluster }) {
  const from = DEFAULT_FROM
  const subject = `Thank you for donating to ${projectTitle}`
  const explorerUrl = solanaExplorerUrl(signature, cluster)
  const html = donationThankYouHtml({ projectTitle, amountPhp, signature, explorerUrl })
  
  return resend.emails.send({ 
    from, 
    to, 
    subject, 
    html,
    headers: {
      'X-Entity-Ref-ID': `donation-${Date.now()}`,
    }
  })
}

function resetPasswordHtml({ resetUrl, maskedEmail }) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:${NEUTRAL_BG};padding:24px;color:${TEXT_COLOR}">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,0.06);overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:12px">
        ${getLogoHtml()}
      </div>
      <div style="padding:28px 24px 8px 24px">
        <h1 style="margin:0 0 6px 0;font-size:20px;color:${TEXT_COLOR}">Reset your password</h1>
        <p style="margin:0;color:#4b5563">We received a request to reset the password for <strong>${maskedEmail}</strong>. Click the button below to set a new password.</p>
        <div style="margin:20px 0">
          <a href="${resetUrl}" style="display:inline-block;background:${BRAND_PRIMARY};color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:700">Reset password</a>
        </div>
        <p style="margin:0;color:#6b7280;font-size:12px">If the button doesn’t work, copy and paste this link into your browser:</p>
        <p style="margin:8px 0 0 0;color:#111827;font-size:12px;word-break:break-all"><a href="${resetUrl}" style="color:${BRAND_PRIMARY}">${resetUrl}</a></p>
        <p style="margin:12px 0 0 0;color:#6b7280;font-size:12px">This link expires in 1 hour. If you didn’t request this, you can ignore this email.</p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">
        Secured by NextAuth • ResearchBayanihan
      </div>
    </div>
  </div>`
}

export async function sendPasswordResetEmail({ to, resetUrl, maskedEmail }) {
  const from = DEFAULT_FROM
  const subject = "Reset your IMPACT R&D password"
  const html = resetPasswordHtml({ resetUrl, maskedEmail })
  return resend.emails.send({ from, to, subject, html, headers: { 'X-Entity-Ref-ID': `pwreset-${Date.now()}` } })
}