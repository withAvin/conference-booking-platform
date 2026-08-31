// pages/MyBookings.jsx — S05
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Banner, EmptyState, Page } from '../components/ui';
import { formatWhen } from '../utils/format';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get('/api/registrations')
      .then(({ data }) => setBookings(data))
      .catch(() => setError('Could not load your bookings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Page title="My bookings" />;

  return (
    <Page title="My bookings">
      <Banner type="error" message={error} onClose={() => setError('')} />

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
                {/* No seat count here. An attendee looking at their own
                    bookings does not need to know how full the
                    conference is. */}
                <p className="text-[13px] text-ink-soft mt-1">
                  {formatWhen(b.starts_at, b.ends_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
};

export default MyBookings;
