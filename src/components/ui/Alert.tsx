import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'info';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-background text-foreground border border-input',
      destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      success: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-accent-strong',
      info: 'border-accent-strong/50 text-blue-700 dark:text-blue-400 [&>svg]:text-accent-strong'
    };

    const icons = {
      default: Info,
      destructive: XCircle,
      success: CheckCircle,
      info: Info
    };

    const Icon = icons[variant];

    return (
      <div
        className={cn(
          'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <div className="[&_p]:leading-relaxed">
          {children}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
);

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription }; 