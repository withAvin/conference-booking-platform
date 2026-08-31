import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Signup from './pages/Signup';
import Login from './pages/Login';
import BrowseConferences from './pages/BrowseConferences';
import MyBookings from './pages/MyBookings';
import ManageConferences from './pages/ManageConferences';
import ConferenceForm from './pages/ConferenceForm';
import { useAuth } from './context/AuthContext';

// Client-side guard. Convenience, not security: the real enforcement
// is organizerOnly and attendeeOnly on the server, which is what SC-06
// tests by requesting the endpoints directly.
const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

const Landing = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'organizer' ? '/conferences' : '/browse'} replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-page">
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/browse"
            element={
              <RequireRole role="attendee">
                <BrowseConferences />
              </RequireRole>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <RequireRole role="attendee">
                <MyBookings />
              </RequireRole>
            }
          />

          <Route
            path="/conferences"
            element={
              <RequireRole role="organizer">
                <ManageConferences />
              </RequireRole>
            }
          />
          <Route
            path="/conferences/new"
            element={
              <RequireRole role="organizer">
                <ConferenceForm />
              </RequireRole>
            }
          />
          <Route
            path="/conferences/:id/edit"
            element={
              <RequireRole role="organizer">
                <ConferenceForm />
              </RequireRole>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
