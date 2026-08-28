// components/ui.jsx
// The Figma component set, in code. One definition each, used
// everywhere, so a change here propagates the way a Figma component
// change propagates.

// C-01 Button — variants: primary, secondary, disabled
export const Button = ({ variant = 'primary', children, className = '', ...props }) => {
  const base =
    'inline-flex items-center justify-center min-w-[76px] px-4 py-2 rounded-lg text-sm font-medium transition-colors';
  const variants = {
    primary: 'bg-surface border border-line-strong text-ink hover:bg-page',
    secondary: 'bg-surface border border-line text-ink hover:bg-page',
    disabled: 'border border-dashed border-line text-ink-muted cursor-not-allowed',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={variant === 'disabled' || props.disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// C-02 Field — states: default, error
export const Field = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-[13px] font-medium text-ink-soft">{label}</label>}
    <input
      className={`h-9 px-3 rounded-lg bg-surface text-sm text-ink border ${
        error ? 'border-error-line' : 'border-line'
      } focus:outline-none focus:border-line-strong`}
      {...props}
    />
    {error && <p className="text-[13px] text-error-ink">{error}</p>}
  </div>
);

// C-03 Banner — types: error, success
export const Banner = ({ type = 'error', message, onClose }) => {
  if (!message) return null;
  const styles = {
    error: 'bg-error-bg border-error-line text-error-ink',
    success: 'bg-success-bg border-success-line text-success-ink',
  };
  return (
    <div
      role="status"
      className={`flex justify-between items-center px-4 py-3 rounded-lg border text-sm ${styles[type]}`}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="ml-4 leading-none">
          &times;
        </button>
      )}
    </div>
  );
};

// C-06 Empty state
export const EmptyState = ({ headline, sub, action }) => (
  <div className="flex flex-col items-center gap-4 px-10 py-10 rounded-lg border border-dashed border-line min-h-[160px] justify-center">
    <p className="text-base font-medium text-ink">{headline}</p>
    {sub && <p className="text-[13px] text-ink-soft">{sub}</p>}
    {action}
  </div>
);

// Page shell used by every screen that has a header.
export const Page = ({ title, action, children }) => (
  <div className="max-w-[1120px] mx-auto px-8 py-8 flex flex-col gap-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-medium text-ink">{title}</h1>
      {action}
    </div>
    {children}
  </div>
);
