// pages/ManageConferences.jsx — S07, S09
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Banner, EmptyState, Page } from '../components/ui';
import ConferenceRow from '../components/ConferenceRow';
import Dialog from '../components/Dialog';
import { formatWhen } from '../utils/format';

const ManageConferences = () => {
  const [conferences, setConferences] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/conferences');
      setConferences(data);
    } catch {
      setError('Could not load conferences');
    }
  }, []);

  useEffect(() => {
    if (location.state?.created) setSuccess(`Conference created: ${location.state.created}`);
    if (location.state?.updated) setSuccess(`Conference updated: ${location.state.updated}`);
    if (location.state) window.history.replaceState({}, '');
  }, [location.state]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.delete(`/api/conferences/${pendingDelete.id}`);
      setSuccess(`Deleted ${pendingDelete.title}.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the conference');
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page
      title="Manage conferences"
      action={<Button onClick={() => navigate('/conferences/new')}>Add conference</Button>}
    >
      <Banner type="success" message={success} onClose={() => setSuccess('')} />
      <Banner type="error" message={error} onClose={() => setError('')} />

      {conferences.length === 0 ? (
        <EmptyState
          headline="Add your first conference"
          action={
            <Button onClick={() => navigate('/conferences/new')}>Add conference</Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {conferences.map((c) => (
            <ConferenceRow
              key={c.id}
              conference={c}
              variant="organizer"
              onSecondary={() => navigate(`/conferences/${c.id}/edit`)}
              onAction={() => setPendingDelete(c)}
            />
          ))}
        </div>
      )}

      {pendingDelete && (
        <Dialog
          title={`Delete ${pendingDelete.title}?`}
          confirmLabel="Delete"
          busy={busy}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        >
          <p>{formatWhen(pendingDelete.starts_at, pendingDelete.ends_at)}</p>
          {pendingDelete.booked > 0 ? (
            <p className="text-error-ink">
              {pendingDelete.booked}{' '}
              {pendingDelete.booked === 1 ? 'person has' : 'people have'} booked. This
              cannot be deleted.
            </p>
          ) : (
            <p>This conference has no bookings and can be deleted.</p>
          )}
        </Dialog>
      )}
    </Page>
  );
};

export default ManageConferences;
