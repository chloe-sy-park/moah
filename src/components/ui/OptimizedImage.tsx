'use client';
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  fallback?: React.ReactNode;
}

export function OptimizedImage({ src, alt, width, height, fill, className, priority, fallback }: OptimizedImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return fallback ? <>{fallback}</> : <div className={`bg-gray-200 flex items-center justify-center ${className}`}><span className="text-gray-400">🖼️</span></div>;
  }

  return (
    <Image src={src} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} fill={fill} className={className} priority={priority} onError={() => setError(true)} />
  );
}
