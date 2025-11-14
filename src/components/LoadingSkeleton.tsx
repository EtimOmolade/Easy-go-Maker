import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string;
  height?: string;
  count?: number;
}

const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: [0, 0, 1, 1] as const,
  },
};

export const Skeleton = ({
  className = "",
  variant = "rectangular",
  width = "100%",
  height = "20px",
  count = 1,
}: SkeletonProps) => {
  const baseClasses = "bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%]";

  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={{ width, height }}
            animate={shimmer.animate}
            transition={{ ...shimmer.transition, delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      animate={shimmer.animate}
      transition={shimmer.transition}
    />
  );
};

// Pre-built skeleton components for common patterns
export const DashboardSkeleton = () => (
  <div className="space-y-8 p-4">
    {/* Hero card skeleton */}
    <div className="glass rounded-2xl p-6 space-y-4">
      <Skeleton variant="circular" width="80px" height="80px" className="mx-auto" />
      <Skeleton variant="text" width="60%" height="32px" className="mx-auto" />
      <Skeleton variant="text" width="80%" height="20px" className="mx-auto" />
      <Skeleton variant="rectangular" width="100%" height="56px" />
    </div>

    {/* Quick actions skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-xl p-6 space-y-3">
          <Skeleton variant="circular" width="56px" height="56px" className="mx-auto" />
          <Skeleton variant="text" width="80%" height="20px" className="mx-auto" />
          <Skeleton variant="text" width="60%" height="16px" className="mx-auto" />
        </div>
      ))}
    </div>

    {/* Content cards skeleton */}
    <Skeleton variant="card" width="100%" height="200px" />
    <Skeleton variant="card" width="100%" height="300px" />
  </div>
);

export const JournalSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass rounded-xl p-6 space-y-3">
        <Skeleton variant="text" width="40%" height="24px" />
        <Skeleton variant="text" width="30%" height="16px" />
        <Skeleton variant="text" count={3} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width="80px" height="36px" />
          <Skeleton variant="rectangular" width="80px" height="36px" />
          <Skeleton variant="rectangular" width="80px" height="36px" />
        </div>
      </div>
    ))}
  </div>
);

export const GuidelinesSkeleton = () => (
  <div className="space-y-6 p-4">
    <Skeleton variant="text" width="200px" height="32px" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass rounded-xl p-6 space-y-3">
          <Skeleton variant="text" width="60%" height="24px" />
          <Skeleton variant="text" count={2} />
          <Skeleton variant="rectangular" width="100%" height="40px" />
        </div>
      ))}
    </div>
  </div>
);
