// pages/Signup.jsx — S01
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button, Field, Banner } from '../components/ui';

const Signup = () => {
  const [form, setForm] = useState({ username: '', password: '', role: 'attendee' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

    const handleSubmit = async () => {
    setError('');
    try {
      await axiosInstance.post('/api/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-[400px] p-8 rounded-lg bg-surface border border-line flex flex-col gap-4">
        <h1 className="text-2xl font-medium text-ink">Sign up</h1>
        <Banner message={error} onClose={() => setError('')} />
        <Field
          label="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-soft">I am a</span>
          <div className="flex gap-6">
            {['attendee', 'organizer'].map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={form.role === role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
                {role === 'attendee' ? 'Attendee' : 'Organizer'}
              </label>
            ))}
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full">
          Sign up
        </Button>
        <p className="text-[13px] text-ink-soft text-center">
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
