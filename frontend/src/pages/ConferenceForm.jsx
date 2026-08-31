// pages/ConferenceForm.jsx — S08, add and edit
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Field, Banner, Page } from '../components/ui';

// Splits a stored timestamp back into the date and time values the
// form inputs expect.
const splitTimestamp = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

const ConferenceForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: '',
  });
  const [booked, setBooked] = useState(0);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEdit) return;
    axiosInstance
      .get(`/api/conferences/${id}`)
      .then(({ data }) => {
        const start = splitTimestamp(data.starts_at);
        const end = splitTimestamp(data.ends_at);
        setForm({
          title: data.title,
          date: start.date,
          startTime: start.time,
          endTime: end.time,
          capacity: String(data.capacity),
        });
        setBooked(data.booked);
      })
      .catch(() => setBanner('Could not load the conference'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    setErrors({});
    setBanner('');
    try {
      if (isEdit) {
        await axiosInstance.put(`/api/conferences/${id}`, form);
        navigate('/conferences', { state: { updated: form.title } });
      } else {
        await axiosInstance.post('/api/conferences', form);
        navigate('/conferences', { state: { created: form.title } });
      }
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setBanner(err.response?.data?.message || 'Could not save the conference');
    }
  };

  if (loading) return <Page title="Edit conference" />;

  const timesLocked = isEdit && booked > 0;

  return (
    <Page title={isEdit ? 'Edit conference' : 'Add conference'}>
      <Banner message={banner} onClose={() => setBanner('')} />
      <div className="w-[520px] flex flex-col gap-4">
        <Field label="Title" value={form.title} onChange={set('title')} error={errors.title} />
        <div className="flex gap-4">
          <Field
            label="Date"
            type="date"
            value={form.date}
            onChange={set('date')}
            error={errors.date}
            disabled={timesLocked}
            className="flex-1"
          />
          <Field
            label="Start time"
            type="time"
            value={form.startTime}
            onChange={set('startTime')}
            error={errors.startTime}
            disabled={timesLocked}
            className="w-32"
          />
          <Field
            label="End time"
            type="time"
            value={form.endTime}
            onChange={set('endTime')}
            error={errors.endTime}
            disabled={timesLocked}
            className="w-32"
          />
        </div>
        {timesLocked && (
          <p className="text-[13px] text-ink-soft -mt-2">
            Times are locked because this conference has {booked}{' '}
            {booked === 1 ? 'booking' : 'bookings'}.
          </p>
        )}
        <Field
          label="Capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={set('capacity')}
          error={errors.capacity}
          className="w-32"
        />
        {isEdit && booked > 0 && !errors.capacity && (
          <p className="text-[13px] text-ink-soft -mt-2">
            {booked} already booked.
          </p>
        )}
        <div className="flex gap-3 mt-2">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="secondary" onClick={() => navigate('/conferences')}>
            Cancel
          </Button>
        </div>
      </div>
    </Page>
  );
};

export default ConferenceForm;
