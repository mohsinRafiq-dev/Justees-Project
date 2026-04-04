const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse bg-gray-700';
  
  const variantClasses = {
    default: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
    title: 'rounded h-8',
    button: 'rounded-full h-10',
    card: 'rounded-lg',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden">
      <Skeleton className="aspect-square w-full" variant="card" />
      <div className="p-6 space-y-3">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-3/4 h-6" variant="title" />
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-20 h-10" variant="button" />
        </div>
      </div>
    </div>
  );
};

export const CategoryCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-lg aspect-square">
      <Skeleton className="w-full h-full" variant="card" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Skeleton className="w-32 h-7 mb-2" />
        <Skeleton className="w-20 h-4" />
      </div>
    </div>
  );
};

export const ReviewCardSkeleton = () => {
  return (
    <div className="bg-gray-700 p-6 rounded-lg space-y-4">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-5 h-5" variant="circle" />
        ))}
      </div>
      <Skeleton className="w-full h-20" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12" variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
    </div>
  );
};

export const HeroSkeleton = () => {
  return (
    <div className="relative h-screen bg-gray-800">
      <Skeleton className="absolute inset-0" />
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl space-y-4">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-96 h-16" variant="title" />
            <Skeleton className="w-80 h-6" />
            <Skeleton className="w-48 h-12" variant="button" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
