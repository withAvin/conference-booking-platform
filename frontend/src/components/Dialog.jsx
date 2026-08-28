// components/Dialog.jsx — C-07
import { Button } from './ui';

const Dialog = ({ title, children, confirmLabel = 'Confirm', onConfirm, onCancel, busy }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40"
      onClick={onCancel}
      aria-hidden="true"
    />
    <div
      role="dialog"
      aria-modal="true"
      className="relative w-[400px] p-6 rounded-lg bg-surface border border-line-strong shadow-lg flex flex-col gap-4"
    >
      <h2 className="text-base font-medium text-ink">{title}</h2>
      <div className="flex flex-col gap-1 text-sm text-ink-soft">{children}</div>
      <div className="flex gap-3 justify-end mt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);

export default Dialog;
