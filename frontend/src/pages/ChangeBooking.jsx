// pages/ChangeBooking.jsx — S06
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Banner, EmptyState, Page } from '../components/ui';
import { formatWhen } from '../utils/format';

const ChangeBooking = () => {
  const { id } = useParams();
  const [current, setCurrent] = useState(null);
  const [targets, setTargets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/registrations'),
      axiosInstance.get(`/api/registrations/${id}/move-targets`),
    ])
      .then(([mine, options]) => {
        setCurrent(mine.data.find((b) => String(b.id) === String(id)) || null);
        setTargets(options.data);
      })
      .catch(() => setError('Could not load the change options'))
      .finally(() => setLoading(false));
  }, [id]);

  const move = async (conference) => {
    setBusy(true);
    setError('');
    try {
      await axiosInstance.put(`/api/registrations/${id}`, { conferenceId: conference.id });
      navigate('/my-bookings', { state: { moved: conference.title } });
    } catch (err) {
      // A refused move leaves the original booking exactly as it was,
      // because the whole operation rolls back.
      setError(err.response?.data?.message || 'Could not change the booking');
      setBusy(false);
    }
  };

  if (loading) return <Page title="Change booking" />;

  return (
    <Page title="Change booking">
      <Banner type="error" message={error} onClose={() => setError('')} />

      {current && (
        <p className="text-sm text-ink-soft">
          Currently booked: {current.title} · {formatWhen(current.starts_at, current.ends_at)}
        </p>
      )}

      {targets.length === 0 ? (
        <EmptyState
          headline="Nothing available to move to"
          sub="Every other conference is either full or clashes with a booking you already hold"
          action={<Button onClick={() => navigate('/my-bookings')}>Back</Button>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {targets.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center px-5 py-4 rounded-lg bg-surface border border-line"
              >
                <div>
                  <p className="text-base font-medium text-ink">{c.title}</p>
                  <p className="text-[13px] text-ink-soft mt-1">
                    {formatWhen(c.starts_at, c.ends_at)} · {c.capacity - c.booked} seats left
                  </p>
                </div>
                <Button onClick={() => move(c)} disabled={busy}>
                  Move
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-ink-soft">
            Full and clashing conferences are not shown.
          </p>
        </>
      )}

      <div>
        <Button variant="secondary" onClick={() => navigate('/my-bookings')}>
          Cancel
        </Button>
      </div>
    </Page>
  );
};

export default ChangeBooking;
