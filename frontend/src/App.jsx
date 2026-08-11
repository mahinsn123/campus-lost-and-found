import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [items, setItems] = useState([]);
  const [claimsMap, setClaimsMap] = useState({});
  const [verifiedMap, setVerifiedMap] = useState({});
  const [allClaims, setAllClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Claim Modal States
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimantName, setClaimantName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [claimantPhone, setClaimantPhone] = useState('');
  const [specificColor, setSpecificColor] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [proofDetails, setProofDetails] = useState('');
  const [proofImage, setProofImage] = useState('');

  // Claims View Modal States
  const [viewingClaimsItem, setViewingClaimsItem] = useState(null);
  const [itemClaims, setItemClaims] = useState([]);

  // Lost Owner Passcode Modal State
  const [viewingPasscodeItem, setViewingPasscodeItem] = useState(null);

  // Post Form State
  const [formData, setFormData] = useState({
    title: '', category: '', location: '', type: 'FOUND', description: '', imageUrl: '',
    posterName: '', posterStudentId: '', posterPhone: ''
  });

  const API_URL = 'http://localhost:8080/api/items';
  const CLAIM_API_URL = 'http://localhost:8080/api/claims';

  useEffect(() => {
    fetchItemsAndClaims();
  }, []);

  const fetchItemsAndClaims = async () => {
    try {
      const response = await axios.get(API_URL);
      const fetchedItems = response.data;
      setItems(fetchedItems);

      const allClaimsRes = await axios.get(CLAIM_API_URL);
      setAllClaims(allClaimsRes.data);

      const counts = {};
      const verifiedCounts = {};

      for (let item of fetchedItems) {
        if (item.type === 'FOUND') {
          const claimRes = await axios.get(`${CLAIM_API_URL}/item/${item.id}`);
          counts[item.id] = claimRes.data;

          const verified = claimRes.data.filter(c => c.status === 'VERIFIED');
          verifiedCounts[item.id] = verified;
        }
      }
      setClaimsMap(counts);
      setVerifiedMap(verifiedCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleProofImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      showBannerNotification('🎉 Post Published Successfully!');
      setFormData({ title: '', category: '', location: '', type: 'FOUND', description: '', imageUrl: '', posterName: '', posterStudentId: '', posterPhone: '' });
      await fetchItemsAndClaims();
      setActiveTab('feed');
    } catch (error) {
      alert('Failed to create post!');
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(CLAIM_API_URL, {
        itemId: claimingItem.id,
        claimantName,
        studentId,
        department,
        claimantPhone,
        specificColor,
        idCardNumber,
        proofDetails,
        proofImage
      });

      showBannerNotification(`📩 Claim Request sent to ${claimingItem.posterName || 'Finder'}!`);
      setClaimingItem(null);
      resetClaimForm();
      fetchItemsAndClaims();
    } catch (error) {
      alert('Failed to submit claim.');
    }
  };

  const resetClaimForm = () => {
    setClaimantName(''); setStudentId(''); setDepartment(''); setClaimantPhone('');
    setSpecificColor(''); setIdCardNumber(''); setProofDetails(''); setProofImage('');
  };

  const handleViewClaims = async (item) => {
    try {
      const res = await axios.get(`${CLAIM_API_URL}/item/${item.id}`);
      setItemClaims(res.data);
      setViewingClaimsItem(item);
    } catch (error) {
      alert('Error fetching claims');
    }
  };

  const handleVerifyOwner = async (claimId) => {
    try {
      const response = await axios.put(`${CLAIM_API_URL}/${claimId}/verify`);
      showBannerNotification(`✅ Owner Verified! Passcode Generated: ${response.data.verificationCode}`);
      handleViewClaims(viewingClaimsItem);
      fetchItemsAndClaims();
    } catch (error) {
      alert('Failed to verify owner');
    }
  };

  // ✅ উভয় (FOUND & LOST) পোস্ট এক সাথে RESOLVED মার্ক করার ফাংশন
  const handleTakeItAndOk = async (foundItemId, matchingLostItemId = null) => {
    try {
      // 1. Mark FOUND Item as Resolved
      await axios.put(`${API_URL}/${foundItemId}/resolve`);

      // 2. If matching LOST item exists or passed, Mark it as Resolved too
      if (matchingLostItemId) {
        await axios.put(`${API_URL}/${matchingLostItemId}/resolve`);
      }

      showBannerNotification("🎉 Item Received & Both Lost/Found Posts Marked as Resolved!");
      setViewingClaimsItem(null);
      setViewingPasscodeItem(null);
      fetchItemsAndClaims();
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const showBannerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.location && item.location.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower));

    const matchesCategory = selectedCategory === 'ALL' || item.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper to find verified claim for LOST item matching student ID or title
  const getVerifiedClaimForLostItem = (lostItem) => {
    return allClaims.find(claim =>
        claim.status === 'VERIFIED' &&
        (claim.studentId === lostItem.posterStudentId || claim.claimantPhone === lostItem.posterPhone)
    );
  };

  return (
      <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', paddingBottom: '60px' }}>

        {/* Banner Notification */}
        {notification && (
            <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '14px 20px', textAlign: 'center', fontWeight: '700', fontSize: '15px', position: 'sticky', top: 0, zIndex: 2000, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>
              {notification}
            </div>
        )}

        {/* Navigation Bar */}
        <nav style={{ backgroundColor: '#1e293b', padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🔎</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
                Campus Lost & Found Portal
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px' }}>SECURE VERIFIED HANDOVER PLATFORM</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <button onClick={() => setActiveTab('feed')} style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', backgroundColor: activeTab === 'feed' ? '#8b5cf6' : '#334155', color: '#fff' }}>🌐 Feed</button>
            <button onClick={() => setActiveTab('post')} style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', backgroundColor: activeTab === 'post' ? '#8b5cf6' : '#334155', color: '#fff' }}>➕ Create Post</button>
          </div>
        </nav>

        <div style={{ maxWidth: '1000px', margin: '36px auto 0 auto', padding: '0 20px' }}>

          {/* PAGE 1: POST FORM */}
          {activeTab === 'post' && (
              <div style={{ backgroundColor: '#1e293b', padding: '36px', borderRadius: '24px', border: '1px solid #334155' }}>
                <h2 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '24px', fontWeight: '800' }}>📝 Create Item Announcement</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '14px', border: '1px solid #334155' }}>
                    <h4 style={{ margin: '0 0 14px 0', color: '#38bdf8', fontSize: '15px' }}>👤 Your Contact Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                      <input type="text" placeholder="Full Name *" value={formData.posterName} onChange={(e) => setFormData({ ...formData, posterName: e.target.value })} required style={darkInputStyle} />
                      <input type="text" placeholder="Student ID *" value={formData.posterStudentId} onChange={(e) => setFormData({ ...formData, posterStudentId: e.target.value })} required style={darkInputStyle} />
                      <input type="tel" placeholder="Phone Number *" value={formData.posterPhone} onChange={(e) => setFormData({ ...formData, posterPhone: e.target.value })} required style={darkInputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                    <input type="text" placeholder="Item Title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required style={darkInputStyle} />
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ ...darkInputStyle, fontWeight: '700', color: formData.type === 'LOST' ? '#f87171' : '#34d399' }}>
                      <option value="FOUND">🟢 FOUND ITEM</option>
                      <option value="LOST">🔴 LOST ITEM</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <input type="text" placeholder="Category *" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required style={darkInputStyle} />
                    <input type="text" placeholder="Location *" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required style={darkInputStyle} />
                  </div>

                  <textarea placeholder="Provide detailed description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="4" style={darkInputStyle}></textarea>

                  <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px dashed #475569' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>📷 Item Photo (Optional):</label>
                    <input type="file" accept="image/*" onChange={handlePostImageChange} style={{ color: '#94a3b8' }} />
                  </div>

                  {formData.imageUrl && (
                      <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '12px' }} />
                  )}

                  <button type="submit" style={{ padding: '16px', backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)' }}>
                    🚀 Submit Post & Go to Feed ➔
                  </button>
                </form>
              </div>
          )}

          {/* PAGE 2: FEED PAGE */}
          {activeTab === 'feed' && (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                  <input type="text" placeholder="🔍 Search Title, Category, Location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...darkInputStyle, flex: 3, padding: '14px 18px' }} />
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ ...darkInputStyle, flex: 1, padding: '14px 18px', fontWeight: '700' }}>
                    <option value="ALL">🌐 All Categories</option>
                    <option value="FOUND">🟢 Found Items</option>
                    <option value="LOST">🔴 Lost Items</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '28px' }}>
                  {filteredItems.map((item) => {
                    const claimsList = claimsMap[item.id] || [];
                    const verifiedList = verifiedMap[item.id] || [];
                    const claimCount = claimsList.length;
                    const verifiedCount = verifiedList.length;
                    const isResolved = item.status === 'RESOLVED';

                    // LOST item-এর সাথে সিঙ্ক হওয়া ক্লেইম
                    const matchedClaim = item.type === 'LOST' ? getVerifiedClaimForLostItem(item) : null;

                    return (
                        <div key={item.id} style={{ backgroundColor: '#1e293b', borderRadius: '20px', padding: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                          <div>
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '14px', marginBottom: '18px' }} />
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>{item.title}</h3>

                              {/* Status Tags */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {isResolved ? (
                                    <span style={{ fontSize: '12px', fontWeight: '800', padding: '6px 14px', borderRadius: '30px', color: '#ffffff', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ✅ HANDED OVER
                            </span>
                                ) : (
                                    <span style={{ fontSize: '12px', fontWeight: '800', padding: '6px 14px', borderRadius: '30px', color: '#ffffff', background: item.type === 'LOST' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                              {item.type}
                            </span>
                                )}
                              </div>
                            </div>

                            <div style={{ backgroundColor: '#090d16', borderLeft: '4px solid #38bdf8', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                              <p style={{ margin: '2px 0', fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>👤 Posted by: <span style={{ color: '#38bdf8' }}>{item.posterName || 'Anonymous User'}</span></p>
                              <p style={{ margin: '3px 0', fontSize: '13px', color: '#94a3b8' }}>🆔 Student ID: <strong style={{ color: '#cbd5e1' }}>{item.posterStudentId || 'N/A'}</strong> | 📞 Contact: <strong style={{ color: '#cbd5e1' }}>{item.posterPhone || 'N/A'}</strong></p>
                            </div>

                            <p style={{ margin: '4px 0', fontSize: '13px', color: '#94a3b8' }}>📍 <strong>Location:</strong> {item.location} | 📂 <strong>Category:</strong> {item.category}</p>
                            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', margin: '12px 0' }}>{item.description}</p>
                          </div>

                          {/* Action Area */}
                          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #334155' }}>

                            {/* FOUND ITEM ACTIONS */}
                            {item.type === 'FOUND' && !isResolved && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button onClick={() => setClaimingItem(item)} style={{ flex: 1, padding: '12px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                                    🛡️ Claim Item
                                  </button>

                                  <button onClick={() => handleViewClaims(item)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', position: 'relative' }}>
                                    📩 Claims
                                    {claimCount > 0 && (
                                        <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', fontWeight: '900', border: '2px solid #1e293b' }}>
                                {claimCount}
                              </span>
                                    )}
                                  </button>

                                  <button onClick={() => handleViewClaims(item)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', color: '#10b981', border: '1px solid #10b981', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', position: 'relative' }}>
                                    🔑 Passcode
                                    {verifiedCount > 0 && (
                                        <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', fontWeight: '900', border: '2px solid #1e293b' }}>
                                {verifiedCount}
                              </span>
                                    )}
                                  </button>
                                </div>
                            )}

                            {/* LOST ITEM ACTIONS */}
                            {item.type === 'LOST' && !isResolved && (
                                <div>
                                  {matchedClaim ? (
                                      <button
                                          onClick={() => setViewingPasscodeItem({ lostItem: item, claim: matchedClaim })}
                                          style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                                      >
                                        🔑 Get Verification Passcode
                                      </button>
                                  ) : (
                                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                                        ⏳ Waiting for Finder to Verify Claim
                                      </div>
                                  )}
                                </div>
                            )}

                            {/* RESOLVED STATUS BAR (SHOWS ON BOTH FOUND & LOST) */}
                            {isResolved && (
                                <div style={{ textAlign: 'center', color: '#34d399', fontWeight: '800', fontSize: '14px', backgroundColor: '#064e3b', padding: '12px', borderRadius: '10px', border: '1px solid #10b981' }}>
                                  ✅ Item Handed Over & Case Resolved
                                </div>
                            )}
                          </div>

                        </div>
                    );
                  })}
                </div>
              </div>
          )}

        </div>

        {/* Claim Form Modal */}
        {claimingItem && (
            <div style={modalOverlayStyle}>
              <div style={modalContentStyle}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>🛡️ Submit Proof to Claim: {claimingItem.title}</h3>
                <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input type="text" placeholder="Your Name *" value={claimantName} onChange={(e) => setClaimantName(e.target.value)} required style={darkInputStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="Student ID *" value={studentId} onChange={(e) => setStudentId(e.target.value)} required style={darkInputStyle} />
                    <input type="text" placeholder="Department *" value={department} onChange={(e) => setDepartment(e.target.value)} required style={darkInputStyle} />
                  </div>
                  <input type="tel" placeholder="Phone Number *" value={claimantPhone} onChange={(e) => setClaimantPhone(e.target.value)} required style={darkInputStyle} />
                  <input type="text" placeholder="Specific Color / Markings" value={specificColor} onChange={(e) => setSpecificColor(e.target.value)} style={darkInputStyle} />
                  <input type="text" placeholder="ID Card Number / Serial No" value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} style={darkInputStyle} />
                  <textarea placeholder="Secret details to prove ownership..." value={proofDetails} onChange={(e) => setProofDetails(e.target.value)} required rows="3" style={darkInputStyle}></textarea>

                  <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px dashed #475569' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>📷 ID / Photo Proof:</label>
                    <input type="file" accept="image/*" onChange={handleProofImageChange} style={{ color: '#94a3b8', fontSize: '12px' }} />
                  </div>

                  {proofImage && <img src={proofImage} alt="Proof" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button type="submit" style={{ flex: 1, padding: '14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800' }}>Submit</button>
                    <button type="button" onClick={() => setClaimingItem(null)} style={{ padding: '14px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '10px' }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Claims View Modal (For FOUND post) */}
        {viewingClaimsItem && (
            <div style={modalOverlayStyle}>
              <div style={{ ...modalContentStyle, width: '600px' }}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>📩 Submitted Claims</h3>

                {itemClaims.length === 0 ? <p style={{ color: '#94a3b8' }}>No claims submitted for this item yet.</p> : itemClaims.map((claim) => (
                    <div key={claim.id} style={{ border: '1px solid #334155', padding: '18px', borderRadius: '14px', marginBottom: '16px', backgroundColor: '#0f172a' }}>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}>👤 <strong>Claimant:</strong> <span style={{ color: '#38bdf8' }}>{claim.claimantName}</span></p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}>🆔 <strong>Student ID:</strong> {claim.studentId} | <strong>Dept:</strong> {claim.department}</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}>📞 <strong>Phone:</strong> {claim.claimantPhone}</p>
                      {claim.specificColor && <p style={{ margin: '4px 0', fontSize: '14px', color: '#fbbf24' }}>🎨 <strong>Color/Marking:</strong> {claim.specificColor}</p>}
                      <p style={{ margin: '10px 0', fontSize: '14px', color: '#cbd5e1' }}>🔒 <strong>Proof Details:</strong> {claim.proofDetails}</p>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #334155' }}>
                        {claim.status === 'VERIFIED' ? (
                            <div style={{ backgroundColor: '#064e3b', padding: '16px', borderRadius: '12px', color: '#34d399', border: '1px solid #059669' }}>
                              <div style={{ fontWeight: '800', textAlign: 'center', fontSize: '15px' }}>✅ VERIFIED MATCH!</div>

                              <div style={{ fontSize: '16px', color: '#f8fafc', margin: '10px 0', backgroundColor: '#022c22', padding: '10px', borderRadius: '8px', border: '1px solid #10b981', textAlign: 'center' }}>
                                🔑 Verification Passcode: <strong>{claim.verificationCode}</strong>
                              </div>

                              <button
                                  onClick={() => handleTakeItAndOk(viewingClaimsItem.id)}
                                  style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
                              >
                                🤝 Take It & OK (Mark Handed Over)
                              </button>
                            </div>
                        ) : (
                            <button onClick={() => handleVerifyOwner(claim.id)} style={{ padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', width: '100%', cursor: 'pointer' }}>
                              ✔ Confirm Match & Generate Passcode
                            </button>
                        )}
                      </div>

                    </div>
                ))}

                <button onClick={() => setViewingClaimsItem(null)} style={{ padding: '14px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', fontWeight: '700' }}>Close</button>
              </div>
            </div>
        )}

        {/* LOST Owner Get Passcode Modal */}
        {viewingPasscodeItem && (
            <div style={modalOverlayStyle}>
              <div style={{ ...modalContentStyle, width: '450px', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, color: '#f8fafc' }}>🔑 Verification Passcode Received</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>The finder has verified your claim! Here is your secret passcode to present during pickup:</p>

                <div style={{ fontSize: '28px', color: '#38bdf8', fontWeight: '900', letterSpacing: '4px', margin: '20px 0', backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px dashed #38bdf8' }}>
                  {viewingPasscodeItem.claim.verificationCode}
                </div>

                <button
                    onClick={() => handleTakeItAndOk(viewingPasscodeItem.claim.itemId, viewingPasscodeItem.lostItem.id)}
                    style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginBottom: '10px' }}
                >
                  🤝 Receive & Complete Handover
                </button>

                <button onClick={() => setViewingPasscodeItem(null)} style={{ padding: '12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', width: '100%', fontWeight: '700' }}>
                  Close
                </button>
              </div>
            </div>
        )}

      </div>
  );
}

const darkInputStyle = {
  width: '100%', padding: '12px 16px', backgroundColor: '#0f172a', color: '#f8fafc',
  border: '1px solid #334155', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: '#1e293b', padding: '32px', borderRadius: '20px',
  width: '520px', maxHeight: '88vh', overflowY: 'auto', border: '1px solid #334155'
};

export default App;