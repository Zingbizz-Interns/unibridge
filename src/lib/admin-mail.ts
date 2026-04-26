import { sendMail } from '@/lib/mail'

type CollegeVerificationEmailStatus = 'approved' | 'rejected' | 'suspended'

export async function sendCollegeVerificationStatusEmail({
  email,
  collegeName,
  status,
  reason,
}: {
  email: string
  collegeName: string
  status: CollegeVerificationEmailStatus
  reason?: string
}) {
  if (status === 'approved') {
    return sendMail({
      to: email,
      subject: 'Congratulations! Your College Profile is Approved',
      html: `<p>Dear ${collegeName},</p><p>Your college profile has been approved and is now live on UniBridge.</p>`,
    })
  }

  if (status === 'suspended') {
    return sendMail({
      to: email,
      subject: 'Important Update: Your College Listing Has Been Suspended',
      html: `<p>Dear ${collegeName},</p>
        <p>Your college listing has been temporarily suspended from public discovery on UniBridge.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please contact the UniBridge admin team if you need help restoring the listing.</p>`,
    })
  }

  return sendMail({
    to: email,
    subject: 'Action Required: College Profile Update Needed',
    html: `<p>Dear ${collegeName},</p>
      <p>Your registration was reviewed but could not be approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please log in to your dashboard to make the necessary updates and re-submit your verification documents.</p>`,
  })
}

export async function sendClaimSubmittedAdminEmail({
  collegeName,
  adminName,
  adminEmail,
}: {
  collegeName: string
  adminName: string
  adminEmail: string
}) {
  return sendMail({
    to: process.env.ADMIN_EMAIL ?? 'admin@unibridge.in',
    subject: `New College Claim: ${collegeName}`,
    html: `<p>A new claim has been submitted for <strong>${collegeName}</strong>.</p>
      <p><strong>Claimant:</strong> ${adminName} (${adminEmail})</p>
      <p>Please review and approve or reject the claim in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/verifications">admin dashboard</a>.</p>`,
  })
}

export async function sendClaimApprovedEmail({
  email,
  collegeName,
}: {
  email: string
  collegeName: string
}) {
  return sendMail({
    to: email,
    subject: `You're approved! Access your ${collegeName} dashboard`,
    html: `<p>Congratulations! Your claim to manage <strong>${collegeName}</strong> on UniBridge has been approved.</p>
      <p>You can now <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">log in</a> to access your college dashboard, edit your profile, and manage student applications.</p>`,
  })
}

export async function sendClaimRejectedEmail({
  email,
  collegeName,
  reason,
}: {
  email: string
  collegeName: string
  reason?: string
}) {
  return sendMail({
    to: email,
    subject: `College claim update — action required`,
    html: `<p>Your claim to manage <strong>${collegeName}</strong> on UniBridge could not be approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please <a href="${process.env.NEXT_PUBLIC_APP_URL}/register/college">re-apply</a> if you believe this is an error, or contact our support team.</p>`,
  })
}
