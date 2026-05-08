import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Register() {
  const navigate = useNavigate();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('https://solesbys.onrender.com/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullname, email, phone: '' })
      });
      localStorage.setItem('role', 'user');
      navigate('/store');
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-section">
        <div className="auth-container">
            <h2>Create an Account</h2>
            <form onSubmit={handleRegister}>
                <div className="form-group auth-form-group">
                    <label htmlFor="fullname">Full Name</label>
                    <input type="text" id="fullname" name="fullname" placeholder="John Doe" value={fullname} onChange={e => setFullname(e.target.value)} required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
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
