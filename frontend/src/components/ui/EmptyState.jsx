import React from 'react';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BellIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

/**
 * EmptyState Component
 * Displays friendly empty state messages with icons and optional actions
 */
const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  action,
  actionLabel,
  variant = 'default',
  className = ''
}) => {
  // Predefined variants for common scenarios
  const variants = {
    'no-teachers': {
      icon: UsersIcon,
      title: 'No Teachers Yet',
      description: 'Start by adding teachers to the system. They will appear here once added.'
    },
    'no-sessions': {
      icon: ClipboardDocumentListIcon,
      title: 'No Sessions Recorded',
      description: 'You haven\'t participated in any measurement sessions yet. Sessions will appear here once recorded.'
    },
    'no-progress': {
      icon: ChartBarIcon,
      title: 'No Progress Data',
      description: 'Start participating in sessions to track your cognitive load progress over time.'
    },
    'no-notifications': {
      icon: BellIcon,
      title: 'All Caught Up!',
      description: 'You have no new notifications. We\'ll notify you when something important happens.'
    },
    'no-recommendations': {
      icon: LightBulbIcon,
      title: 'No Recommendations Yet',
      description: 'Recommendations will appear here based on cognitive load measurements and patterns.'
    },
    'no-results': {
      icon: MagnifyingGlassIcon,
      title: 'No Results Found',
      description: 'Try adjusting your search or filter criteria to find what you\'re looking for.'
    },
    'no-data': {
      icon: FolderOpenIcon,
      title: 'No Data Available',
      description: 'There is no data to display at the moment. Check back later or add some data.'
    },
    'default': {
      icon: InboxIcon,
      title: 'Nothing Here',
      description: 'There is nothing to display right now.'
    }
  };

  // Use variant if provided, otherwise use custom props
  const config = variants[variant] || {
    icon: Icon,
    title,
    description
  };

  const IconComponent = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {/* Icon */}
      <div className="mb-6 rounded-full bg-gray-100 p-6">
        <IconComponent className="h-16 w-16 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {config.title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-md mb-6">
        {config.description}
      </p>

      {/* Optional Action Button */}
      {action && actionLabel && (
        <button
          onClick={action}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * EmptyStateCard - Card wrapper variant
 */
export const EmptyStateCard = ({ children, ...props }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <EmptyState {...props} />
      {children}
    </div>
  );
};

/**
 * EmptyStateInline - Compact inline variant
 */
export const EmptyStateInline = ({
  icon: Icon = InboxIcon,
  title = 'No items',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center py-8 px-4 ${className}`}>
      <Icon className="h-8 w-8 text-gray-400 mr-3" />
      <span className="text-gray-500 font-medium">{title}</span>
    </div>
  );
};

export default EmptyState;
