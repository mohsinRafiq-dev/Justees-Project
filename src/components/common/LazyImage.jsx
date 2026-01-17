import { useState } from 'react';

/**
 * Lazy Loading Image Component
 * Loads image with blur-up effect
 */
const LazyImage = ({ src, alt, className = '', aspectRatio = 'aspect-square' }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-800 ${aspectRatio} ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gray-700" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <span>Failed to load</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

export default LazyImage;
