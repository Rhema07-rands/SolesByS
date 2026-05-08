import { Link } from 'react-router-dom';
import '../App.css'; // Or a separate css if preferred

function Landing() {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-content">
            <h1>Soles by S</h1>
            <p>Step into the ultimate collection of premium sneakers, boots, and classic loafers. Join the community to unlock exclusive drops.</p>
            <div className="landing-buttons">
                <Link to="/login" className="btn btn-primary">Login to Shop</Link>
                <Link to="/register" className="btn btn-outline">Create Account</Link>
            </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
