import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login logic
    navigate('/store');
  };

  return (
    <div className="auth-page">
      <section className="auth-section">
        <div className="auth-container">
            <h2>Welcome Back</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group auth-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" required />
                </div>
                <button type="submit" className="btn btn-primary auth-btn">Login</button>
            </form>
            <div className="auth-footer">
                Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
