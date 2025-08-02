// pages/landing/index.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/Landing.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const Landing = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentId, setPaymentId] = useState(null);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPhoneNumber, setVoucherPhoneNumber] = useState('');
  const [loginStatus, setLoginStatus] = useState('idle');
  const [usageInfo, setUsageInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('purchase');

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (paymentStatus === 'initiated') {
      const interval = setInterval(() => {
        checkPaymentStatus(paymentId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus, paymentId]);

  const loadPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments?plans=true`);
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
      alert('Failed to load plans. Please refresh the page.');
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlanId(planId);
    setTimeout(() => {
      const paymentFormContainer = document.getElementById('payment-form-container');
      if (paymentFormContainer) {
        paymentFormContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      alert('Please select a plan first.');
      return;
    }

    try {
      setPaymentStatus('initiating');
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          phoneNumber,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentId(data.paymentId);
        setPaymentStatus('initiated');
      } else {
        setPaymentStatus('failed');
        alert(data.message || 'Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStatus('failed');
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/status/${paymentId}`);
      const data = await response.json();
      if (data.status === 'completed' && data.voucher) {
        setPaymentStatus('completed');
        setVoucherDetails(data.voucher);
      } else if (data.status === 'failed') {
        setPaymentStatus('failed');
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoginStatus('initiating');
      const response = await fetch(`${API_BASE_URL}/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: voucherCode,
          phoneNumber: voucherPhoneNumber,
          macAddress: 'WEB-' + Math.random().toString(36).substring(2, 15),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setLoginStatus('completed');
        setUsageInfo(data.voucher);
      } else {
        setLoginStatus('failed');
        alert(data.message || 'Authentication failed. Please check your voucher code and phone number.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginStatus('failed');
      alert('Authentication failed. Please try again.');
    }
  };

  const formatCurrency = (amount) => `KES ${amount.toFixed(2)}`;
  const formatDataLimit = (mb) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  const formatTimeLimit = (minutes) => {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)} day(s)`;
    else if (minutes >= 60) return `${Math.floor(minutes / 60)} hour(s)`;
    return `${minutes} minute(s)`;
  };

  return (
    <div className={styles.container}>
    <Head>
      <title>Wi-Fi Voucher System</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <div className={styles.header}>
        <h1>Welcome to Wi-Fi Hotspot</h1>
        <p>Fast and secure internet access</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'purchase' ? styles.active : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          Purchase Voucher
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'login' ? styles.active : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Login with Voucher
        </button>
      </div>

      {activeTab === 'purchase' && (
        <div className={`${styles.tabContent} ${styles.active}`}>
          <h2>Select a Plan</h2>
          <div className={styles.plansContainer}>
            {plans.length === 0 ? (
              <div className={styles.loading}>Loading plans...</div>
            ) : (
              plans.map(plan => (
                <div
                  key={plan._id}
                  className={`${styles.planCard} ${selectedPlanId === plan._id ? styles.selected : ''}`}
                  onClick={() => handlePlanSelect(plan._id)}
                >
                  <h3>{plan.name}</h3>
                  <div className={styles.price}>{formatCurrency(plan.price)}</div>
                  <div className={styles.details}>{formatDataLimit(plan.dataLimit)} Data</div>
                  <div className={styles.details}>Valid for {formatTimeLimit(plan.timeLimit)}</div>
                  {plan.features && plan.features.map((feature, index) => (
                    <div key={index} className={styles.feature}>• {feature}</div>
                  ))}
                </div>
              ))
            )}
          </div>

          {selectedPlanId && paymentStatus === 'idle' && (
            <div id="payment-form-container">
              <h2>Enter Phone Number</h2>
              <form onSubmit={handlePaymentSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number (Format: 07xxxxxxxx)</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fas fa-phone"></i>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="07xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      pattern="^(?:\+254|0|254)?[17]\d{8}$"
                      title="Please enter a valid Kenyan phone number"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.selectedPlan}>
                    {plans.find(p => p._id === selectedPlanId) && (
                      <>
                        <strong>{plans.find(p => p._id === selectedPlanId).name}</strong><br />
                        {formatCurrency(plans.find(p => p._id === selectedPlanId).price)} for {formatDataLimit(plans.find(p => p._id === selectedPlanId).dataLimit)} ({formatTimeLimit(plans.find(p => p._id === selectedPlanId).timeLimit)})
                      </>
                    )}
                  </div>
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullWidth}`}>Pay with M-Pesa</button>
              </form>
            </div>
          )}

          {paymentStatus === 'initiating' && (
            <div className={styles.successMessage}>
              <h3>Processing Payment...</h3>
              <div className={styles.loader}></div>
            </div>
          )}

          {paymentStatus === 'initiated' && (
            <div className={styles.successMessage}>
              <h3>Payment Initiated</h3>
              <p>Please check your phone for an M-Pesa prompt to complete the payment.</p>
              <div className={styles.loader}></div>
              <p>Waiting for payment confirmation...</p>
              <p>If you don't receive a prompt, <a href="#" onClick={() => setPaymentStatus('idle')}>click here to retry</a>.</p>
            </div>
          )}

          {paymentStatus === 'completed' && voucherDetails && (
            <div className={styles.successMessage}>
              <h3>Payment Successful!</h3>
              <p>Your voucher details:</p>
              <div className={styles.voucherDetails}>
                <p><strong>Code:</strong> {voucherDetails.code}</p>
                <p><strong>Plan:</strong> {voucherDetails.plan}</p>
                <p><strong>Data:</strong> {formatDataLimit(voucherDetails.dataLimit)}</p>
                <p><strong>Valid for:</strong> {formatTimeLimit(voucherDetails.timeLimit)}</p>
                <p><strong>Expires:</strong> {new Date(voucherDetails.expiresAt).toLocaleString()}</p>
              </div>
              <p>Please note down your voucher code.</p>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.fullWidth}`}
                onClick={() => setActiveTab('login')}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'login' && (
        <div className={`${styles.tabContent} ${styles.active}`}>
          <h2>Login with Voucher</h2>
          {loginStatus !== 'completed' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="voucher-code">Voucher Code</label>
                <div className={styles.inputWithIcon}>
                  <i className="fas fa-ticket-alt"></i>
                  <input
                    type="text"
                    id="voucher-code"
                    name="voucher-code"
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="voucher-phone">Phone Number</label>
                <div className={styles.inputWithIcon}>
                  <i className="fas fa-phone"></i>
                  <input
                    type="tel"
                    id="voucher-phone"
                    name="voucher-phone"
                    placeholder="07xxxxxxxx"
                    value={voucherPhoneNumber}
                    onChange={(e) => setVoucherPhoneNumber(e.target.value)}
                    required
                    pattern="^(?:\+254|0|254)?[17]\d{8}$"
                    title="Please enter a valid Kenyan phone number"
                  />
                </div>
              </div>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullWidth}`}>Connect to Wi-Fi</button>
            </form>
          ) : (
            <div className={styles.successMessage}>
              <i className="fas fa-check-circle success-icon"></i>
              <h3>Connected Successfully!</h3>
              <p>You are now connected to the internet.</p>
              {usageInfo && (
                <div className={styles.usageInfo}>
                  <p><strong>Plan:</strong> {usageInfo.plan}</p>
                  <p><strong>Data Limit:</strong> {formatDataLimit(usageInfo.dataLimit)}</p>
                  <p><strong>Data Used:</strong> {formatDataLimit(usageInfo.dataUsed)}</p>
                  <p><strong>Time Limit:</strong> {formatTimeLimit(usageInfo.timeLimit)}</p>
                  <p><strong>Time Used:</strong> {formatTimeLimit(usageInfo.timeUsed)}</p>
                  <p><strong>Expires:</strong> {new Date(usageInfo.expiresAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <p>Need help? Contact support: <a href="tel:+254700123456">+254 700 123 456</a></p>
      </div>
    </div>
  );
};

export default Landing;
