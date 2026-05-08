import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Store, ShoppingCart, Heart, Trash2, Truck, Headphones, Tag, CreditCard, Package, CheckCircle, PartyPopper, LogOut, ShoppingBag, Users, PlusSquare, List, Ban } from 'lucide-react';
import '../App.css';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: 'Guest', email: '', phone: '', avatar: '', address: '', id: 0 };
};

function StoreClient() {
  const [activeView, setActiveView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [role] = useState(localStorage.getItem('role') || 'user');
  const [products, setProducts] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const navigate = useNavigate();

  // Editable account form state
  const [editName, setEditName] = useState(currentUser.name || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editAddress, setEditAddress] = useState(currentUser.address || '');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(currentUser.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync form state when currentUser changes
  const refreshUserFields = useCallback((user: any) => {
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditAddress(user.address || '');
    setEditAvatarPreview(user.avatar || '');
    setEditAvatarFile(null);
  }, []);

  useEffect(() => {
    fetch('https://solesbys.onrender.com/api/products')
      .then(res => res.json())
      .then(data => {
        if(data && data.length > 0) {
          // Add default sz/qty properties for the client logic
          const mapped = data.map((d: any) => ({...d, image: d.imageUrl, rating: d.rating || 5}));
          setProducts(mapped);
        }
      })
      .catch(console.error);

    if (role === 'admin') {
      fetch('https://solesbys.onrender.com/api/users')
        .then(res => res.json())
        .then(data => setDbUsers(data))
        .catch(console.error);
    }
  }, [role, activeView]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartTax = cartSubtotal * 0.05;
  const cartTotal = cartSubtotal + cartTax;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      setActiveView('search');
    }
  };

  const renderHomeContent = () => (
    <>
      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon"><Search size={18} /></span>
          <input 
            type="text" 
            placeholder="Search shop (press Enter to search)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <span className="search-shortcut">⌘ K</span>
        </div>
      </div>


      <div className="section-header">
        <h2>Special Offers</h2>
        <span className="see-all" style={{cursor: 'pointer'}} onClick={() => setActiveView('products')}>See All &gt;</span>
      </div>
      
      <div className="special-offers-grid">
        {products.filter(p => p.isSpecialOffer).slice(0, 3).map((p, i) => (
            <div key={p.id} className={`offer-card ${i === 0 ? 'main-offer' : 'secondary-offer ' + (i===1 ? 'light-green' : 'light-blue')}`}>
              {i === 0 ? (
                <div className="offer-content">
                  <span className="discount-badge">SAVE 25%</span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="offer-actions">
                    {role !== 'admin' && <button className="btn-dark" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} /> Add to Cart</button>}
                    <span className="offer-price">₦{p.price.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="discount-badge">SAVE 25%</span>
                  <h3>{p.name}</h3>
                  {role !== 'admin' && <button className="btn-light" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}><ShoppingCart size={16} /> Add to Cart</button>}
                  <div className="offer-price-centered">₦{p.price.toLocaleString()}</div>
                </>
              )}
              <img src={p.image} alt={p.name} className={i === 0 ? 'offer-img-large' : 'offer-img-small'} />
            </div>
        ))}
        {products.filter(p => p.isSpecialOffer).length === 0 && <p style={{gridColumn: '1/-1', color: 'var(--text-secondary)'}}>No special offers right now.</p>}
      </div>

      <div className="section-header">
        <h2>New Arrivals</h2>
        <span className="see-all" style={{cursor: 'pointer'}} onClick={() => setActiveView('products')}>See All &gt;</span>
      </div>
      
      <div className="products-grid">
        {products.filter(p => !p.isSpecialOffer).slice(0, 4).map(product => (
          <div key={product.id} className="product-card">
            <div className="product-img-wrapper" onClick={() => setActiveView('cart')} style={{cursor:'pointer'}}>
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                <div style={{display: 'flex', gap: '4px'}}>
                  <button className="add-to-cart-small" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>Details</button>
                  {role !== 'admin' && <button className="add-to-cart-small" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="features-grid" style={{marginTop: '3.5rem'}}>
        <div className="feature-card">
          <div className="feature-icon text-blue"><Truck size={32} /></div>
          <div>
            <div className="feature-title">Free Delivery</div>
            <div className="feature-desc">No extra shipping costs</div>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon text-green"><Headphones size={32} /></div>
          <div>
            <div className="feature-title">24/7 Support</div>
            <div className="feature-desc">Help anytime, anywhere</div>
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon text-purple"><Tag size={32} /></div>
          <div>
            <div className="feature-title">Discounts</div>
            <div className="feature-desc">Save big on top deals</div>
          </div>
        </div>
      </div>
    </>
  );

  const renderProductsContent = () => (
    <div className="account-container" style={{maxWidth: '1200px'}}>
      <div className="section-header" style={{marginBottom: '2rem'}}>
        <h2>All Special Products</h2>
      </div>

      <div className="special-offers-grid" style={{marginBottom: '4rem'}}>
        {products.filter(p => p.isSpecialOffer).map((p, i) => (
            <div key={p.id} className={`offer-card ${i === 0 ? 'main-offer' : 'secondary-offer ' + (i%2===1 ? 'light-green' : 'light-blue')}`}>
              {i === 0 ? (
                <div className="offer-content">
                  <span className="discount-badge">SAVE 25%</span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="offer-actions">
                    {role !== 'admin' && <button className="btn-dark" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} /> Add to Cart</button>}
                    <span className="offer-price">₦{p.price.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="discount-badge">SAVE 25%</span>
                  <h3>{p.name}</h3>
                  {role !== 'admin' && <button className="btn-light" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}><ShoppingCart size={16} /> Add to Cart</button>}
                  <div className="offer-price-centered">₦{p.price.toLocaleString()}</div>
                </>
              )}
              <img src={p.image} alt={p.name} className={i === 0 ? 'offer-img-large' : 'offer-img-small'} />
            </div>
        ))}
        {products.filter(p => p.isSpecialOffer).length === 0 && <p style={{gridColumn: '1/-1', color: 'var(--text-secondary)'}}>No special offers right now.</p>}
      </div>

      <div className="section-header" style={{marginBottom: '2rem'}}>
        <h2>All Shoes</h2>
        <span style={{color: 'var(--text-secondary)'}}>{products.filter(p => !p.isSpecialOffer).length} items available</span>
      </div>
      <div className="products-grid">
        {products.filter(p => !p.isSpecialOffer).map((product, i) => (
          <div key={`prod-${i}`} className="product-card">
            <div className="product-img-wrapper" onClick={() => setActiveView('cart')} style={{cursor:'pointer'}}>
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                <div style={{display: 'flex', gap: '4px'}}>
                  <button className="add-to-cart-small" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>Details</button>
                  {role !== 'admin' && <button className="add-to-cart-small" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSearchContent = () => (
    <div className="account-container" style={{maxWidth: '1200px'}}>
      <div className="search-section" style={{marginBottom: '2rem'}}>
        <div className="search-bar">
          <span className="search-icon"><Search size={18} /></span>
          <input 
            type="text" 
            placeholder="Search shop" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>
      <div className="section-header">
        <h2>Search Results {searchQuery ? `for "${searchQuery}"` : ''} </h2>
        <span style={{color: 'var(--text-secondary)'}}>{products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).length} items found</span>
      </div>
      <div className="products-grid">
        {products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((product, i) => (
          <div key={`search-${i}`} className="product-card">
            <div className="product-img-wrapper" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{cursor:'pointer'}}>
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                <button className="add-to-cart-small" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>
              </div>
            </div>
          </div>
        ))}
        {products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && <p style={{gridColumn: '1/-1', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem'}}>No products found matching "{searchQuery}".</p>}
      </div>
    </div>
  );

  const handleSaveProfile = async () => {
    if (!currentUser.id) return alert('You must be logged in to save.');
    setSavingProfile(true);
    try {
      let avatarUrl = currentUser.avatar || '';

      // Upload new avatar if file selected
      if (editAvatarFile) {
        const formData = new FormData();
        formData.append('file', editAvatarFile);
        formData.append('upload_preset', 'SOLESBYS');
        const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dr5nd8kr2/image/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.secure_url;
      }

      const res = await fetch(`https://solesbys.onrender.com/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          address: editAddress,
          avatar: avatarUrl,
          email: currentUser.email
        })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();

      const newUserData = { ...currentUser, name: updatedUser.name, phone: updatedUser.phone, address: updatedUser.address, avatar: updatedUser.avatar };
      localStorage.setItem('user', JSON.stringify(newUserData));
      setCurrentUser(newUserData);
      refreshUserFields(newUserData);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const renderAccountContent = () => (
    <div className="account-container">
      <div className="account-card">
        <div className="account-header-bg"></div>
        <div className="account-profile">
          <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => document.getElementById('edit-avatar-input')?.click()}>
            {editAvatarPreview ? (
              <img src={editAvatarPreview} alt={currentUser.name} className="account-avatar" />
            ) : (
              <div className="account-avatar" style={{width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'white'}}>
                {(currentUser.name || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--active-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-sidebar)', fontSize: '0.8rem', color: 'white'}}>✎</div>
          </div>
          <input type="file" id="edit-avatar-input" accept="image/*" style={{display: 'none'}} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { setEditAvatarFile(file); setEditAvatarPreview(URL.createObjectURL(file)); }
          }} />
          <div className="account-header-info">
            <h2>{currentUser.name || 'Guest'}</h2>
            <p className="account-member-since" style={{color: 'var(--text-secondary)'}}>{currentUser.email}</p>
          </div>
        </div>
        
        <div className="account-details-grid" style={{gap: '1.5rem'}}>
          <div className="detail-group">
            <label>Full Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '0.8rem 1rem', borderRadius: '8px'}} />
          </div>
          <div className="detail-group">
            <label>Email Address</label>
            <div className="detail-value">{currentUser.email} <span className="verified-badge">✓ Verified</span></div>
          </div>
          <div className="detail-group">
            <label>Phone Number</label>
            <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+234 812 345 6789" style={{width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '0.8rem 1rem', borderRadius: '8px'}} />
          </div>
          <div className="detail-group">
            <label>Shipping Address</label>
            <textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="123 Sneaker Avenue, Ikoyi, Lagos" rows={2} style={{width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '0.8rem 1rem', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit'}} />
          </div>
        </div>

        <div style={{padding: '0 2rem 2rem', display: 'flex', justifyContent: 'flex-end'}}>
          <button className="btn-primary" disabled={savingProfile} onClick={handleSaveProfile} style={{padding: '0.8rem 2.5rem', fontSize: '1rem', borderRadius: '10px'}}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );


  const renderOrdersContent = () => (
    <div className="account-container">
      <div className="section-header">
        <h2>Order History</h2>
        <span style={{color: 'var(--text-secondary)'}}>2 Total Orders</span>
      </div>
      <div className="orders-list" style={{padding: '0'}}>
        <div className="order-item" style={{padding: '1.5rem'}}>
          <div className="order-icon" style={{width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Package size={36} color="var(--active-blue)" /></div>
          <div className="order-info">
            <div className="order-id" style={{fontSize: '1.1rem'}}>#ORD-29837</div>
            <div className="order-date" style={{marginBottom: '0.5rem'}}>Placed on March 30, 2026</div>
            <div style={{fontSize: '0.9rem', color: 'var(--text-primary)'}}>1x Nike Air Max 270</div>
          </div>
          <div className="order-amount" style={{fontSize: '1.2rem'}}>₦210,000</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end'}}>
             <div className="order-status text-blue">In Transit (Arriving April 5)</div>
             <button style={{background: 'none', border: 'none', color: 'var(--active-blue)', cursor: 'pointer', fontWeight: 600}}>Track Package</button>
          </div>
        </div>
        
        <div className="order-item" style={{padding: '1.5rem'}}>
          <div className="order-icon" style={{width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><CheckCircle size={36} color="#10b981" /></div>
          <div className="order-info">
            <div className="order-id" style={{fontSize: '1.1rem'}}>#ORD-29112</div>
            <div className="order-date" style={{marginBottom: '0.5rem'}}>Placed on March 10, 2026</div>
            <div style={{fontSize: '0.9rem', color: 'var(--text-primary)'}}>1x Nike Air Force 1</div>
          </div>
          <div className="order-amount" style={{fontSize: '1.2rem'}}>₦145,000</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end'}}>
             <div className="order-status text-green">Delivered on March 12</div>
             <button style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600}}>Write Review</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWishlistContent = () => (
    <div className="account-container">
      <div className="section-header">
        <h2>My Wishlist (4 Items)</h2>
      </div>
      <div className="products-grid">
        {products.slice(0, 4).map(product => (
          <div key={`wish-${product.id}`} className="product-card">
            <div className="product-img-wrapper" style={{position: 'relative'}}>
              <img src={product.image} alt={product.name} />
              <button className="wishlist-remove"><Heart size={18} fill="#ef4444" color="#ef4444" /></button>
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                <button className="add-to-cart-small" onClick={() => setActiveView('cart')} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCartContent = () => {
    return (
      <div className="cart-layout">
        <div className="cart-items-section">
          <h2>Your Shopping Cart</h2>
          <div className="cart-list">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-sz">Size: {item.sz}</p>
                </div>
                <div className="cart-item-qty">
                  <button className="qty-btn">-</button>
                  <span>{item.qty}</span>
                  <button className="qty-btn">+</button>
                </div>
                <div className="cart-item-price">₦{(item.price * item.qty).toLocaleString()}</div>
                <button className="cart-item-remove" style={{color: 'var(--text-secondary)'}}><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₦{cartSubtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Estimated Tax</span>
              <span>₦{cartTax.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="text-green">Free</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₦{cartTotal.toLocaleString()}</span>
            </div>
            <button className="btn-primary checkout-btn" onClick={() => setActiveView('checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCheckoutContent = () => (
    <div className="checkout-layout">
      <div className="checkout-form-section">
        <h2>Checkout Details</h2>
        <div className="checkout-panel">
          <h3 className="panel-title">Shipping & Contact Info</h3>
          <div className="billing-grid">
            <div className="auth-form-group">
              <label>Full Name</label>
              <input type="text" defaultValue={currentUser.name} id="checkout-name" />
            </div>
            <div className="auth-form-group">
              <label>Phone Number</label>
              <input type="text" defaultValue={currentUser.phone} id="checkout-phone" />
            </div>
            <div className="auth-form-group" style={{gridColumn: '1 / -1'}}>
              <label>Email Address</label>
              <input type="email" defaultValue={currentUser.email} id="checkout-email" />
            </div>
            <div className="auth-form-group" style={{gridColumn: '1 / -1'}}>
              <label>Address</label>
              <input type="text" defaultValue={currentUser.address} id="checkout-address" />
            </div>
          </div>
        </div>
      </div>

      <div className="cart-summary-section">
        <div className="cart-summary-card">
          <h3>Your Order</h3>
          <div className="mini-cart-items">
            {cart.map(item => (
              <div key={item.id} className="mini-cart-item">
                <img src={item.image} alt={item.name} />
                <div className="mini-cart-info">
                  <div className="mini-name">{item.name}</div>
                  <div className="mini-price">₦{item.price.toLocaleString()} x {item.qty}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total-row">
            <span>Total to pay</span>
            <span style={{color: 'var(--active-blue)'}}>₦{cartTotal.toLocaleString()}</span>
          </div>
          <button className="btn-primary checkout-btn" onClick={async (e) => {
            const btn = e.target as HTMLButtonElement;
            const originalText = btn.innerText;
            btn.innerText = 'Processing...';
            btn.disabled = true;
            
            try {
              const nameInput = (document.getElementById('checkout-name') as HTMLInputElement).value;
              const phoneInput = (document.getElementById('checkout-phone') as HTMLInputElement).value;
              const emailInput = (document.getElementById('checkout-email') as HTMLInputElement).value;
              const addressInput = (document.getElementById('checkout-address') as HTMLInputElement).value;

              // Format the HTML for the email
              let orderHtml = `<h2 style="color: #333;">New Order from ${nameInput}</h2>`;
              orderHtml += `<p><strong>Email:</strong> ${emailInput}</p>`;
              orderHtml += `<p><strong>Phone:</strong> ${phoneInput}</p>`;
              orderHtml += `<p><strong>Address:</strong> ${addressInput}</p>`;
              orderHtml += `<hr/><table style="width:100%; text-align:left; border-collapse: collapse;">`;
              
              cart.forEach(item => {
                orderHtml += `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;"><img src="${item.image}" width="80" style="border-radius:8px;" alt="${item.name}"/></td>
                    <td style="padding: 10px;"><strong>${item.name}</strong><br/>Size: ${item.sz}<br/>Qty: ${item.qty}</td>
                    <td style="padding: 10px;">₦${(item.price * item.qty).toLocaleString()}</td>
                  </tr>
                `;
              });
              orderHtml += `</table><h3 style="text-align:right; color:#16a34a;">Total: ₦${cartTotal.toLocaleString()}</h3>`;

              const templateParams = {
                name: nameInput,
                message: orderHtml
              };

              // @ts-ignore
              const emailjs = await import('@emailjs/browser');
              
              await emailjs.send(
                'service_hwhjrqg', 
                'template_ydjj7t7', 
                templateParams, 
                'y_0cBKXpEZWojP39z'
              );
              
              setCart([]);
              setActiveView('order-success');
            } catch (err) {
              console.error('EmailJS Error:', err);
              alert('Failed to send email. Please check your template ID.');
            } finally {
              btn.innerText = originalText;
              btn.disabled = false;
            }
          }}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrderSuccessContent = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    
    return (
      <div className="account-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div className="account-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
          <div style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', background: 'var(--active-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PartyPopper size={40} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Order Placed!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            Thank you for shopping with Soles By S. Your order details have been securely transmitted to our team!
          </p>
          
          <div style={{ background: 'var(--bg-app)', padding: '2rem', borderRadius: '12px', marginBottom: '2.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Estimated Delivery Time</div>
            <div style={{ color: 'var(--active-blue)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' }}>3 - 5 Business Days</div>
            
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
            
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.85rem' }}>Expected Arrival By</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: '700' }}>
              {deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <button className="btn-primary" onClick={() => setActiveView('home')} style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '12px' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  };

  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', brand: '', isSpecialOffer: false });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert('Please select an image');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', 'SOLESBYS');
      
      const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dr5nd8kr2/image/upload', {
        method: 'POST',
        body: formData
      });
      if(!uploadRes.ok) throw new Error("Cloudinary upload failed");
      const uploadData = await uploadRes.json();
      
      const productPayload = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        brand: newProduct.brand,
        imageUrl: uploadData.secure_url,
        isSpecialOffer: newProduct.isSpecialOffer,
        discountPercentage: newProduct.isSpecialOffer ? 25 : 0,
        rating: 5.0
      };

      await fetch('https://solesbys.onrender.com/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      alert('Product added successfully!');
      setNewProduct({ name: '', description: '', price: '', brand: '', isSpecialOffer: false });
      setImageFile(null);
      setActiveView('manage-products');
    } catch (err) {
      console.error(err);
      alert('Failed to add product');
    } finally {
      setUploading(false);
    }
  };

  const renderAddProductContent = () => (
    <div className="account-container" style={{maxWidth: '800px'}}>
      <div className="section-header" style={{marginBottom: '2rem'}}><h2>Add New Product</h2></div>
      <div className="account-card" style={{padding: '3rem'}}>
        <form onSubmit={handleAddProduct} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div className="auth-form-group">
            <label>Product Name</label>
            <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{border: '1px solid var(--border-color)'}} />
          </div>
          <div className="auth-form-group">
            <label>Brand</label>
            <input type="text" required value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} style={{border: '1px solid var(--border-color)'}} />
          </div>
          <div className="auth-form-group">
            <label>Description</label>
            <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white', padding: '1rem', borderRadius: '8px', minHeight: '100px'}} />
          </div>
          <div className="auth-form-group">
            <label>Price (₦)</label>
            <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{border: '1px solid var(--border-color)'}} />
          </div>
          <div className="auth-form-group" style={{flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
            <input type="checkbox" checked={newProduct.isSpecialOffer} onChange={e => setNewProduct({...newProduct, isSpecialOffer: e.target.checked})} style={{width: '20px', height: '20px'}} />
            <label style={{marginBottom: 0, fontSize: '1rem', color: 'var(--text-primary)'}}>Mark as Special Offer</label>
          </div>
          <div className="auth-form-group">
            <label>Product Image</label>
            <input type="file" accept="image/*" required onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} style={{border: '1px solid var(--border-color)', padding: '0.5rem'}} />
          </div>
          <button type="submit" className="btn-primary" disabled={uploading} style={{marginTop: '1rem', padding: '1rem', fontSize: '1.1rem'}}>
            {uploading ? 'Uploading & Saving...' : 'Publish Product'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderManageProductsContent = () => (
    <div className="account-container">
      <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h2>Manage Inventory</h2>
          <span style={{color: 'var(--text-secondary)'}}>{products.length} products total</span>
        </div>
        <button className="btn-primary" onClick={() => setActiveView('add-product')} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><PlusSquare size={18} /> Add New Product</button>
      </div>
      <div className="account-card" style={{padding: '1.5rem'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)'}}>
              <th style={{padding: '1rem'}}>Product</th>
              <th style={{padding: '1rem'}}>Price</th>
              <th style={{padding: '1rem'}}>Brand</th>
              <th style={{padding: '1rem'}}>Type</th>
              <th style={{padding: '1rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                <td style={{padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <img src={p.image} alt={p.name} style={{width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(255,255,255,0.05)'}} />
                  <span style={{fontWeight: 600}}>{p.name}</span>
                </td>
                <td style={{padding: '1rem', fontWeight: 600}}>₦{p.price.toLocaleString()}</td>
                <td style={{padding: '1rem'}}>{p.brand || 'N/A'}</td>
                <td style={{padding: '1rem'}}>
                  {p.isSpecialOffer ? <span className="verified-badge" style={{background: 'rgba(217,119,6,0.2)', color: '#fbbf24'}}>Special Offer</span> : <span className="verified-badge">Standard</span>}
                </td>
                <td style={{padding: '1rem'}}>
                  <button onClick={async () => {
                    if(confirm('Delete this product?')) {
                      await fetch(`https://solesbys.onrender.com/api/products/${p.id}`, { method: 'DELETE' });
                      setProducts(products.filter(prod => prod.id !== p.id));
                    }
                  }} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderManageUsersContent = () => (
    <div className="account-container">
      <div className="section-header">
        <h2>Manage Users</h2>
        <span style={{color: 'var(--text-secondary)'}}>{dbUsers.length} total registered accounts</span>
      </div>
      <div className="account-card" style={{padding: '1.5rem'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)'}}>
              <th style={{padding: '1rem'}}>ID</th>
              <th style={{padding: '1rem'}}>Name</th>
              <th style={{padding: '1rem'}}>Email</th>
              <th style={{padding: '1rem'}}>Status</th>
              <th style={{padding: '1rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dbUsers.map(u => (
              <tr key={u.id} style={{borderBottom: '1px solid var(--border-color)', opacity: u.isSuspended ? 0.6 : 1}}>
                <td style={{padding: '1rem'}}>{u.id}</td>
                <td style={{padding: '1rem', fontWeight: 600}}>{u.name || 'N/A'}</td>
                <td style={{padding: '1rem'}}>{u.email}</td>
                <td style={{padding: '1rem'}}>
                  {u.isSuspended ? <span className="verified-badge" style={{background: 'rgba(239,68,68,0.2)', color: '#ef4444'}}>Suspended</span> : <span className="verified-badge">Active</span>}
                </td>
                <td style={{padding: '1rem', display: 'flex', gap: '1rem'}}>
                  <button onClick={async () => {
                    await fetch(`https://solesbys.onrender.com/api/users/${u.id}/suspend`, { method: 'PUT' });
                    setDbUsers(dbUsers.map(user => user.id === u.id ? {...user, isSuspended: !user.isSuspended} : user));
                  }} style={{background: 'none', border: 'none', color: u.isSuspended ? '#4ade80' : '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <Ban size={16}/> {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button onClick={async () => {
                    if(confirm('Permanently delete this user?')) {
                      await fetch(`https://solesbys.onrender.com/api/users/${u.id}`, { method: 'DELETE' });
                      setDbUsers(dbUsers.filter(user => user.id !== u.id));
                    }
                  }} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProductDetailsContent = () => {
    if (!selectedProduct) return null;
    return (
      <div className="account-container" style={{maxWidth: '1000px'}}>
        <div style={{display: 'flex', gap: '3rem', background: 'var(--bg-sidebar)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)'}}>
          <div style={{flex: '1'}}>
            <img src={selectedProduct.image} alt={selectedProduct.name} style={{width: '100%', borderRadius: '12px', objectFit: 'cover'}} />
          </div>
          <div style={{flex: '1', display: 'flex', flexDirection: 'column'}}>
            <div style={{color: 'var(--active-blue)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase'}}>{selectedProduct.brand}</div>
            <h2 style={{fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)'}}>{selectedProduct.name}</h2>
            <div style={{fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)'}}>₦{selectedProduct.price.toLocaleString()}</div>
            
            <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem'}}>
              {selectedProduct.description}
            </p>

            <div style={{marginTop: 'auto', display: 'flex', gap: '1rem'}}>
              {role !== 'admin' && (
                <button className="btn-primary" onClick={() => setActiveView('cart')} style={{flex: 2, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.1rem'}}>
                  <ShoppingCart size={20} /> Add to Cart
                </button>
              )}
              <button className="btn-light" onClick={() => setActiveView('products')} style={{flex: 1, padding: '1rem', fontSize: '1.1rem'}}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="User" style={{width: 36, height: 36, borderRadius: '50%', objectFit: 'cover'}} />
          ) : (
            <div style={{width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0}}>{(currentUser.name || 'G').charAt(0).toUpperCase()}</div>
          )}
          <span className="logo-text" style={{fontSize: '1rem', fontWeight: 600}}>{currentUser.name || 'Guest'}</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className={`nav-item ${activeView === 'home' ? 'active-parent' : ''}`} onClick={() => setActiveView('home')}>
              <span className="nav-icon"><Store size={18} /></span> Home
            </div>
            <div className={`nav-item ${activeView === 'products' ? 'active-parent' : ''}`} onClick={() => setActiveView('products')}>
              <span className="nav-icon"><ShoppingBag size={18} /></span> All Products
            </div>
            {role !== 'admin' && (
              <>
                <div className={`nav-item ${activeView === 'cart' ? 'active-parent' : ''}`} onClick={() => setActiveView('cart')}>
                  <span className="nav-icon"><ShoppingCart size={18} /></span> Cart
                </div>
                <div className={`nav-item ${activeView === 'wishlist' ? 'active-parent' : ''}`} onClick={() => setActiveView('wishlist')}>
                  <span className="nav-icon"><Heart size={18} /></span> Wishlist
                </div>
                <div className={`nav-item ${activeView === 'checkout' ? 'active-parent' : ''}`} onClick={() => setActiveView('checkout')}>
                  <span className="nav-icon"><CreditCard size={18} /></span> Checkout
                </div>
                <div className={`nav-item ${activeView === 'orders' ? 'active-parent' : ''}`} onClick={() => setActiveView('orders')}>
                  <span className="nav-icon"><Package size={18} /></span> My Orders
                </div>
              </>
            )}
          </div>

          {role === 'admin' && (
            <>
              <div className="nav-section-title">ADMINISTRATION</div>
              <div className="nav-group">
                <div className={`nav-item ${activeView === 'manage-products' ? 'active-parent' : ''}`} onClick={() => setActiveView('manage-products')}>
                  <span className="nav-icon"><List size={18} /></span> Manage Inventory
                </div>
                <div className={`nav-item ${activeView === 'add-product' ? 'active-parent' : ''}`} onClick={() => setActiveView('add-product')}>
                  <span className="nav-icon"><PlusSquare size={18} /></span> Add Product
                </div>
                <div className={`nav-item ${activeView === 'manage-users' ? 'active-parent' : ''}`} onClick={() => setActiveView('manage-users')}>
                  <span className="nav-icon"><Users size={18} /></span> Manage Users
                </div>
              </div>
            </>
          )}

          <div className="nav-section-title">USER</div>
          <div className="nav-group">
            <div className={`nav-item ${activeView === 'account' ? 'active-parent' : ''}`} onClick={() => setActiveView('account')}>
              <span className="nav-icon"><Settings size={18} /></span> My Account
            </div>

            <div className="nav-item" onClick={() => { localStorage.removeItem('role'); localStorage.removeItem('user'); navigate('/login'); }}>
              <span className="nav-icon"><LogOut size={18} /></span> Sign Out
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.1em', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SOLES BY S
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setActiveView('account')}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="User" style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover'}} />
              ) : (
                <div style={{width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white'}}>{(currentUser.name || 'G').charAt(0).toUpperCase()}</div>
              )}
            </button>
            {role !== 'admin' && (
              <>
                <button className="icon-btn" onClick={() => setActiveView('wishlist')}><Heart size={20} color="var(--text-secondary)" /></button>
                <button className="cart-btn" onClick={() => setActiveView('cart')}>
                  <ShoppingCart size={20} /> <span className="cart-count">{cart.length}</span>
                  <div className="cart-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">₦{cartTotal.toLocaleString()}</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </header>

        <div className="content-container">
          {activeView === 'home' && renderHomeContent()}
          {activeView === 'products' && renderProductsContent()}
          {activeView === 'product-details' && renderProductDetailsContent()}
          {activeView === 'search' && renderSearchContent()}
          {activeView === 'account' && renderAccountContent()}

          {activeView === 'manage-products' && renderManageProductsContent()}
          {activeView === 'add-product' && renderAddProductContent()}
          {activeView === 'manage-users' && renderManageUsersContent()}

          {activeView === 'wishlist' && renderWishlistContent()}
          {activeView === 'cart' && renderCartContent()}
          {activeView === 'checkout' && renderCheckoutContent()}
          {activeView === 'orders' && renderOrdersContent()}
          {activeView === 'order-success' && renderOrderSuccessContent()}

          <footer className="footer-simple" style={{ marginTop: '2rem' }}>
            <span>2026© SP Inc.</span>
            <div className="footer-links">
              <a href="#">Docs</a>
              <a href="#">FAQ</a>
              <a href="#">Support</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default StoreClient;
