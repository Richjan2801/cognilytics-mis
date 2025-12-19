/**
 * Skeleton Component
 * 
 * Reusable skeleton loaders for different UI elements
 * with animated pulse effect
 */

// Base Skeleton
export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

// Card Skeleton
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}

// Stat Card Skeleton
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}

// Table Skeleton
export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Chart Skeleton
export function SkeletonChart({ height = '300px' }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="bg-gray-100 rounded" style={{ height }}>
          <div className="flex items-end justify-around h-full p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-t w-12"
                style={{ height: `${Math.random() * 60 + 40}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Text Skeleton
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        ></div>
      ))}
    </div>
  );
}

// List Skeleton
export function SkeletonList({ items = 5 }) {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Avatar Skeleton
export function SkeletonAvatar({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  return (
    <div className={`animate-pulse bg-gray-200 rounded-full ${sizeClasses[size]}`}></div>
  );
}

// Dashboard Grid Skeleton
export function SkeletonDashboardGrid() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height="350px" />
        <SkeletonChart height="350px" />
      </div>

      {/* Table */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}

export default Skeleton;
