import React from 'react';

export const SkeletonLine = ({ width = '100%', height = '16px', borderRadius = '4px', className = '' }) => {
  return (
    <div 
      className={`skeleton-line ${className}`} 
      style={{ width, height, borderRadius }}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-header">
        <SkeletonLine width="30%" height="18px" />
        <SkeletonLine width="20%" height="18px" />
      </div>
      <SkeletonLine width="80%" height="24px" className="my-2" />
      <SkeletonLine width="50%" height="16px" />
      <div className="skeleton-card-body">
        <SkeletonLine width="100%" height="8px" className="mt-4" />
        <SkeletonLine width="90%" height="12px" className="mt-4" />
      </div>
      <div className="skeleton-card-footer mt-4">
        <SkeletonLine width="40%" height="16px" />
        <SkeletonLine width="30%" height="32px" borderRadius="20px" />
      </div>
    </div>
  );
};
