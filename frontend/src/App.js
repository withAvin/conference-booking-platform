import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ManageConferences from './pages/ManageConferences';
import ConferenceForm from './pages/ConferenceForm';
import { useAuth } from './context/AuthContext';

// Client-side guard. This is convenience, not security: the real
// enforcement is organizerOnly on the server, which is what SC-06
// tests by requesting the route directly.
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

          {/* Attendee routes arrive with CBP-9 onwards. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
