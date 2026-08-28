// pages/BrowseConferences.jsx — S03
import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import { Banner, EmptyState, Page } from '../components/ui';
import ConferenceRow from '../components/ConferenceRow';

const BrowseConferences = () => {
  const [conferences, setConferences] = useState([]);
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

  // Which of the three states each row shows. Booking itself arrives
  // in CBP-10; this story only renders the states.
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
            <ConferenceRow key={c.id} conference={c} variant={variantFor(c)} />
          ))}
        </div>
      )}
    </Page>
  );
};

export default BrowseConferences;
