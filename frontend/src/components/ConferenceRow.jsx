// components/ConferenceRow.jsx
// C-05 from the Figma component set. One row, five variants, matching
// the prototype: available, full, booked, organizer, change.
import { formatWhen } from '../utils/format';
import { Button } from './ui';

const ConferenceRow = ({ conference, variant, onAction, onSecondary }) => {
  const { title, starts_at, ends_at, capacity, booked } = conference;
  const seatsLeft = capacity - booked;
  const isFull = seatsLeft <= 0;

  // Attendees see seats remaining. Organizers see booked against
  // capacity. Same underlying numbers, framed for the role.
  const meta =
    variant === 'organizer'
      ? `${formatWhen(starts_at, ends_at)} · ${booked} / ${capacity} booked${
          isFull ? ' · Full' : ''
        }`
      : `${formatWhen(starts_at, ends_at)} · ${
          isFull ? 'Full' : `${seatsLeft} seats left`
        }`;

  const actions = {
    available: <Button onClick={onAction}>Book</Button>,
    full: <Button variant="disabled">Full</Button>,
    booked: <Button variant="secondary">Booked</Button>,
    change: <Button onClick={onAction}>Move</Button>,
    organizer: (
      <>
        <Button variant="secondary" onClick={onSecondary}>
          Edit
        </Button>
        <Button variant="secondary" onClick={onAction}>
          Delete
        </Button>
      </>
    ),
  };

  return (
    <div className="flex justify-between items-center px-5 py-4 rounded-lg bg-surface border border-line">
      <div>
        <p className="text-base font-medium text-ink">{title}</p>
        <p className="text-[13px] text-ink-soft mt-1">{meta}</p>
      </div>
      <div className="flex gap-2">{actions[variant]}</div>
    </div>
  );
};

export default ConferenceRow;
