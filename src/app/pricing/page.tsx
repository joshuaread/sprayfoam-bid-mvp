import { PageTitle } from '@/components/ui';

export default function PricingPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Pricing" subtitle="Placeholder page. Billing is not connected in this demo." />
      <div className="card max-w-md border-teal-600">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">$49</span>
          <span className="text-slate-600">/ month</span>
        </div>
        <p className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">working price - not final</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Unlimited estimates and area builders</li>
          <li>Branded customer PDF + internal cost sheet</li>
          <li>Price book, customers, estimate history</li>
          <li>Homeowner instant-quote widget included</li>
        </ul>
        <button type="button" className="btn-primary mt-4 w-full" disabled>
          Start trial (Stripe stubbed in demo)
        </button>
        <p className="mt-2 text-xs text-slate-500">No checkout, no card collection, and no account creation happen in this demo.</p>
      </div>
    </div>
  );
}
