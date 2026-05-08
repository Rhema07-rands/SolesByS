import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Register() {
  const navigate = useNavigate();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = '';

      // Upload avatar to Cloudinary if a file was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('upload_preset', 'SOLESBYS');

        const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dr5nd8kr2/image/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.secure_url;
      }

      const res = await fetch('https://solesbys.onrender.com/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullname,
          email,
          phone,
          password,
          address,
          avatar: avatarUrl
        })
      });

      if (!res.ok) throw new Error('Registration failed');
      const userData = await res.json();

      localStorage.setItem('role', 'user');
      localStorage.setItem('user', JSON.stringify({
        role: 'user',
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        avatar: userData.avatar
      }));
      navigate('/store');
    } catch (err) {
      console.error(err);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-section">
        <div className="auth-container">
            <h2>Create an Account</h2>
            <form onSubmit={handleRegister}>
                {/* Profile Picture */}
                <div className="form-group auth-form-group" style={{alignItems: 'center'}}>
                  <label style={{marginBottom: '0.5rem'}}>Profile Picture <span style={{color: 'var(--text-secondary)', fontWeight: 400}}>(optional)</span></label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div
                      onClick={() => document.getElementById('avatar-input')?.click()}
                      style={{
                        width: 72, height: 72, borderRadius: '50%', border: '2px dashed var(--border-color)',
                        background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'rgba(255,255,255,0.05)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center', overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {!avatarPreview && 'Tap to\nupload'}
                    </div>
                    <input type="file" id="avatar-input" accept="image/*" onChange={handleAvatarChange} style={{display: 'none'}} />
                    <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
                      {avatarFile ? avatarFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>

                <div className="form-group auth-form-group">
                    <label htmlFor="fullname">Full Name</label>
                    <input type="text" id="fullname" name="fullname" placeholder="John Doe" value={fullname} onChange={e => setFullname(e.target.value)} required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="phone">Phone Number <span style={{color: 'var(--text-secondary)', fontWeight: 400}}>(optional)</span></label>
                    <input type="tel" id="phone" name="phone" placeholder="+234 812 345 6789" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="form-group auth-form-group">
                    <label htmlFor="address">Shipping Address <span style={{color: 'var(--text-secondary)', fontWeight: 400}}>(optional)</span></label>
                    <textarea
                      id="address"
                      name="address"
                      placeholder="123 Sneaker Avenue, Ikoyi, Lagos"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      rows={2}
                      style={{
                        background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)',
                        padding: '0.8rem 1rem', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit'
                      }}
                    />
                </div>
                <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
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
