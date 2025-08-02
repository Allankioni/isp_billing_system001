// pages/admin/index.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Admin() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('currentUser');
      if (token && userData) {
        try {
          const currentUser = JSON.parse(userData);
          document.getElementById('current-user').textContent = `Welcome, ${currentUser.name}`;
          document.getElementById('login-modal').style.display = 'none';
          // Load dashboard data or other initialization here if needed
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          document.getElementById('login-modal').style.display = 'flex';
        }
      } else {
        document.getElementById('login-modal').style.display = 'flex';
      }
    };

    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, []);

  return (
    <>
      <Head>
        <title>Wi-Fi Voucher System - Admin Dashboard</title>
        <link rel="stylesheet" href="/admin-styles.css" />
      </Head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <div className="app">
        <div className="sidebar">
          <div className="logo">
            <h2>Wi-Fi Admin</h2>
          </div>
          <nav>
            <ul>
              <li className="active"><a href="#" data-tab="dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</a></li>
              <li><a href="#" data-tab="users"><i className="fas fa-users"></i> Users</a></li>
              <li><a href="#" data-tab="transactions"><i className="fas fa-exchange-alt"></i> Transactions</a></li>
              <li><a href="#" data-tab="plans"><i className="fas fa-list"></i> Plans</a></li>
              <li><a href="#" data-tab="vouchers"><i className="fas fa-ticket-alt"></i> Vouchers</a></li>
              <li><a href="#" data-tab="sessions"><i className="fas fa-wifi"></i> Active Sessions</a></li>
              <li><a href="#" id="logout"><i className="fas fa-sign-out-alt"></i> Logout</a></li>
            </ul>
          </nav>
        </div>
        <div className="main-content">
          <header>
            <h1>Admin Dashboard</h1>
            <div className="user-info">
              <span id="current-user">Welcome, Admin</span>
            </div>
          </header>
          <div className="content">
            <div id="dashboard" className="tab-content active">
              <div className="dashboard-stats">
                <div className="stat-card">
                  <i className="fas fa-users"></i>
                  <div>
                    <h3>Total Users</h3>
                    <p id="total-users">0</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-ticket-alt"></i>
                  <div>
                    <h3>Active Vouchers</h3>
                    <p id="active-vouchers">0</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-wifi"></i>
                  <div>
                    <h3>Active Sessions</h3>
                    <p id="active-sessions">0</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-money-bill-wave"></i>
                  <div>
                    <h3>Total Revenue</h3>
                    <p id="total-revenue">KES 0.00</p>
                  </div>
                </div>
              </div>
              <div className="dashboard-section">
                <h2>Recent Transactions</h2>
                <table id="recent-transactions">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="6">Loading...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div id="users" className="tab-content">
              <div className="table-header">
                <h2>Manage Users</h2>
                <button id="add-user" className="btn btn-primary"><i className="fas fa-plus"></i> Add User</button>
              </div>
              <table id="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6">Loading...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="transactions" className="tab-content">
              <div className="table-header">
                <h2>Transactions</h2>
                <div>
                  <select id="filter-status">
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <table id="transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Transaction ID</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7">Loading...</td>
                  </tr>
                </tbody>
              </table>
              <div id="transactions-pagination" className="pagination-container"></div>
            </div>
            <div id="plans" className="tab-content">
              <div className="table-header">
                <h2>Manage Plans</h2>
                <button id="add-plan" className="btn btn-primary"><i className="fas fa-plus"></i> Add Plan</button>
              </div>
              <table id="plans-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Data Limit</th>
                    <th>Time Limit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="7">Loading...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="vouchers" className="tab-content">
              <div className="table-header">
                <h2>Manage Vouchers</h2>
                <button id="create-voucher" className="btn btn-primary"><i className="fas fa-plus"></i> Create Voucher</button>
              </div>
              <table id="vouchers-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Plan</th>
                    <th>Phone</th>
                    <th>Data Limit</th>
                    <th>Time Limit</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8">Loading...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div id="sessions" className="tab-content">
              <div className="table-header">
                <h2>Active Sessions</h2>
              </div>
              <table id="sessions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Voucher</th>
                    <th>MAC Address</th>
                    <th>IP Address</th>
                    <th>Data Used</th>
                    <th>Time Used</th>
                    <th>Started</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8">Loading...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <div id="login-modal" className="modal">
        <div className="modal-content">
          <h2>Admin Login</h2>
          <form id="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email or Username</label>
              <div className="input-with-icon">
                <i className="fas fa-user"></i>
                <input 
                  type="text" 
                  id="login-email" 
                  name="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="login-password" 
                  name="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <p id="login-error" className="error-message" style={{ display: 'none' }}></p>
            <button type="submit" className="btn btn-primary full-width">Login</button>
          </form>
        </div>
      </div>

      {/* User Modal */}
      <div id="user-modal" className="modal">
        <div className="modal-content">
          <span className="close-btn">&times;</span>
          <h2 id="user-modal-title">Add/Edit User</h2>
          <form id="user-form">
            <input type="hidden" id="user-id" />
            <div className="form-group">
              <label htmlFor="user-name">Name</label>
              <input type="text" id="user-name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="user-email">Email</label>
              <input type="email" id="user-email" name="email" required />
            </div>
            <div className="form-group" id="password-group">
              <label htmlFor="user-password">Password</label>
              <input type="password" id="user-password" name="password" required />
            </div>
            <div className="form-group">
              <label htmlFor="user-role">Role</label>
              <select id="user-role" name="role" required>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="user-active" name="active" />
              <label htmlFor="user-active">Active Account</label>
            </div>
            <button type="submit" className="btn btn-primary full-width">Save</button>
          </form>
        </div>
      </div>

      {/* Plan Modal */}
      <div id="plan-modal" className="modal">
        <div className="modal-content">
          <span className="close-btn">&times;</span>
          <h2 id="plan-modal-title">Add/Edit Plan</h2>
          <form id="plan-form">
            <input type="hidden" id="plan-id" />
            <div className="form-group">
              <label htmlFor="plan-name">Name</label>
              <input type="text" id="plan-name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="plan-description">Description</label>
              <textarea id="plan-description" name="description" required></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="plan-type">Type</label>
              <select id="plan-type" name="type" required>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="plan-price">Price (KES)</label>
              <input type="number" id="plan-price" name="price" step="0.01" required />
            </div>
            <div className="form-group">
              <label htmlFor="plan-data-limit">Data Limit (MB)</label>
              <input type="number" id="plan-data-limit" name="dataLimit" required />
            </div>
            <div className="form-group">
              <label htmlFor="plan-time-limit">Time Limit (Minutes)</label>
              <input type="number" id="plan-time-limit" name="timeLimit" required />
            </div>
            <div className="form-group">
              <label htmlFor="plan-bandwidth-limit">Bandwidth Limit (Kbps, 0 for unlimited)</label>
              <input type="number" id="plan-bandwidth-limit" name="bandwidthLimit" />
            </div>
            <div className="form-group">
              <label htmlFor="plan-concurrent-devices">Concurrent Devices</label>
              <input type="number" id="plan-concurrent-devices" name="concurrentDevices" />
            </div>
            <div className="form-group">
              <label htmlFor="plan-display-order">Display Order</label>
              <input type="number" id="plan-display-order" name="displayOrder" required />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" id="plan-active" name="active" />
              <label htmlFor="plan-active">Active Plan</label>
            </div>
            <button type="submit" className="btn btn-primary full-width">Save</button>
          </form>
        </div>
      </div>

      {/* Voucher Modal */}
      <div id="voucher-modal" className="modal">
        <div className="modal-content">
          <span className="close-btn">&times;</span>
          <h2>Create Voucher</h2>
          <form id="voucher-form">
            <div className="form-group">
              <label htmlFor="voucher-plan">Plan</label>
              <select id="voucher-plan" name="plan" required>
                <option value="">Loading plans...</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="voucher-phone">Phone Number (optional)</label>
              <input type="text" id="voucher-phone" name="phone" placeholder="07xxxxxxxx" />
            </div>
            <button type="submit" className="btn btn-primary full-width">Create Voucher</button>
          </form>
        </div>
      </div>

      {/* Confirm Modal */}
      <div id="confirm-modal" className="modal">
        <div className="modal-content">
          <span className="close-btn">&times;</span>
          <h2>Confirm Action</h2>
          <p id="confirm-message"></p>
          <div className="confirm-buttons">
            <button className="btn btn-secondary" id="confirm-no">No</button>
            <button className="btn btn-primary" id="confirm-yes">Yes</button>
          </div>
        </div>
      </div>

      {/* Error/Success Modal */}
      <div id="message-modal" className="modal">
        <div className="modal-content">
          <span className="close-btn">&times;</span>
          <div id="message-icon"></div>
          <h2 id="message-title"></h2>
          <p id="message-text"></p>
          <button className="btn btn-primary close-modal-btn">OK</button>
        </div>
      </div>

      <Script src="https://code.jquery.com/jquery-3.6.0.min.js" strategy="beforeInteractive" />
      <Script src="/admin-app.js" strategy="afterInteractive" />
    </>
  );
}
