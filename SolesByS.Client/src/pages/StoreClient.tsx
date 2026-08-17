import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Store, ShoppingCart, Heart, Trash2, Headphones, Tag, CreditCard, Package, PartyPopper, LogOut, ShoppingBag, Users, PlusSquare, List, Ban, Edit2, Menu, X } from 'lucide-react';
import '../App.css';

const colorToCss = (name: string): string => {
  const m: Record<string,string> = {
    black:'#111',white:'#f0f0f0',red:'#ef4444',blue:'#3b82f6',green:'#22c55e',
    yellow:'#eab308',orange:'#f97316',purple:'#a855f7',pink:'#ec4899',
    gray:'#6b7280',grey:'#6b7280',brown:'#78350f',navy:'#1e3a8a',beige:'#d4b896',
    cream:'#fef9ef',gold:'#fbbf24',silver:'#94a3b8',tan:'#c9a87c',
    maroon:'#7f1d1d',teal:'#0d9488',cyan:'#06b6d4',lime:'#84cc16',
    rose:'#f43f5e',violet:'#8b5cf6',
  };
  return m[name.toLowerCase().trim()] || '#6b7280';
};

type VariantItem = {color:string; imageUrl:string; file:File|null; preview:string};

const parseVariants = (product: any): {color:string;imageUrl:string}[] => {
  try { if (product.variants) return JSON.parse(product.variants); } catch {}
  return [];
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: 'Guest', email: '', phone: '', avatar: '', address: '', id: 0 };
};

function StoreClient() {
  const [activeView, setActiveViewRaw] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setViewHistory] = useState<string[]>(['home']);

  const setActiveView = (view: string) => {
    setViewHistory(prev => [...prev, view]);
    window.history.pushState({ view }, '', window.location.pathname);
    setActiveViewRaw(view);
  };

  // Handle browser back button
  useEffect(() => {
    const handlePop = () => {
      setViewHistory(prev => {
        if (prev.length > 1) {
          const newHistory = prev.slice(0, -1);
          setActiveViewRaw(newHistory[newHistory.length - 1]);
          return newHistory;
        }
        return prev;
      });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('solesbys_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('solesbys_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  useEffect(() => {
    localStorage.setItem('solesbys_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('solesbys_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('solesbys_orders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Cart functions
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, sz: product.size || 'N/A' }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  // Wishlist functions
  const toggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  const isInWishlist = (id: number) => wishlist.some(item => item.id === id);
  const [role] = useState(localStorage.getItem('role') || 'user');
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const navigate = useNavigate();

  useEffect(() => {
    // Background sync to DB after 5 minutes
    if (currentUser?.id) {
      const timer = setTimeout(() => {
        fetch(`https://solesbys.onrender.com/api/cart/${currentUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartData: JSON.stringify(cart) })
        }).catch((err) => console.error("Cart sync failed", err));
      }, 300000); // 5 minutes
      
      return () => clearTimeout(timer);
    }
  }, [cart, currentUser?.id]);

  // Load cart from DB if user logs in and local cart is empty
  useEffect(() => {
    if (currentUser?.id && cart.length === 0) {
      fetch(`https://solesbys.onrender.com/api/cart/${currentUser.id}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('No cart in DB');
        })
        .then(data => {
          if (data && data.cartData) {
            const dbCart = JSON.parse(data.cartData);
            if (Array.isArray(dbCart) && dbCart.length > 0) {
              setCart(dbCart);
            }
          }
        })
        .catch(() => console.log('No existing DB cart found or failed to load.'));
    }
  }, [currentUser?.id, cart.length]);

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

  useEffect(() => { setSelectedVariantIdx(0); }, [selectedProduct]);

  const fetchProducts = () => {
    setProductsLoading(true);
    setProductsError(false);
    fetch('https://solesbys.onrender.com/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if(data && Array.isArray(data)) {
          const mapped = data.map((d: any) => ({...d, image: d.imageUrl, rating: d.rating || 5}));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error(err);
        setProductsError(true);
      })
      .finally(() => setProductsLoading(false));
  };

  useEffect(() => {
    fetchProducts();

    if (role === 'admin') {
      fetch('https://solesbys.onrender.com/api/users')
        .then(res => res.json())
        .then(data => setDbUsers(data))
        .catch(console.error);
    }
  }, [role, activeView]);

  const [shippingMethod, setShippingMethod] = useState('delivery'); // 'delivery', 'pickup'
  
  const getShippingCost = () => {
    return 0; // No shipping fees
  };

  const getShippingLabel = () => {
    switch(shippingMethod) {
      case 'delivery': return 'Home Delivery';
      case 'pickup': return 'Pick Up';
      default: return '';
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartTotal = cartSubtotal + (activeView === 'checkout' ? getShippingCost() : 0);

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
            placeholder="Search shop" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {productsLoading ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'1rem',textAlign:'center'}}>
          <div className="login-spinner" style={{width:40,height:40,borderWidth:3}} />
          <span style={{color:'var(--text-secondary)'}}>Loading products...<br/><span style={{fontSize:'0.8rem'}}>(This may take up to 50s if the server is waking up)</span></span>
        </div>
      ) : productsError ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'1rem',textAlign:'center'}}>
          <span style={{color:'var(--text-secondary)'}}>Failed to load products. The server might still be waking up.</span>
          <button onClick={fetchProducts} className="btn-primary" style={{padding: '0.5rem 1.5rem', borderRadius: '8px'}}>Try Again</button>
        </div>
      ) : (<>


      <div className="section-header">
        <h2>Special Offers</h2>
        <span className="see-all" style={{cursor: 'pointer'}} onClick={() => setActiveView('products')}>See All &gt;</span>
      </div>
      
      <div className="special-offers-grid">
        {products.filter(p => p.isSpecialOffer).slice(0, 3).map((p, i) => (
            <div key={p.id} className={`offer-card ${i === 0 ? 'main-offer' : 'secondary-offer ' + (i===1 ? 'light-green' : 'light-blue')}`}>
              {i === 0 ? (
                <div className="offer-content">
                  <span className="discount-badge">SAVE {p.discountPercentage || 25}%</span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="offer-actions">
                    {role !== 'admin' && <button className="btn-dark" onClick={() => addToCart(p)} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} /> Add to Cart</button>}
                    <button className="btn-dark" onClick={() => { setSelectedProduct(p); setActiveView('product-details'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)'}}>Details</button>
                    <span className="offer-price">₦{p.price.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="discount-badge">SAVE {p.discountPercentage || 25}%</span>
                  <h3>{p.name}</h3>
                  {role !== 'admin' && <button className="btn-light" onClick={() => addToCart(p)} style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}><ShoppingCart size={16} /> Add to Cart</button>}
                  <button className="btn-light" onClick={() => { setSelectedProduct(p); setActiveView('product-details'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}>Details</button>
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
          <div key={product.id} className="product-card" style={{position: 'relative'}}>
            {role !== 'admin' && (
              <button onClick={() => toggleWishlist(product)} style={{position: 'absolute', top: '8px', right: '8px', zIndex: 2, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'}}>
                <Heart size={16} color={isInWishlist(product.id) ? '#ef4444' : 'white'} fill={isInWishlist(product.id) ? '#ef4444' : 'none'} />
              </button>
            )}
            <div className="product-img-wrapper" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{cursor:'pointer', position: 'relative'}}>
              <img src={product.image} alt={product.name} />
              {product.isSpecialOffer && product.discountPercentage > 0 && (
                <div className="discount-ribbon">{product.discountPercentage}% Off</div>
              )}
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              {(() => { const pv=parseVariants(product); return pv.length>0 ? <div style={{display:'flex',gap:'4px',marginTop:'4px',flexWrap:'wrap'}}>{pv.slice(0,6).map((v,i)=><div key={i} title={v.color} style={{width:11,height:11,borderRadius:'50%',background:colorToCss(v.color),border:'1px solid rgba(255,255,255,0.25)',flexShrink:0}} />)}{pv.length>6&&<span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>+{pv.length-6}</span>}</div> : null; })()}
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                <div style={{display: 'flex', gap: '4px'}}>
                  <button className="add-to-cart-small" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>Details</button>
                  {role !== 'admin' && <button className="add-to-cart-small" onClick={() => addToCart(product)} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="features-grid" style={{marginTop: '3.5rem'}}>

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
    </>)}
  </>
  );

  const renderProductsContent = () => (
    <div className="account-container" style={{maxWidth: '1200px'}}>
      <div className="section-header" style={{marginBottom: '2rem'}}>
        <h2>All Special Products</h2>
      </div>

      {productsLoading ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'1rem',textAlign:'center'}}>
          <div className="login-spinner" style={{width:40,height:40,borderWidth:3}} />
          <span style={{color:'var(--text-secondary)'}}>Loading products...<br/><span style={{fontSize:'0.8rem'}}>(This may take up to 50s if the server is waking up)</span></span>
        </div>
      ) : productsError ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'4rem',gap:'1rem',textAlign:'center'}}>
          <span style={{color:'var(--text-secondary)'}}>Failed to load products. The server might still be waking up.</span>
          <button onClick={fetchProducts} className="btn-primary" style={{padding: '0.5rem 1.5rem', borderRadius: '8px'}}>Try Again</button>
        </div>
      ) : (<>

      <div className="special-offers-grid" style={{marginBottom: '4rem'}}>
        {products.filter(p => p.isSpecialOffer).map((p, i) => (
            <div key={p.id} className={`offer-card ${i === 0 ? 'main-offer' : 'secondary-offer ' + (i%2===1 ? 'light-green' : 'light-blue')}`}>
              {i === 0 ? (
                <div className="offer-content">
                  <span className="discount-badge">SAVE {p.discountPercentage || 25}%</span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="offer-actions">
                    {role !== 'admin' && <button className="btn-dark" onClick={() => addToCart(p)} style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} /> Add to Cart</button>}
                    <span className="offer-price">₦{p.price.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="discount-badge">SAVE {p.discountPercentage || 25}%</span>
                  <h3>{p.name}</h3>
                  {role !== 'admin' && <button className="btn-light" onClick={() => addToCart(p)} style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}><ShoppingCart size={16} /> Add to Cart</button>}
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
          <div key={`prod-${i}`} className="product-card" style={{position: 'relative'}}>
            {role !== 'admin' && (
              <button onClick={() => toggleWishlist(product)} style={{position: 'absolute', top: '8px', right: '8px', zIndex: 2, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'}}>
                <Heart size={16} color={isInWishlist(product.id) ? '#ef4444' : 'white'} fill={isInWishlist(product.id) ? '#ef4444' : 'none'} />
              </button>
            )}
            <div className="product-img-wrapper" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{cursor:'pointer', position: 'relative'}}>
              <img src={product.image} alt={product.name} />
              {product.isSpecialOffer && product.discountPercentage > 0 && (
                <div className="discount-ribbon">{product.discountPercentage}% Off</div>
              )}
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              {(() => { const pv=parseVariants(product); return pv.length>0 ? <div style={{display:'flex',gap:'4px',marginTop:'4px',flexWrap:'wrap'}}>{pv.slice(0,6).map((v,i)=><div key={i} title={v.color} style={{width:11,height:11,borderRadius:'50%',background:colorToCss(v.color),border:'1px solid rgba(255,255,255,0.25)',flexShrink:0}} />)}{pv.length>6&&<span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>+{pv.length-6}</span>}</div> : null; })()}
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                <div style={{display: 'flex', gap: '4px'}}>
                  <button className="add-to-cart-small" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>Details</button>
                  {role !== 'admin' && <button className="add-to-cart-small" onClick={() => addToCart(product)} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
    )}
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
        <span style={{color: 'var(--text-secondary)'}}>{products.filter(p => { const q = searchQuery.toLowerCase(); return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.size?.toLowerCase().includes(q); }).length} items found</span>
      </div>
      <div className="products-grid">
        {products.filter(p => { const q = searchQuery.toLowerCase(); return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.size?.toLowerCase().includes(q); }).map((product, i) => (
          <div key={`search-${i}`} className="product-card">
            <div className="product-img-wrapper" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{cursor:'pointer'}}>
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-footer">
                <span className="price">₦{product.price.toLocaleString()}</span>
                {product.size && <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Size: {product.size}</span>}
                <button className="add-to-cart-small" onClick={() => addToCart(product)} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>
              </div>
            </div>
          </div>
        ))}
        {products.filter(p => { const q = searchQuery.toLowerCase(); return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.size?.toLowerCase().includes(q); }).length === 0 && <p style={{gridColumn: '1/-1', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem'}}>No products found matching "{searchQuery}".</p>}
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
        <span style={{color: 'var(--text-secondary)'}}>{orders.length} Order{orders.length !== 1 ? 's' : ''}</span>
      </div>
      {orders.length === 0 ? (
        <div className="account-card" style={{padding: '4rem 2rem', textAlign: 'center'}}>
          <div style={{margin: '0 auto 1.5rem', width: 80, height: 80, background: 'var(--active-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Package size={36} color="var(--text-secondary)" />
          </div>
          <h3 style={{color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem'}}>No orders yet</h3>
          <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>When you place an order, it will appear here.</p>
          <button className="btn-primary" onClick={() => setActiveView('home')} style={{padding: '0.8rem 2rem', borderRadius: '10px'}}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {orders.map((order: any) => {
            const isExpanded = expandedOrder === order.id;
            const orderDate = new Date(order.date);
            return (
              <div key={order.id} className="account-card" style={{padding: 0, overflow: 'hidden'}}>
                {/* Order header - clickable to expand */}
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  style={{padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'background 0.2s'}}
                >
                  <div style={{width: 44, height: 44, borderRadius: '12px', background: 'var(--active-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                    <Package size={22} color="var(--active-blue)" />
                  </div>
                  <div style={{flex: 1, minWidth: '120px'}}>
                    <div style={{fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem'}}>{order.id}</div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                      {orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem'}}>₦{order.total.toLocaleString()}</div>
                  <span style={{fontSize: '0.8rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981'}}>
                    {order.status}
                  </span>
                  <span style={{color: 'var(--text-secondary)', fontSize: '1.2rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
                </div>

                {/* Expanded order details */}
                {isExpanded && (
                  <div style={{borderTop: '1px solid var(--border-color)', padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.15)'}}>
                    {/* Items list */}
                    <div style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em'}}>Items Ordered</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem'}}>
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
                          <img src={item.image} alt={item.name} style={{width: 50, height: 50, borderRadius: '8px', objectFit: 'cover', background: 'rgba(255,255,255,0.05)'}} />
                          <div style={{flex: 1}}>
                            <div style={{fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)'}}>{item.name}</div>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Size: {item.sz} &middot; Qty: {item.qty}</div>
                          </div>
                          <div style={{fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem'}}>₦{(item.price * item.qty).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    {/* Order summary */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem'}}>
                      <div>
                        <div style={{color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem'}}>Subtotal</div>
                        <div style={{color: 'var(--text-primary)', fontWeight: 600}}>₦{order.subtotal.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem'}}>Delivery</div>
                        <div style={{color: 'var(--text-primary)', fontWeight: 600}}>{order.shippingLabel}</div>
                      </div>
                      <div>
                        <div style={{color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem'}}>Total</div>
                        <div style={{color: 'var(--active-blue)', fontWeight: 700, fontSize: '1.05rem'}}>₦{order.total.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Customer info */}
                    {order.customer && (
                      <div style={{marginTop: '1rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem'}}>
                        <div style={{color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.05em'}}>Shipping Details</div>
                        <div style={{color: 'var(--text-primary)'}}>{order.customer.name}</div>
                        <div style={{color: 'var(--text-secondary)'}}>{order.customer.email}</div>
                        {order.customer.phone && <div style={{color: 'var(--text-secondary)'}}>{order.customer.phone}</div>}
                        {order.customer.address && <div style={{color: 'var(--text-secondary)', marginTop: '0.25rem'}}>{order.customer.address}</div>}
                        {order.notes && <div style={{color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic'}}>Notes: {order.notes}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderWishlistContent = () => (
    <div className="account-container">
      <div className="section-header">
        <h2>My Wishlist</h2>
        <span style={{color: 'var(--text-secondary)'}}>{wishlist.length} items</span>
      </div>
      {wishlist.length === 0 ? (
        <div className="account-card" style={{padding: '4rem 2rem', textAlign: 'center'}}>
          <div style={{margin: '0 auto 1.5rem', width: 80, height: 80, background: 'var(--active-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Heart size={36} color="var(--text-secondary)" />
          </div>
          <h3 style={{color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.3rem'}}>No items in your wishlist</h3>
          <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Items you save will appear here.</p>
          <button className="btn-primary" onClick={() => setActiveView('home')} style={{padding: '0.8rem 2rem', borderRadius: '10px'}}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {wishlist.map(product => (
            <div key={`wish-${product.id}`} className="product-card" style={{position: 'relative'}}>
              <button onClick={() => toggleWishlist(product)} style={{position: 'absolute', top: '8px', right: '8px', zIndex: 2, background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                <Heart size={16} color="#ef4444" fill="#ef4444" />
              </button>
              <div className="product-img-wrapper" onClick={() => { setSelectedProduct(product); setActiveView('product-details'); }} style={{cursor:'pointer'}}>
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-footer">
                  <span className="price">₦{product.price.toLocaleString()}</span>
                  <button className="add-to-cart-small" onClick={() => addToCart(product)} style={{display: 'flex', alignItems: 'center', gap: '4px'}}><ShoppingCart size={14} /> Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
                  <button className="qty-btn" onClick={() => updateCartQty(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                </div>
                <div className="cart-item-price">₦{(item.price * item.qty).toLocaleString()}</div>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} style={{color: 'var(--text-secondary)'}}><Trash2 size={20} /></button>
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
              <span>Delivery</span>
              <span className="text-green">Calculated at checkout</span>
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
        {!currentUser.id && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Have an account? Login for faster checkout.</span>
            <button onClick={() => navigate('/login')} style={{ background: 'var(--active-blue)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Login</button>
          </div>
        )}
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
            <div className="auth-form-group" style={{gridColumn: '1 / -1'}}>
              <label>Order Notes <span style={{color: 'var(--text-secondary)', fontWeight: 400}}>(shoe size, color preferences, special requests, etc.)</span></label>
              <textarea id="checkout-notes" placeholder="e.g. Size UK 10, please double-box for protection..." rows={3} style={{background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', padding: '0.8rem 1rem', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit'}} />
            </div>
          </div>
        </div>
        
        <div className="checkout-panel">
          <h3 className="panel-title">Delivery Method</h3>
          <div className="payment-options">
            <div className={`payment-option ${shippingMethod === 'delivery' ? 'selected' : ''}`} onClick={() => setShippingMethod('delivery')}>
              <div className={`radio-circle ${shippingMethod === 'delivery' ? 'active-radio' : ''}`}></div>
              <div className="payment-info">
                <strong>Home Delivery</strong>
                <span>Extra cost will be included</span>
              </div>
            </div>
            <div className={`payment-option ${shippingMethod === 'pickup' ? 'selected' : ''}`} onClick={() => setShippingMethod('pickup')}>
              <div className={`radio-circle ${shippingMethod === 'pickup' ? 'active-radio' : ''}`}></div>
              <div className="payment-info">
                <strong>Pick Up</strong>
                <span>Pick up at our location</span>
              </div>
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
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₦{cartSubtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{getShippingLabel()}</span>
          </div>
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
              const notesInput = (document.getElementById('checkout-notes') as HTMLTextAreaElement).value;

              // Format the HTML for the email
              let orderHtml = `<h2 style="color: #333;">New Order from ${nameInput}</h2>`;
              orderHtml += `<p><strong>Email:</strong> ${emailInput}</p>`;
              orderHtml += `<p><strong>Phone:</strong> ${phoneInput}</p>`;
              orderHtml += `<p><strong>Address:</strong> ${addressInput}</p>`;
              if (notesInput) orderHtml += `<p><strong>Customer Notes:</strong> ${notesInput}</p>`;
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
              orderHtml += `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td colspan="2" style="padding: 10px; text-align: right;"><strong>Delivery Method:</strong></td>
                    <td style="padding: 10px;"><strong>${getShippingLabel()}</strong></td>
                  </tr>
              `;
              orderHtml += `</table><h3 style="text-align:right; color:#16a34a;">Total: ₦${cartTotal.toLocaleString()}</h3>`;

              const templateParams = {
                name: nameInput,
                message: orderHtml
              };

              // @ts-ignore
              const emailjs = await import('@emailjs/browser');
              
              await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID, 
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
                templateParams, 
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
              );
              
              // Save order to history
              const newOrder = {
                id: 'ORD-' + String(orders.length + 1).padStart(3, '0'),
                date: new Date().toISOString(),
                items: cart.map(item => ({ ...item })),
                subtotal: cartSubtotal,
                shippingCost: getShippingCost(),
                shippingLabel: getShippingLabel(),
                shippingMethod: shippingMethod,
                total: cartTotal,
                customer: { name: nameInput, email: emailInput, phone: phoneInput, address: addressInput },
                notes: notesInput,
                status: 'Processing'
              };
              const updatedOrders = [newOrder, ...orders];
              setOrders(updatedOrders);
              localStorage.setItem('solesbys_orders', JSON.stringify(updatedOrders));

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

  const [newProduct, setNewProduct] = useState({ name: '', price: '', brand: '', size: '', isSpecialOffer: false, discountPercentage: '', isAvailable: true });
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<VariantItem[]>([{color:'',imageUrl:'',file:null,preview:''}]);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      price: String(product.price || ''),
      brand: product.brand || '',
      size: product.size || '',
      isSpecialOffer: product.isSpecialOffer || false,
      discountPercentage: String(product.discountPercentage || ''),
      isAvailable: product.isAvailable !== false
    });
    const existing = parseVariants(product);
    if (existing.length > 0) {
      setVariants(existing.map(v => ({color:v.color, imageUrl:v.imageUrl, file:null, preview:v.imageUrl})));
    } else {
      const img = product.imageUrl || product.image || '';
      setVariants([{color:'', imageUrl:img, file:null, preview:img}]);
    }
    setActiveView('add-product');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasImage = variants.some(v => v.file || v.imageUrl);
    if (!hasImage && !editingProduct) return alert('Please add at least one product image');
    setUploading(true);
    try {
      const uploadedVariants = (await Promise.all(
        variants.map(async (v) => {
          if (v.file) {
            const fd = new FormData();
            fd.append('file', v.file);
            fd.append('upload_preset', 'SOLESBYS');
            const up = await fetch('https://api.cloudinary.com/v1_1/dr5nd8kr2/image/upload', {method:'POST',body:fd});
            if (!up.ok) throw new Error('Upload failed');
            const ud = await up.json();
            return {color: v.color, imageUrl: ud.secure_url};
          } else if (v.imageUrl) {
            return {color: v.color, imageUrl: v.imageUrl};
          }
          return null;
        })
      )).filter(Boolean) as {color:string;imageUrl:string}[];

      const primaryImageUrl = uploadedVariants[0]?.imageUrl || editingProduct?.imageUrl || editingProduct?.image || '';

      const productPayload = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        brand: newProduct.brand,
        size: newProduct.size,
        imageUrl: primaryImageUrl,
        variants: JSON.stringify(uploadedVariants),
        isSpecialOffer: newProduct.isSpecialOffer,
        discountPercentage: newProduct.isSpecialOffer ? (parseInt(newProduct.discountPercentage) || 25) : 0,
        rating: 5.0,
        isAvailable: newProduct.isAvailable
      };

      if (editingProduct) {
        await fetch(`https://solesbys.onrender.com/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(productPayload)
        });
        alert('Product updated successfully!');
      } else {
        await fetch('https://solesbys.onrender.com/api/products', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(productPayload)
        });
        alert('Product added successfully!');
      }

      setNewProduct({name:'',price:'',brand:'',size:'',isSpecialOffer:false,discountPercentage:'',isAvailable:true});
      setVariants([{color:'',imageUrl:'',file:null,preview:''}]);
      setEditingProduct(null);
      setActiveView('manage-products');
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const renderAddProductContent = () => (
    <div className="account-container" style={{maxWidth: '800px'}}>
      <div className="section-header" style={{marginBottom: '2rem'}}>
        <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
        {editingProduct && <button onClick={() => { setEditingProduct(null); setNewProduct({name:'',price:'',brand:'',size:'',isSpecialOffer:false,discountPercentage:'',isAvailable:true}); setVariants([{color:'',imageUrl:'',file:null,preview:''}]); }} style={{background:'none',border:'none',color:'var(--active-blue)',cursor:'pointer',fontWeight:600}}>+ Add New Instead</button>}
      </div>
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

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
            <div className="auth-form-group">
              <label>Price (₦)</label>
              <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{border: '1px solid var(--border-color)'}} />
            </div>
            <div className="auth-form-group">
              <label>Shoe Size</label>
              <input type="text" required placeholder="e.g. UK 9, EU 43, US 10" value={newProduct.size} onChange={e => setNewProduct({...newProduct, size: e.target.value})} style={{border: '1px solid var(--border-color)'}} />
            </div>
          </div>
          <div className="auth-form-group" style={{flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
            <input type="checkbox" checked={newProduct.isSpecialOffer} onChange={e => setNewProduct({...newProduct, isSpecialOffer: e.target.checked})} style={{width: '20px', height: '20px'}} />
            <label style={{marginBottom: 0, fontSize: '1rem', color: 'var(--text-primary)'}}>Mark as Special Offer</label>
          </div>
          {newProduct.isSpecialOffer && (
            <div className="auth-form-group">
              <label>Discount Percentage (%)</label>
              <input type="number" min="1" max="99" required placeholder="e.g. 25" value={newProduct.discountPercentage} onChange={e => setNewProduct({...newProduct, discountPercentage: e.target.value})} style={{border: '1px solid var(--border-color)'}} />
            </div>
          )}
          <div className="auth-form-group" style={{flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
            <input type="checkbox" checked={newProduct.isAvailable} onChange={e => setNewProduct({...newProduct, isAvailable: e.target.checked})} style={{width: '20px', height: '20px'}} />
            <label style={{marginBottom: 0, fontSize: '1rem', color: 'var(--text-primary)'}}>Available for Purchase</label>
          </div>
          <div className="auth-form-group">
            <label>Product Images & Color Variants</label>
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',marginTop:'0.5rem'}}>
              {variants.map((v, idx) => (
                <div key={idx} style={{display:'flex',gap:'1rem',alignItems:'flex-start',padding:'1rem',background:'rgba(0,0,0,0.2)',borderRadius:'10px',border:'1px solid var(--border-color)'}}>
                  <div style={{width:72,height:72,borderRadius:8,overflow:'hidden',flexShrink:0,background:'rgba(255,255,255,0.05)',border:'1px dashed var(--border-color)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {v.preview ? <img src={v.preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{color:'var(--text-secondary)',fontSize:'1.4rem'}}>+</span>}
                  </div>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                    <input
                      type="text"
                      placeholder="Color name (e.g. Black, White, Red)"
                      value={v.color}
                      onChange={e => setVariants(prev => prev.map((item,i) => i===idx ? {...item,color:e.target.value} : item))}
                      style={{background:'rgba(0,0,0,0.3)',border:'1px solid var(--border-color)',color:'white',padding:'0.5rem 0.75rem',borderRadius:'6px',fontSize:'0.9rem',width:'100%'}}
                    />
                    <label style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px',color:'var(--active-blue)',fontSize:'0.82rem',fontWeight:600}}>
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setVariants(prev => prev.map((item,i) => i===idx ? {...item,file,preview:URL.createObjectURL(file)} : item));
                      }} />
                      {v.preview ? '🔄 Replace Image' : '📷 Select Image'}
                    </label>
                  </div>
                  {variants.length > 1 && (
                    <button type="button" onClick={() => setVariants(prev => prev.filter((_,i) => i!==idx))} style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444',borderRadius:'6px',padding:'0.35rem 0.6rem',cursor:'pointer',flexShrink:0,fontSize:'0.85rem'}}>✕</button>
                  )}
                </div>
              ))}
              {variants.length < 6 && (
                <button type="button" onClick={() => setVariants(prev => [...prev, {color:'',imageUrl:'',file:null,preview:''}])} style={{border:'2px dashed var(--border-color)',background:'transparent',color:'var(--text-secondary)',borderRadius:'10px',padding:'0.75rem',cursor:'pointer',fontSize:'0.9rem',width:'100%'}}>
                  + Add Another Color / Image
                </button>
              )}
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={uploading} style={{marginTop: '1rem', padding: '1rem', fontSize: '1.1rem'}}>
            {uploading ? 'Uploading & Saving...' : editingProduct ? 'Update Product' : 'Publish Product'}
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
        <button className="btn-primary" onClick={() => { setEditingProduct(null); setNewProduct({name:'',price:'',brand:'',size:'',isSpecialOffer:false,discountPercentage:'',isAvailable:true}); setVariants([{color:'',imageUrl:'',file:null,preview:''}]); setActiveView('add-product'); }} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0.6rem 1.2rem', fontSize: '0.75rem'}}><PlusSquare size={22} /><span>Add New Product</span></button>
      </div>
      <div className="account-card" style={{padding: '1.5rem', overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)'}}>
              <th style={{padding: '1rem'}}>Product</th>
              <th style={{padding: '1rem'}}>Price</th>
              <th style={{padding: '1rem'}}>Brand</th>
              <th style={{padding: '1rem'}}>Type</th>
              <th style={{padding: '1rem'}}>Status</th>
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
                  {p.isAvailable !== false ? <span className="verified-badge" style={{background: 'rgba(22,163,74,0.2)', color: '#4ade80'}}>In Stock</span> : <span className="verified-badge" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171'}}>Out of Stock</span>}
                </td>
                <td style={{padding: '1rem', display: 'flex', gap: '0.75rem'}}>
                  <button onClick={() => handleEditProduct(p)} style={{background: 'none', border: 'none', color: 'var(--active-blue)', cursor: 'pointer'}}><Edit2 size={18}/></button>
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
    const p = selectedProduct;
    const hasDiscount = p.isSpecialOffer && p.discountPercentage > 0;
    const discountedPrice = hasDiscount ? Math.round(p.price * (1 - p.discountPercentage / 100)) : p.price;

    return (
      <div className="account-container" style={{maxWidth: '1000px'}}>
        <div style={{display: 'flex', gap: '3rem', background: 'var(--bg-sidebar)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-color)'}}>
            {/* Image — swaps with selected variant */}
            <div style={{flex: '1', position: 'relative'}}>
              {hasDiscount && (
                <div className="discount-ribbon" style={{top: '16px', left: '0px', fontSize: '0.85rem', padding: '0.4rem 1rem 0.4rem 1.2rem'}}>{p.discountPercentage}% Off</div>
              )}
              <div style={{background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px'}}>
                <img
                  src={parseVariants(p)[selectedVariantIdx]?.imageUrl || p.image}
                  alt={p.name}
                  style={{maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))', transition: 'opacity 0.2s'}}
                />
              </div>
            </div>

          {/* Product Info */}
          <div style={{flex: '1', display: 'flex', flexDirection: 'column'}}>
            {p.brand && (
              <div style={{color: 'var(--active-blue)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em'}}>{p.brand}</div>
            )}
            <h2 style={{fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)', lineHeight: 1.2}}>{p.name}</h2>
            
            {/* Price */}
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'}}>
              {hasDiscount ? (
                <>
                  <span style={{fontSize: '2rem', fontWeight: 700, color: '#10b981'}}>₦{discountedPrice.toLocaleString()}</span>
                  <span style={{fontSize: '1.2rem', color: 'var(--text-secondary)', textDecoration: 'line-through'}}>₦{p.price.toLocaleString()}</span>
                  <span className="discount-badge" style={{fontSize: '0.75rem'}}>SAVE {p.discountPercentage}%</span>
                </>
              ) : (
                <span style={{fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)'}}>₦{p.price.toLocaleString()}</span>
              )}
            </div>

            {/* Details Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
              {p.size && (
                <div>
                  <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem'}}>Shoe Size</div>
                  <div style={{color: 'var(--text-primary)', fontWeight: 600}}>{p.size}</div>
                </div>
              )}
              <div>
                <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem'}}>Type</div>
                <div style={{color: 'var(--text-primary)', fontWeight: 600}}>{p.isSpecialOffer ? 'Special Offer' : 'Standard'}</div>
              </div>
              {p.brand && (
                <div>
                  <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem'}}>Brand</div>
                  <div style={{color: 'var(--text-primary)', fontWeight: 600}}>{p.brand}</div>
                </div>
              )}
              <div>
                <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem'}}>Availability</div>
                <div style={{color: p.isAvailable !== false ? '#10b981' : '#ef4444', fontWeight: 600}}>{p.isAvailable !== false ? 'In Stock' : 'Out of Stock'}</div>
              </div>
            </div>

            {/* Description */}
            {p.description && (
              <div style={{marginBottom: '2rem'}}>
                <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem'}}>Description</div>
                <p style={{color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7'}}>{p.description}</p>
              </div>
            )}

            {/* Color swatch picker */}
            {(() => {
              const pv = parseVariants(p);
              const currentImg = pv[selectedVariantIdx]?.imageUrl || p.image;
              return pv.length > 0 ? (
                <div style={{marginBottom:'1.5rem'}}>
                  <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:600,marginBottom:'0.6rem'}}>
                    Color — <span style={{color:'var(--text-primary)',textTransform:'none'}}>{pv[selectedVariantIdx]?.color || 'Default'}</span>
                  </div>
                  <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                    {pv.map((v, i) => (
                      <button key={i} title={v.color} onClick={() => setSelectedVariantIdx(i)} style={{width:30,height:30,borderRadius:'50%',background:colorToCss(v.color),border:selectedVariantIdx===i?'3px solid white':'2px solid rgba(255,255,255,0.2)',cursor:'pointer',boxShadow:selectedVariantIdx===i?'0 0 0 2px var(--active-blue)':'none',transition:'all 0.2s',flexShrink:0}} />
                    ))}
                  </div>
                  {/* swap image based on selected variant */}
                  {currentImg !== p.image && (
                    <img src={currentImg} alt={p.name} style={{display:'none'}} />
                  )}
                </div>
              ) : null;
            })()}

            {/* Actions */}
            <div style={{marginTop: 'auto', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              {role !== 'admin' && (
                <>
                  <button className="btn-primary" onClick={() => {
                    const pv = parseVariants(p);
                    addToCart({...p, image: pv[selectedVariantIdx]?.imageUrl || p.image, selectedColor: pv[selectedVariantIdx]?.color || ''});
                  }} style={{flex: 2, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.1rem', borderRadius: '10px', minWidth: '140px'}}>
                    <ShoppingCart size={20} /> Add to Cart
                  </button>
                  <button onClick={() => toggleWishlist(p)} style={{padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: isInWishlist(p.id) ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', color: isInWishlist(p.id) ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s'}}>
                    <Heart size={20} fill={isInWishlist(p.id) ? '#ef4444' : 'none'} /> {isInWishlist(p.id) ? 'Wishlisted' : 'Wishlist'}
                  </button>
                </>
              )}
              <button className="btn-light" onClick={() => setActiveView('products')} style={{flex: 1, padding: '1rem', fontSize: '1.1rem', borderRadius: '10px', minWidth: '80px'}}>
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
      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="User" style={{width: 36, height: 36, borderRadius: '50%', objectFit: 'cover'}} />
          ) : (
            <div style={{width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0}}>{(currentUser.name || 'G').charAt(0).toUpperCase()}</div>
          )}
          <span className="logo-text" style={{fontSize: '1rem', fontWeight: 600, flex: 1}}>{currentUser.name || 'Guest'}</span>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}><X size={22} /></button>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className={`nav-item ${activeView === 'home' ? 'active-parent' : ''}`} onClick={() => { setActiveView('home'); setSidebarOpen(false); }}>
              <span className="nav-icon"><Store size={18} /></span> Home
            </div>
            <div className={`nav-item ${activeView === 'products' ? 'active-parent' : ''}`} onClick={() => { setActiveView('products'); setSidebarOpen(false); }}>
              <span className="nav-icon"><ShoppingBag size={18} /></span> All Products
            </div>
            {role !== 'admin' && (
              <>
                <div className={`nav-item ${activeView === 'cart' ? 'active-parent' : ''}`} onClick={() => { setActiveView('cart'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><ShoppingCart size={18} /></span> Cart
                </div>
                <div className={`nav-item ${activeView === 'wishlist' ? 'active-parent' : ''}`} onClick={() => { setActiveView('wishlist'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><Heart size={18} /></span> Wishlist
                </div>
                <div className={`nav-item ${activeView === 'checkout' ? 'active-parent' : ''}`} onClick={() => { setActiveView('checkout'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><CreditCard size={18} /></span> Checkout
                </div>
                <div className={`nav-item ${activeView === 'orders' ? 'active-parent' : ''}`} onClick={() => { setActiveView('orders'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><Package size={18} /></span> My Orders
                </div>
              </>
            )}
          </div>

          {role === 'admin' && (
            <>
              <div className="nav-section-title">ADMINISTRATION</div>
              <div className="nav-group">
                <div className={`nav-item ${activeView === 'manage-products' ? 'active-parent' : ''}`} onClick={() => { setActiveView('manage-products'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><List size={18} /></span> Manage Inventory
                </div>
                <div className={`nav-item ${activeView === 'add-product' ? 'active-parent' : ''}`} onClick={() => { setActiveView('add-product'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><PlusSquare size={18} /></span> Add Product
                </div>
                <div className={`nav-item ${activeView === 'manage-users' ? 'active-parent' : ''}`} onClick={() => { setActiveView('manage-users'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><Users size={18} /></span> Manage Users
                </div>
              </div>
            </>
          )}

          <div className="nav-section-title">USER</div>
          <div className="nav-group">
            {currentUser.id ? (
              <>
                <div className={`nav-item ${activeView === 'account' ? 'active-parent' : ''}`} onClick={() => { setActiveView('account'); setSidebarOpen(false); }}>
                  <span className="nav-icon"><Settings size={18} /></span> My Account
                </div>
                <div className="nav-item" onClick={() => { setSidebarOpen(false); localStorage.removeItem('role'); localStorage.removeItem('user'); navigate('/login'); }}>
                  <span className="nav-icon"><LogOut size={18} /></span> Sign Out
                </div>
              </>
            ) : (
              <>
                <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/login'); }}>
                  <span className="nav-icon"><LogOut size={18} /></span> Login
                </div>
                <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/register'); }}>
                  <span className="nav-icon"><Settings size={18} /></span> Create Account
                </div>
              </>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.1em', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SOLES BY S
            </div>
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
