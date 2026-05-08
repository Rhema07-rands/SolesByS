import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('https://solesbys.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/store');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-section">
        <div className="auth-container">
            <h2>Welcome Back</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group auth-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
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
