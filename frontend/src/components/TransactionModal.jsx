import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TransactionModal = ({ isOpen, type, symbol, availableShares, onClose, onSuccess }) => {
  const [modalForm, setModalForm] = useState({ quantity: '', price: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalForm({ quantity: '', price: '' });
      setModalError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModalChange = (e) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    
    const qty = parseInt(modalForm.quantity, 10);
    const prc = parseFloat(modalForm.price);

    // Validation
    if (!qty || isNaN(qty) || qty <= 0) {
      setModalError("Quantity must be a valid number greater than 0.");
      return;
    }
    if (!prc || isNaN(prc) || prc <= 0) {
      setModalError("Price must be a valid number greater than 0.");
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
            <label>{type === 'buy' ? 'Price per Share' : 'Sell Price'}</label>
            <input
              type="number"
              name="price"
              className="premium-input"
              value={modalForm.price}
              onChange={handleModalChange}
              placeholder="Enter price"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="estimated-total">
            <span>{type === 'buy' ? 'Estimated Total' : 'Estimated Sale Value'}</span>
            <strong>
              {modalForm.quantity && modalForm.price
                ? `₹${(parseInt(modalForm.quantity) * parseFloat(modalForm.price)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '₹0.00'}
            </strong>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className={type === 'buy' ? 'primary-btn buy-submit' : 'primary-btn sell-submit'} disabled={modalLoading}>
              {modalLoading ? 'Processing...' : `Confirm ${type === 'buy' ? 'Purchase' : 'Sale'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
