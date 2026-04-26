import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClaimByUserId } from '@/lib/college-claims'
import Link from 'next/link'
import { Clock, XCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export default async function ClaimPendingPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'college') redirect('/login')

  const claim = await getClaimByUserId(session.user.id)
  if (!claim) redirect('/login')

  // If approved, redirect to dashboard
  if (claim.status === 'approved') redirect('/college/dashboard')

  const isPending = claim.status === 'pending'

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-md-surface p-4 overflow-hidden">
      {/* Decorative blur shapes */}
      <div
        className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/3 w-[600px] h-[600px] rounded-[100px] blur-3xl mix-blend-multiply pointer-events-none"
        style={{ backgroundColor: isPending ? 'rgba(103,80,164,0.08)' : 'rgba(186,26,26,0.06)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[500px] h-[500px] rounded-full blur-3xl mix-blend-multiply pointer-events-none"
        style={{ backgroundColor: isPending ? 'rgba(103,80,164,0.06)' : 'rgba(186,26,26,0.04)' }}
        aria-hidden="true"
      />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-md-surface-container rounded-[32px] shadow-md p-8 text-center">

          {/* Icon */}
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              isPending ? 'bg-md-secondary-container' : 'bg-red-50'
            }`}
          >
            {isPending ? (
              <Clock className="w-10 h-10 text-md-primary" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-medium text-md-on-surface mb-2">
            {isPending ? 'Claim under review' : 'Claim not approved'}
          </h1>

          {/* College badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-md-secondary-container rounded-full mb-5">
            <CheckCircle2 className="w-4 h-4 text-md-primary shrink-0" />
            <span className="text-sm font-medium text-md-on-secondary-container">
              {claim.college.name}
            </span>
          </div>

          {isPending ? (
            <>
              <p className="text-md-on-surface-variant text-sm leading-relaxed mb-6">
                Your request to manage this college is being reviewed by our team. We'll notify you by email once a decision is made.
              </p>
              <div className="bg-md-surface-container-low rounded-2xl p-4 text-left space-y-2">
                <p className="text-xs font-medium text-md-on-surface-variant uppercase tracking-wide">Submitted</p>
                <p className="text-sm text-md-on-surface">
                  {new Date(claim.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </>
          ) : (
            <>
              {claim.rejectionReason && (
                <div className="bg-red-50 rounded-2xl p-4 text-left mb-5">
                  <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-red-700">{claim.rejectionReason}</p>
                </div>
              )}
              <p className="text-md-on-surface-variant text-sm leading-relaxed mb-6">
                If you believe this is an error, you can re-apply or contact our support team.
              </p>
              <Link
                href="/register/college"
                className="inline-flex items-center gap-2 rounded-full bg-md-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-md-primary/90 hover:shadow-md transition-all duration-300 active:scale-95"
              >
                Re-apply <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
