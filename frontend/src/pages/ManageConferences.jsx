// pages/ManageConferences.jsx — S07
// CBP-8 needs a destination after saving. The booked-against-capacity
// display and the full marking are finished in CBP-9.
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Banner, EmptyState, Page } from '../components/ui';

const formatWhen = (startsAt, endsAt) => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const time = (d) =>
    d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time(start)} – ${time(end)}`;
};

const ManageConferences = () => {
  const [conferences, setConferences] = useState([]);
  const [banner, setBanner] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.created) {
      setBanner(`Conference created: ${location.state.created}`);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    axiosInstance
      .get('/api/conferences')
      .then(({ data }) => setConferences(data))
      .catch(() => setBanner('Could not load conferences'));
  }, []);

  return (
    <Page
      title="Manage conferences"
      action={<Button onClick={() => navigate('/conferences/new')}>Add conference</Button>}
    >
      {banner && <Banner type="success" message={banner} onClose={() => setBanner('')} />}

      {conferences.length === 0 ? (
        <EmptyState
          headline="Add your first conference"
          action={<Button onClick={() => navigate('/conferences/new')}>Add conference</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {conferences.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center px-5 py-4 rounded-lg bg-surface border border-line"
            >
              <div>
                <p className="text-base font-medium text-ink">{c.title}</p>
                <p className="text-[13px] text-ink-soft mt-1">
                  {formatWhen(c.starts_at, c.ends_at)} · {c.booked} / {c.capacity} booked
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
};

export default ManageConferences;
