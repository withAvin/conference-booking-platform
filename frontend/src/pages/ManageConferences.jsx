// pages/ManageConferences.jsx — S07
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Banner, EmptyState, Page } from '../components/ui';
import ConferenceRow from '../components/ConferenceRow';

const ManageConferences = () => {
  const [conferences, setConferences] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.created) {
      setSuccess(`Conference created: ${location.state.created}`);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    axiosInstance
      .get('/api/conferences')
      .then(({ data }) => setConferences(data))
      .catch(() => setError('Could not load conferences'));
  }, []);

  // Edit and delete arrive in a later story. The buttons render now so
  // the screen matches S07 in the prototype.
  const notYet = () => setError('Edit and delete are not implemented yet');

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
              onAction={notYet}
              onSecondary={notYet}
            />
          ))}
        </div>
      )}
    </Page>
  );
};

export default ManageConferences;
