import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import TransactionModal from '../components/TransactionModal';
import { useToast, Toast } from '../components/Toast';

const Portfolio = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Toast State
  const { toast, showToast } = useToast();

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'buy', // 'buy' or 'sell'
    symbol: '',
    availableShares: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [portfolioRes, transactionsRes] = await Promise.all([
        api.get('stocks/portfolio/'),
        api.get('stocks/transactions/')
      ]);
      setPortfolio(portfolioRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (!err.response) {
        setError("Unable to connect to the server.");
      } else {
        setError("Unable to load your portfolio.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type, symbol, availableShares = 0) => {
    setModal({ isOpen: true, type, symbol, availableShares });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleTransactionSuccess = (symbol, type) => {
    closeModal();
    showToast(`✓ ${symbol} ${type === 'buy' ? 'purchased' : 'sold'} successfully.`);
    fetchData(); // Refresh data
  };

  const handleAnalyze = (symbol) => {
    navigate('/', { state: { searchSymbol: symbol } });
  };

  // Calculations
  const uniqueStocksCount = portfolio?.holdings?.length || 0;
  const totalInvested = portfolio?.total_invested || 0;
  const totalHoldings = portfolio?.number_of_holdings || 0;

  return (
    <div className="app-container">
      <Navbar />
      
      <main className="main-content portfolio-content">
        <header className="portfolio-header">
          <h2>My Portfolio</h2>
          <p>Track your investments and market activity.</p>
        </header>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="portfolio-loading">
             <div className="skeleton-card summary-skeleton"></div>
             <div className="skeleton-card summary-skeleton"></div>
             <div className="skeleton-card summary-skeleton"></div>
          </div>
        ) : !error && (
          <>
            <div className="summary-cards">
              <div className="glass-card summary-card">
                <h3>Total Invested</h3>
                <div className="summary-value">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="glass-card summary-card">
                <h3>Holdings</h3>
                <div className="summary-value">{totalHoldings}</div>
              </div>
              <div className="glass-card summary-card">
                <h3>Portfolio Stocks</h3>
                <div className="summary-value">{uniqueStocksCount}</div>
              </div>
            </div>

            <section className="portfolio-section">
              <h3>Your Holdings</h3>
              {uniqueStocksCount === 0 ? (
                <div className="empty-state glass-card">
                  <h4>Your portfolio is empty.</h4>
                  <p>Start building your portfolio by analyzing a stock and making your first investment.</p>
                  <button className="primary-btn" onClick={() => navigate('/')}>Explore Stocks</button>
                </div>
              ) : (
                <div className="holdings-grid">
                  {portfolio.holdings.map((holding) => (
                    <div key={holding.id} className="holding-card glass-card">
                      <div className="holding-header">
                        <h4>{holding.symbol}</h4>
                        <span className="holding-quantity">{holding.quantity} Shares</span>
                      </div>
                      <div className="holding-details">
                        <div className="detail-item">
                          <span>Average Buy Price</span>
                          <strong>₹{holding.average_buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Invested Amount</span>
                          <strong>₹{holding.invested_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                      <div className="holding-actions">
                        <button className="secondary-btn" onClick={() => handleAnalyze(holding.symbol)}>Analyze</button>
                        <button className="buy-btn" onClick={() => openModal('buy', holding.symbol)}>Buy</button>
                        <button className="sell-btn" onClick={() => openModal('sell', holding.symbol, holding.quantity)}>Sell</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="portfolio-section">
              <h3>Transaction History</h3>
              {!transactions || transactions.length === 0 ? (
                <div className="empty-state glass-card">
                  <h4>No transactions yet.</h4>
                  <p>Your buy and sell activity will appear here.</p>
                </div>
              ) : (
                <div className="transactions-list glass-card">
                  <div className="transaction-header-row">
                    <span>Date</span>
                    <span>Stock</span>
                    <span>Type</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {transactions.map((tx) => (
                    <div key={tx.id} className="transaction-row">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span className="tx-symbol">{tx.symbol}</span>
                      <span className={`tx-type ${tx.type.toLowerCase()}`}>{tx.type}</span>
                      <span>{tx.quantity}</span>
                      <span>₹{tx.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span>₹{tx.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <TransactionModal 
        isOpen={modal.isOpen} 
        type={modal.type} 
        symbol={modal.symbol} 
        availableShares={modal.availableShares} 
        onClose={closeModal} 
        onSuccess={handleTransactionSuccess} 
      />

      <Toast toast={toast} />
    </div>
  );
};

export default Portfolio;
