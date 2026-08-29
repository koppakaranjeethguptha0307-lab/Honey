import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, XCircle, Package, Truck, 
  ShieldCheck, ArrowRight, Award, Beaker, Factory
} from 'lucide-react';

export function StatusBadge({ status, type = 'general' }) {
  if (!status) return null;

  const statusStr = String(status).toUpperCase().trim();

  let colorClasses = 'bg-stone-800 text-stone-300 border-stone-700';
  let Icon = Clock;

  switch (statusStr) {
    // Batch & Stage Statuses
    case 'HARVESTED':
      colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      Icon = Award;
      break;
    case 'QUALITY_TESTED':
    case 'QUALITY_APPROVED':
    case 'APPROVED':
    case 'PASSED':
    case 'EXCELLENT':
    case 'HEALTHY':
    case 'VERIFIED HONEY BATCH':
    case 'DEMO BLOCKCHAIN VERIFIED':
      colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      Icon = ShieldCheck;
      break;
    case 'PROCESSED':
    case 'IN_PROGRESS':
      colorClasses = 'bg-sky-950/80 text-sky-300 border-sky-800/60';
      Icon = Factory;
      break;
    case 'PACKAGED':
      colorClasses = 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      Icon = Package;
      break;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      colorClasses = 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      Icon = Truck;
      break;
    case 'DELIVERED':
    case 'COMPLETED':
      colorClasses = 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80';
      Icon = CheckCircle2;
      break;

    // Quality Grades
    case 'GRADE_A':
      colorClasses = 'bg-emerald-900/90 text-emerald-200 border-emerald-600/80';
      Icon = Award;
      break;
    case 'GRADE_B':
      colorClasses = 'bg-yellow-900/90 text-yellow-200 border-yellow-600/80';
      Icon = Award;
      break;
    case 'GRADE_C':
      colorClasses = 'bg-orange-900/90 text-orange-200 border-orange-600/80';
      Icon = Award;
      break;

    // Warning / Danger Statuses
    case 'REJECTED':
    case 'FAILED':
    case 'CRITICAL':
    case 'DEMO BLOCKCHAIN VERIFICATION FAILED':
      colorClasses = 'bg-rose-950/90 text-rose-300 border-rose-800/80';
      Icon = XCircle;
      break;
    case 'WARNING':
    case 'NOT AVAILABLE FOR PUBLIC VERIFICATION':
    case 'PENDING':
      colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      Icon = AlertTriangle;
      break;

    default:
      colorClasses = 'bg-stone-800/90 text-stone-300 border-stone-700';
      Icon = Clock;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses} shadow-sm`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{statusStr.replace(/_/g, ' ')}</span>
    </span>
  );
}
