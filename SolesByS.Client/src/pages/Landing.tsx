import { Link } from 'react-router-dom';
import '../App.css';

function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-content">
            <h1>Soles by S</h1>
            <p>Step into the ultimate collection of premium sneakers, boots, and classic loafers. No account needed — shop freely and check out as a guest.</p>
            <div className="landing-buttons">
                <Link to="/store" className="btn btn-primary">Browse Store</Link>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-outline">Create Account</Link>
            </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
