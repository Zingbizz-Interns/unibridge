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
