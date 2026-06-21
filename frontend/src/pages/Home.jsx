import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="hero-section">
        <h1>Blood Donor Application</h1>
        <p>Donate blood, save lives. Join us in making a difference.</p>
      </div>
      {user && (
        <div className="user-info">
          <h2>Welcome, {user.name}!</h2>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>
          <p>Blood Group: {user.bloodGroup}</p>
          <p>Role: {user.role}</p>
        </div>
      )}
      {!user && (
        <div className="cta">
          <p>Register now to become a donor or check blood bank availability.</p>
        </div>
      )}
    </div>
  );
}
