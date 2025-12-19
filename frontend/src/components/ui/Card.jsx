import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Card Component
 * 
 * Container untuk menampilkan konten dengan shadow dan border radius
 * 
 * @example
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Title</Card.Title>
 *     <Card.Description>Description</Card.Description>
 *   </Card.Header>
 *   <Card.Content>
 *     Content goes here
 *   </Card.Content>
 * </Card>
 */

const Card = forwardRef(({ className = '', children, hover = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-card shadow-card border border-gray-200 transition-all duration-200',
        hover && 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header - untuk bagian atas card
const CardHeader = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// Card Title - untuk judul card
const CardTitle = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={clsx('text-lg font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

// Card Description - untuk deskripsi di bawah title
const CardDescription = forwardRef(
  ({ className = '', children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={clsx('text-sm text-gray-500 mt-1', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

// Card Content - untuk konten utama card
const CardContent = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// Card Footer - untuk bagian bawah card (optional)
const CardFooter = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

// Export semua sebagai properti dari Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
