// pages/MyBookings.jsx — S05
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Banner, EmptyState, Page } from '../components/ui';
import Dialog from '../components/Dialog';
import { formatWhen } from '../utils/format';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/registrations');
      setBookings(data);
    } catch {
      setError('Could not load your bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.state?.moved) {
      setSuccess(`Moved to ${location.state.moved}.`);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmCancel = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.delete(`/api/registrations/${pendingCancel.id}`);
      setSuccess(`Cancelled ${pendingCancel.title}. The seat is now available to others.`);
      setPendingCancel(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel the booking');
      setPendingCancel(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Page title="My bookings" />;

  return (
    <Page title="My bookings">
      <Banner type="error" message={error} onClose={() => setError('')} />
      <Banner type="success" message={success} onClose={() => setSuccess('')} />

      {bookings.length === 0 ? (
        <EmptyState
          headline="You haven't booked anything yet"
          action={<Button onClick={() => navigate('/browse')}>Browse conferences</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center px-5 py-4 rounded-lg bg-surface border border-line"
            >
              <div>
                <p className="text-base font-medium text-ink">{b.title}</p>
                {/* No seat count. An attendee looking at their own
                    bookings does not need to know how full it is. */}
                <p className="text-[13px] text-ink-soft mt-1">
                  {formatWhen(b.starts_at, b.ends_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/my-bookings/${b.id}/change`)}
                >
                  Change
                </Button>
                <Button onClick={() => setPendingCancel(b)}>Cancel</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingCancel && (
        <Dialog
          title={`Cancel ${pendingCancel.title}?`}
          confirmLabel="Cancel booking"
          busy={busy}
          onCancel={() => setPendingCancel(null)}
          onConfirm={confirmCancel}
        >
          <p>{formatWhen(pendingCancel.starts_at, pendingCancel.ends_at)}</p>
          <p>Your seat will be released and can be booked by someone else.</p>
        </Dialog>
      )}
    </Page>
  );
};

export default MyBookings;
