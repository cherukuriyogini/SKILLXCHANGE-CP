import { motion } from 'framer-motion';

export const Skeleton = ({ className }) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
    className={`bg-slate-200 rounded-lg ${className}`}
  />
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4 shadow-sm">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
    <Skeleton className="w-full h-20" />
    <Skeleton className="w-full h-10 rounded-xl" />
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-12 h-5" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
    ))}
  </div>
);
