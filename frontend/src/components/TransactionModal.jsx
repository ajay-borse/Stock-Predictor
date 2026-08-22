import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TransactionModal = ({ isOpen, type, symbol, availableShares, onClose, onSuccess }) => {
  const [modalForm, setModalForm] = useState({ quantity: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);

  // Reset form and fetch price when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalForm({ quantity: '' });
      setModalError('');
      fetchCurrentPrice();
    }
  }, [isOpen, symbol]);

  const fetchCurrentPrice = async () => {
    setPriceLoading(true);
    setPriceError(null);
    setCurrentPrice(null);
    try {
      const response = await api.post('stocks/predict/', { symbol });
      if (response && response.data && typeof response.data.current_price === 'number' && response.data.current_price > 0 && Number.isFinite(response.data.current_price)) {
        setCurrentPrice(response.data.current_price);
      } else {
        setPriceError("Current market price unavailable.\nPlease try again later.");
      }
    } catch (err) {
      setPriceError("Current market price unavailable.\nPlease try again later.");
    } finally {
      setPriceLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleModalChange = (e) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    
    const qty = parseInt(modalForm.quantity, 10);
    const prc = currentPrice;

    // Validation
    if (!qty || isNaN(qty) || qty <= 0) {
      setModalError("Quantity must be a valid number greater than 0.");
      return;
    }
    if (typeof prc !== 'number' || isNaN(prc) || prc <= 0 || !Number.isFinite(prc)) {
      setModalError("Invalid current market price. Cannot proceed.");
      return;
    }
    if (type === 'sell' && qty > availableShares) {
      setModalError(`You only own ${availableShares} shares.`);
      return;
    }

    try {
      setModalLoading(true);
      const endpoint = type === 'buy' ? 'stocks/buy/' : 'stocks/sell/';
      await api.post(endpoint, {
        symbol: symbol,
        quantity: qty,
        price: prc
      });

      onSuccess(symbol, type);
    } catch (err) {
      if (err.response?.status === 401) {
        setModalError("Session expired. Please login again.");
      } else if (err.response?.status === 400 && err.response.data) {
        // Display backend validation message
        const backendMsg = typeof err.response.data === 'object' 
          ? Object.values(err.response.data).join(' ') 
          : err.response.data;
        setModalError(backendMsg || "Invalid request.");
      } else if (!err.response) {
        setModalError("Unable to connect to the server.");
      } else {
        setModalError(`Unable to complete the ${type === 'buy' ? 'purchase' : 'sale'}.`);
      }
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{type === 'buy' ? 'Buy' : 'Sell'} {symbol}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        {type === 'sell' && (
          <p className="modal-subtitle">You own {availableShares} shares</p>
        )}
        
        {modalError && <div className="modal-error">{modalError}</div>}

        <form onSubmit={handleTransactionSubmit} className="modal-form">
          <div className="input-group">
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              className="premium-input"
              value={modalForm.quantity}
              onChange={handleModalChange}
              placeholder="Enter quantity"
              min="1"
              step="1"
              required
            />
          </div>
          <div className="input-group">
            <label>Current Market Price</label>
            {priceLoading ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                 <div style={{ width: '16px', height: '16px', border: '2px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spinRing 1s linear infinite' }}></div>
                 <span>Fetching current market price...</span>
               </div>
            ) : priceError ? (
               <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                 {priceError}
               </div>
            ) : (
               <div className="premium-input" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: '#fff', fontWeight: '500' }}>
                 ₹{currentPrice ? currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
               </div>
            )}
          </div>

          <div className="estimated-total">
            <span>{type === 'buy' ? 'Estimated Total' : 'Estimated Sale Value'}</span>
            <strong>
              {modalForm.quantity && currentPrice && !priceError && !priceLoading
                ? `₹${(parseInt(modalForm.quantity, 10) * currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '₹0.00'}
            </strong>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className={type === 'buy' ? 'primary-btn buy-submit' : 'primary-btn sell-submit'} 
              disabled={modalLoading || priceLoading || !!priceError || !currentPrice}
            >
              {modalLoading ? 'Processing...' : `Confirm ${type === 'buy' ? 'Purchase' : 'Sale'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
