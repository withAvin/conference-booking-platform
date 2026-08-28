// pages/ConferenceForm.jsx — S08
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Field, Banner, Page } from '../components/ui';

const ConferenceForm = () => {
  const [form, setForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: '',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSave = async () => {
    setErrors({});
    setBanner('');
    try {
      await axiosInstance.post('/api/conferences', form);
      navigate('/conferences', { state: { created: form.title } });
    } catch (err) {
      // Field errors come back keyed by field name, so each one lands
      // on the input that caused it rather than in a generic message.
      setErrors(err.response?.data?.errors || {});
      setBanner(err.response?.data?.message || 'Could not save the conference');
    }
  };

  return (
    <Page title="Add conference">
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
            className="flex-1"
          />
          <Field
            label="Start time"
            type="time"
            value={form.startTime}
            onChange={set('startTime')}
            error={errors.startTime}
            className="w-32"
          />
          <Field
            label="End time"
            type="time"
            value={form.endTime}
            onChange={set('endTime')}
            error={errors.endTime}
            className="w-32"
          />
        </div>
        <Field
          label="Capacity"
          type="number"
          min="1"
          value={form.capacity}
          onChange={set('capacity')}
          error={errors.capacity}
          className="w-32"
        />
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
