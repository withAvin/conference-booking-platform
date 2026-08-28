// pages/BrowseConferences.jsx — S03, S04
import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import { Banner, EmptyState, Page } from '../components/ui';
import ConferenceRow from '../components/ConferenceRow';
import Dialog from '../components/Dialog';
import { formatWhen } from '../utils/format';

const BrowseConferences = () => {
  const [conferences, setConferences] = useState([]);
  const [pending, setPending] = useState(null); // conference awaiting confirmation
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/conferences');
      setConferences(data);
    } catch {
      setError('Could not load conferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmBooking = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.post('/api/registrations', { conferenceId: pending.id });
      setSuccess(`Booked. ${pending.title}, ${formatWhen(pending.starts_at, pending.ends_at)}.`);
      setPending(null);
      // Reload rather than patching state, so the seat count and the
      // booked flag come from the server. A stale count would make
      // BR-01 look wrong even when the server enforced it correctly.
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete the booking');
      setPending(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const variantFor = (c) => {
    if (c.bookedByMe) return 'booked';
    if (c.capacity - c.booked <= 0) return 'full';
    return 'available';
  };

  if (loading) return <Page title="Browse conferences" />;

  return (
    <Page title="Browse conferences">
      <Banner type="error" message={error} onClose={() => setError('')} />
      <Banner type="success" message={success} onClose={() => setSuccess('')} />

      {conferences.length === 0 ? (
        <EmptyState
          headline="No conferences available yet"
          sub="Check back once an organizer adds one"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {conferences.map((c) => (
            <ConferenceRow
              key={c.id}
              conference={c}
              variant={variantFor(c)}
              onAction={() => setPending(c)}
            />
          ))}
        </div>
      )}

      {pending && (
        <Dialog
          title="Confirm booking"
          confirmLabel="Confirm"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={confirmBooking}
        >
          <p className="text-ink">{pending.title}</p>
          <p>{formatWhen(pending.starts_at, pending.ends_at)}</p>
          <p>{pending.capacity - pending.booked} seats left</p>
        </Dialog>
      )}
    </Page>
  );
};

export default BrowseConferences;
