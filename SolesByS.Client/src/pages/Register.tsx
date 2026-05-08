import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Register() {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy register logic
    navigate('/store');
  };

  return (
    <div className="auth-page">
      <section className="auth-section">
        <div className="auth-container">
            <h2>Create an Account</h2>
            <form onSubmit={handleRegister}>
                <div className="form-group auth-form-group">
                    <label htmlFor="fullname">Full Name</label>
                    <input type="text" id="fullname" name="fullname" placeholder="John Doe" required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Create a password" required />
                </div>
                <button type="submit" className="btn btn-primary auth-btn">Sign Up</button>
            </form>
            <div className="auth-footer">
                Already have an account? <Link to="/login">Login</Link>
            </div>
        </div>
      </section>
    </div>
  );
}

export default Register;
