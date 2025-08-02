// API base URL - adjust this based on your backend server
const API_BASE_URL = '/api';

// Global variables
let currentUser = null;
let authToken = null;
let currentTransactionsPage = 1;
let transactionsPerPage = 10;

// Utility functions
function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return `KES 0.00`;
    }
    return `KES ${Number(amount).toFixed(2)}`;
}

function formatDataLimit(mb) {
    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
}

function formatTimeLimit(minutes) {
    if (minutes >= 1440) {
        return `${Math.floor(minutes / 1440)} day(s)`;
    } else if (minutes >= 60) {
        return `${Math.floor(minutes / 60)} hour(s)`;
    }
    return `${minutes} minute(s)`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
}

function showMessageModal(title, message, type) {
    $('#message-title').text(title);
    $('#message-text').text(message);
    if (type === 'error') {
        $('#message-icon').html('<i class="fas fa-exclamation-circle error-icon"></i>');
    } else {
        $('#message-icon').html('<i class="fas fa-check-circle success-icon"></i>');
    }
    $('#message-modal').css('display', 'flex');
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
        try {
            authToken = token;
            currentUser = JSON.parse(userData);
            $('#current-user').text(`Welcome, ${currentUser.name}`);
            $('#login-modal').hide();
            loadDashboardData();
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            $('#login-modal').css('display', 'flex');
        }
    } else {
        $('#login-modal').css('display', 'flex');
    }
}

// Set up event listeners
$(document).ready(function() {
    checkAuth();
    
    // Tab navigation
    $('nav ul li a[data-tab]').click(function(e) {
        e.preventDefault();
        const tabId = $(this).data('tab');
        
        $('nav ul li').removeClass('active');
        $(this).parent().addClass('active');
        
        $('.tab-content').removeClass('active');
        $(`#${tabId}`).addClass('active');
        
        // Load data for specific tabs
        switch(tabId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'users':
                loadUsers();
                break;
            case 'transactions':
                loadTransactions();
                break;
            case 'plans':
                loadPlans();
                break;
            case 'vouchers':
                loadVouchers();
                break;
            case 'sessions':
                loadSessions();
                break;
        }
    });
    
    // Logout
    $('#logout').click(function(e) {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
        $('#login-modal').css('display', 'flex');
        $('#current-user').text('Welcome, Admin');
    });
    
    // Modal close handlers
    $('.close-btn, .close-modal-btn').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var modal = $(this).closest('.modal');
        if (modal.length > 0) {
            modal.hide();
            modal.css('display', 'none');
        } else {
            $('.modal').hide();
            $('.modal').css('display', 'none');
        }
    });
    
    $('.modal').on('click', function(event) {
        if ($(event.target).hasClass('modal')) {
            $(this).hide();
            $(this).css('display', 'none');
        }
    });
    
    // Login form submission
    $('#login-form').submit(function(e) {
        e.preventDefault();
        const email = $('#login-email').val().trim();
        const password = $('#login-password').val().trim();
        
        $.ajax({
            url: `${API_BASE_URL}/auth`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username: email,
                password: password
            }),
            success: function(response) {
                if (response.token) {
                    authToken = response.token;
                    currentUser = response.user;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    $('#current-user').text(`Welcome, ${currentUser.name}`);
                    $('#login-modal').hide();
                    $('#login-error').hide();
                    loadDashboardData();
                } else {
                    $('#login-error').text('Invalid credentials').show();
                }
            },
            error: function(xhr, status, error) {
                console.error('Login error:', error);
                let errorMessage = 'Login failed. Please check your credentials.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                $('#login-error').text(errorMessage).show();
            }
        });
    });
    
    // Add User button
    $('#add-user').click(function() {
        $('#user-modal-title').text('Add New User');
        $('#user-form')[0].reset();
        $('#user-id').val('');
        $('#password-group').show();
        $('#user-password').prop('required', true);
        $('#user-active').prop('checked', true);
        $('#user-modal').css('display', 'flex');
    });
    
    // Add Plan button
    $('#add-plan').click(function() {
        $('#plan-modal-title').text('Add New Plan');
        $('#plan-form')[0].reset();
        $('#plan-id').val('');
        $('#plan-active').prop('checked', true);
        $('#plan-modal').css('display', 'flex');
    });
    
    // Create Voucher button
    $('#create-voucher').click(function() {
        $('#voucher-form')[0].reset();
        loadPlansForVoucher();
        $('#voucher-modal').css('display', 'flex');
    });
    
    // User form submission
    $('#user-form').submit(function(e) {
        e.preventDefault();
        const id = $('#user-id').val();
        const name = $('#user-name').val().trim();
        const email = $('#user-email').val().trim();
        const password = $('#user-password').val().trim();
        const role = $('#user-role').val();
        const isActive = $('#user-active').is(':checked');
        
        const userData = {
            name: name,
            email: email,
            role: role,
            isActive: isActive
        };
        
        if (!id && password) {
            userData.password = password;
        } else if (id && password) {
            userData.password = password;
        }
        
        const url = id ? `${API_BASE_URL}/admin/users/${id}` : `${API_BASE_URL}/admin/users`;
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(userData),
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                $('#user-modal').hide();
                showMessageModal('Success', id ? 'User updated successfully' : 'User created successfully', 'success');
                loadUsers();
            },
            error: function(xhr, status, error) {
                console.error('User save error:', error);
                let errorMessage = id ? 'Failed to update user' : 'Failed to create user';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    // Plan form submission
    $('#plan-form').submit(function(e) {
        e.preventDefault();
        const id = $('#plan-id').val();
        const planData = {
            name: $('#plan-name').val().trim(),
            description: $('#plan-description').val().trim(),
            type: $('#plan-type').val(),
            price: parseFloat($('#plan-price').val()),
            dataLimit: parseInt($('#plan-data-limit').val()),
            timeLimit: parseInt($('#plan-time-limit').val()),
            displayOrder: parseInt($('#plan-display-order').val()),
            isActive: $('#plan-active').is(':checked')
        };
        
        const bandwidthLimit = parseInt($('#plan-bandwidth-limit').val());
        if (!isNaN(bandwidthLimit) && bandwidthLimit > 0) {
            planData.bandwidthLimit = bandwidthLimit;
        }
        
        const concurrentDevices = parseInt($('#plan-concurrent-devices').val());
        if (!isNaN(concurrentDevices) && concurrentDevices > 0) {
            planData.concurrentDevices = concurrentDevices;
        }
        
        const url = id ? `${API_BASE_URL}/admin/plans/${id}` : `${API_BASE_URL}/admin/plans`;
        const method = id ? 'PUT' : 'POST';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(planData),
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                $('#plan-modal').hide();
                showMessageModal('Success', id ? 'Plan updated successfully' : 'Plan created successfully', 'success');
                loadPlans();
            },
            error: function(xhr, status, error) {
                console.error('Plan save error:', error);
                let errorMessage = id ? 'Failed to update plan' : 'Failed to create plan';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    // Voucher form submission
    $('#voucher-form').submit(function(e) {
        e.preventDefault();
        const planId = $('#voucher-plan').val();
        const phoneNumber = $('#voucher-phone').val().trim();
        
        const voucherData = {
            planId: planId
        };
        
        if (phoneNumber) {
            voucherData.phoneNumber = phoneNumber;
        }
        
        $.ajax({
            url: `${API_BASE_URL}/vouchers/generate`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(voucherData),
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                $('#voucher-modal').hide();
                // Handle cases where fields might be missing or undefined
                const code = response.code || 'N/A';
                const password = response.password || 'N/A';
                const plan = response.plan || 'N/A';
                const expiresAt = response.expiresAt ? formatDate(response.expiresAt) : 'N/A';
                showMessageModal('Voucher Created', 
                    `Voucher created successfully!\nCode: ${code}\nPassword: ${password}\nPlan: ${plan}\nExpires: ${expiresAt}`, 
                    'success');
                loadVouchers();
            },
            error: function(xhr, status, error) {
                console.error('Voucher creation error:', error);
                let errorMessage = 'Failed to create voucher';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    // Transaction filter
    $('#filter-status').change(function() {
        currentTransactionsPage = 1;
        loadTransactions();
    });
});

// Load dashboard data
function loadDashboardData() {
    // Load stats
    $.ajax({
        url: `${API_BASE_URL}/admin/dashboard`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Dashboard data response:', response);
            $('#total-users').text(response.totalUsers || 0);
            $('#active-vouchers').text(response.activeVouchers || 0);
            $('#active-sessions').text(response.activeSessions || 0);
            $('#total-revenue').text(formatCurrency(response.totalRevenue || 0));
            
            // Load recent transactions
            const transactions = Array.isArray(response.recentTransactions) ? response.recentTransactions : [];
            const tbody = $('#recent-transactions tbody');
            tbody.empty();
            
            if (transactions.length === 0) {
                tbody.append('<tr><td colspan="6">No recent transactions</td></tr>');
            } else {
                transactions.forEach(tx => {
                    tbody.append(`
                        <tr>
                            <td>${tx._id ? tx._id.substring(0, 8) + '...' : 'N/A'}</td>
                            <td>${tx.phoneNumber || 'N/A'}</td>
                            <td>${formatCurrency(tx.amount || 0)}</td>
                            <td>${tx.planId && typeof tx.planId === 'object' && tx.planId.name ? tx.planId.name : 'N/A'}</td>
                            <td><span class="status-${tx.status || 'unknown'}">${tx.status || 'unknown'}</span></td>
                            <td>${tx.createdAt ? formatDate(tx.createdAt) : 'N/A'}</td>
                        </tr>
                    `);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Dashboard data load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load dashboard data. Check console for details.', 'error');
            }
        }
    });
}

// Load users
function loadUsers() {
    $.ajax({
        url: `${API_BASE_URL}/admin/users`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Users data response:', response);
            const tbody = $('#users-table tbody');
            tbody.empty();
            
            let users = [];
            if (Array.isArray(response)) {
                users = response;
            } else if (response && typeof response === 'object') {
                // Check if response contains a nested array under a property like 'users' or 'data'
                if (Array.isArray(response.users)) {
                    users = response.users;
                } else if (Array.isArray(response.data)) {
                    users = response.data;
                }
            }
            
            if (users.length === 0) {
                tbody.append('<tr><td colspan="6">No users found</td></tr>');
            } else {
                users.forEach(user => {
                    tbody.append(`
                        <tr>
                            <td>${user._id ? user._id.substring(0, 8) + '...' : 'N/A'}</td>
                            <td>${user.name || 'N/A'}</td>
                            <td>${user.email || 'N/A'}</td>
                            <td>${user.role || 'N/A'}</td>
                            <td><span class="status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td class="actions">
                                <button class="edit" onclick="editUser('${user._id || ''}')"><i class="fas fa-edit"></i> Edit</button>
                                <button class="delete" onclick="deleteUser('${user._id || ''}')"><i class="fas fa-trash"></i> Delete</button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Users load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load users. Check console for details.', 'error');
            }
        }
    });
}

// Load transactions with pagination
function loadTransactions(page = 1, limit = 10) {
    currentTransactionsPage = page;
    transactionsPerPage = limit;
    const status = $('#filter-status').val();
    const query = { page, limit };
    
    if (status) {
        query.status = status;
    }
    
    $.ajax({
        url: `${API_BASE_URL}/payments`,
        method: 'GET',
        data: query,
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Transactions response (FULL):', JSON.stringify(response, null, 2));
            const tbody = $('#transactions-table tbody');
            tbody.empty();
            
            let transactions = [];
            let total = 0;
            let currentPage = page;
            
            // Handle different response structures
            if (Array.isArray(response)) {
                transactions = response;
                total = transactions.length; // Fallback if total is not provided
                console.log('Direct array response, using length as total:', total);
            } else if (response && typeof response === 'object') {
                if (Array.isArray(response.data)) {
                    transactions = response.data;
                    total = response.total || response.totalCount || transactions.length;
                    currentPage = response.currentPage || response.page || page;
                    console.log('Nested data array, extracted total:', total);
                } else if (Array.isArray(response.transactions)) {
                    transactions = response.transactions;
                    total = response.total || response.totalCount || transactions.length;
                    currentPage = response.currentPage || response.page || page;
                    console.log('Nested transactions array, extracted total:', total);
                } else if (Array.isArray(response.payments)) {
                    transactions = response.payments;
                    total = response.total || response.totalCount || transactions.length;
                    currentPage = response.currentPage || response.page || page;
                    console.log('Nested payments array, extracted total:', total);
                    if (response.pagination && response.pagination.total) {
                        total = response.pagination.total;
                        console.log('Using pagination total instead:', total);
                    }
                } else if (response.pagination && response.payments) {
                    transactions = response.payments;
                    total = response.pagination.total || transactions.length;
                    currentPage = response.pagination.page || page;
                    console.log('Pagination object with payments, extracted total:', total);
                } else {
                    console.log('Unexpected response structure, falling back to default total calculation');
                }
            } else {
                console.log('Response is neither an array nor an object with expected structure');
            }
            console.log('Final extracted values - Transactions count:', transactions.length, 'Total:', total, 'Current Page:', currentPage);
            
            if (transactions.length === 0) {
                tbody.append('<tr><td colspan="7">No transactions found</td></tr>');
            } else {
                transactions.forEach(tx => {
                    const planName = tx.planId && typeof tx.planId === 'object' ? tx.planId.name : 'N/A';
                    tbody.append(`
                        <tr>
                            <td>${tx._id ? tx._id.substring(0, 8) + '...' : 'N/A'}</td>
                            <td>${tx.phoneNumber || 'N/A'}</td>
                            <td>${formatCurrency(tx.amount || 0)}</td>
                            <td>${planName}</td>
                            <td><span class="status-${tx.status || 'unknown'}">${tx.status || 'unknown'}</span></td>
                            <td>${tx.transactionId || tx.receiptNumber || 'N/A'}</td>
                            <td>${tx.createdAt ? formatDate(tx.createdAt) : 'N/A'}</td>
                        </tr>
                    `);
                });
            }
            
            // Update pagination controls
            // Calculate total pages based on the total count from backend
            const totalPages = Math.ceil(total / limit);
            console.log('Calculated total pages based on total count:', totalPages);
            updatePaginationControls(total, currentPage, limit, 'transactions');
        },
        error: function(xhr, status, error) {
            console.error('Transactions load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load transactions. Check console for details.', 'error');
            }
        }
    });
}

// Update pagination controls
function updatePaginationControls(totalItems, currentPage, itemsPerPage, type) {
    const container = $(`#${type}-pagination`);
    container.empty();
    
    // Force display for testing even if totalItems <= itemsPerPage
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const maxVisiblePages = 5;
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }
    
    let paginationHtml = `
        <div class="pagination">
            <button id="${type}-first-page" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-angle-double-left"></i></button>
            <button id="${type}-prev-page" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-angle-left"></i></button>
    `;
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
        `;
    }
    
    paginationHtml += `
            <button id="${type}-next-page" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-angle-right"></i></button>
            <button id="${type}-last-page" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-angle-double-right"></i></button>
        </div>
        <span>Showing page ${currentPage} of ${totalPages} (${totalItems} item${totalItems !== 1 ? 's' : ''})</span>
    `;
    
    container.html(paginationHtml);
    container.css('display', 'block'); // Force visibility for testing
    
    // Attach event handlers to pagination buttons
    $(`#${type}-first-page`).click(function() {
        loadTransactions(1, itemsPerPage);
    });
    
    $(`#${type}-prev-page`).click(function() {
        loadTransactions(currentPage - 1, itemsPerPage);
    });
    
    $(`#${type}-next-page`).click(function() {
        loadTransactions(currentPage + 1, itemsPerPage);
    });
    
    $(`#${type}-last-page`).click(function() {
        loadTransactions(totalPages, itemsPerPage);
    });
    
    container.find('.pagination button[data-page]').click(function() {
        const page = parseInt($(this).data('page'));
        loadTransactions(page, itemsPerPage);
    });
}

// Load plans
function loadPlans() {
    $.ajax({
        url: `${API_BASE_URL}/admin/plans`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Plans data response:', response);
            const tbody = $('#plans-table tbody');
            tbody.empty();
            
            let plans = response;
            if (!Array.isArray(response)) {
                // Check if response contains a nested array under a property like 'data'
                if (response && typeof response === 'object' && Array.isArray(response.data)) {
                    plans = response.data;
                } else if (response && typeof response === 'object' && Array.isArray(response.plans)) {
                    plans = response.plans;
                } else {
                    plans = [];
                }
            }
            
            if (plans.length === 0) {
                tbody.append('<tr><td colspan="7">No plans found</td></tr>');
            } else {
                plans.forEach(plan => {
                    tbody.append(`
                        <tr>
                            <td>${plan._id ? plan._id.substring(0, 8) + '...' : 'N/A'}</td>
                            <td>${plan.name || 'N/A'}</td>
                            <td>${formatCurrency(plan.price || 0)}</td>
                            <td>${formatDataLimit(plan.dataLimit || 0)}</td>
                            <td>${formatTimeLimit(plan.timeLimit || 0)}</td>
                            <td><span class="status-${plan.isActive ? 'active' : 'inactive'}">${plan.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td class="actions">
                                <button class="edit" onclick="editPlan('${plan._id || ''}')"><i class="fas fa-edit"></i> Edit</button>
                                <button class="delete" onclick="deletePlan('${plan._id || ''}')"><i class="fas fa-trash"></i> Delete</button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Plans load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load plans. Check console for details.', 'error');
            }
        }
    });
}

// Load vouchers
function loadVouchers() {
    $.ajax({
        url: `${API_BASE_URL}/vouchers`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Vouchers data response:', response);
            const tbody = $('#vouchers-table tbody');
            tbody.empty();
            
            let vouchers = response;
            if (!Array.isArray(response)) {
                // Check if response contains a nested array under a property like 'data'
                if (response && typeof response === 'object' && Array.isArray(response.data)) {
                    vouchers = response.data;
                } else if (response && typeof response === 'object' && Array.isArray(response.vouchers)) {
                    vouchers = response.vouchers;
                } else {
                    vouchers = [];
                }
            }
            
            if (vouchers.length === 0) {
                tbody.append('<tr><td colspan="8">No vouchers found</td></tr>');
            } else {
                vouchers.forEach(voucher => {
                    const planName = voucher.planId && typeof voucher.planId === 'object' ? voucher.planId.name : 'N/A';
                    tbody.append(`
                        <tr>
                            <td>${voucher.code || 'N/A'}</td>
                            <td>${planName}</td>
                            <td>${voucher.phoneNumber || 'N/A'}</td>
                            <td>${formatDataLimit(voucher.dataLimit || 0)}</td>
                            <td>${formatTimeLimit(voucher.timeLimit || 0)}</td>
                            <td><span class="status-${voucher.status || 'unknown'}">${voucher.status || 'unknown'}</span></td>
                            <td>${voucher.expiresAt ? formatDate(voucher.expiresAt) : 'N/A'}</td>
                            <td class="actions">
                                <button class="delete" onclick="deleteVoucher('${voucher._id || ''}')"><i class="fas fa-trash"></i> Delete</button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Vouchers load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load vouchers. Check console for details.', 'error');
            }
        }
    });
}

// Load sessions
function loadSessions() {
    $.ajax({
        url: `${API_BASE_URL}/admin/sessions`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Sessions data response:', response);
            const tbody = $('#sessions-table tbody');
            tbody.empty();
            
            let sessions = response;
            if (!Array.isArray(response)) {
                // Check if response contains a nested array under a property like 'data'
                if (response && typeof response === 'object' && Array.isArray(response.data)) {
                    sessions = response.data;
                } else if (response && typeof response === 'object' && Array.isArray(response.sessions)) {
                    sessions = response.sessions;
                } else {
                    sessions = [];
                }
            }
            
            if (sessions.length === 0) {
                tbody.append('<tr><td colspan="8">No active sessions</td></tr>');
            } else {
                sessions.forEach(session => {
                    tbody.append(`
                        <tr>
                            <td>${session._id ? session._id.substring(0, 8) + '...' : 'N/A'}</td>
                            <td>${session.voucherCode || 'N/A'}</td>
                            <td>${session.macAddress || 'N/A'}</td>
                            <td>${session.ipAddress || 'N/A'}</td>
                            <td>${formatDataLimit(session.dataUsed || 0)}</td>
                            <td>${formatTimeLimit(session.timeUsed || 0)}</td>
                            <td>${session.startedAt ? formatDate(session.startedAt) : 'N/A'}</td>
                            <td class="actions">
                                <button class="terminate" onclick="terminateSession('${session._id || ''}')"><i class="fas fa-times"></i> Terminate</button>
                            </td>
                        </tr>
                    `);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Sessions load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load sessions. Check console for details.', 'error');
            }
        }
    });
}

// Load plans for voucher creation dropdown
function loadPlansForVoucher() {
    $.ajax({
        url: `${API_BASE_URL}/admin/plans`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(response) {
            console.log('Plans for voucher response:', response);
            const select = $('#voucher-plan');
            select.empty();
            
            let plans = response;
            if (!Array.isArray(response)) {
                if (response && typeof response === 'object' && Array.isArray(response.data)) {
                    plans = response.data;
                } else if (response && typeof response === 'object' && Array.isArray(response.plans)) {
                    plans = response.plans;
                } else {
                    plans = [];
                }
            }
            
            if (plans.length === 0) {
                select.append('<option value="">No plans available</option>');
            } else {
                plans.forEach(plan => {
                    if (plan.isActive) {
                        select.append(`<option value="${plan._id}">${plan.name} (${formatCurrency(plan.price)})</option>`);
                    }
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Plans for voucher load error:', error, xhr.responseText);
            if (xhr.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                authToken = null;
                currentUser = null;
                $('#login-modal').css('display', 'flex');
                showMessageModal('Session Expired', 'Your session has expired. Please log in again.', 'error');
            } else {
                showMessageModal('Error', 'Failed to load plans for voucher creation.', 'error');
            }
        }
    });
}

// Edit user
function editUser(id) {
    $.ajax({
        url: `${API_BASE_URL}/admin/users/${id}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(user) {
            console.log('User data for edit:', user);
            $('#user-modal-title').text('Edit User');
            $('#user-id').val(user._id);
            $('#user-name').val(user.name);
            $('#user-email').val(user.email);
            $('#user-role').val(user.role);
            $('#user-active').prop('checked', user.isActive);
            $('#password-group').hide();
            $('#user-password').prop('required', false).val('');
            $('#user-modal').css('display', 'flex');
        },
        error: function(xhr, status, error) {
            console.error('User fetch error:', error, xhr.responseText);
            showMessageModal('Error', 'Failed to load user data for editing.', 'error');
        }
    });
}

// Delete user
function deleteUser(id) {
    $('#confirm-message').text('Are you sure you want to delete this user? This action cannot be undone.');
    $('#confirm-modal').css('display', 'flex');
    
    $('#confirm-yes').off('click').on('click', function() {
        $('#confirm-modal').hide();
        $.ajax({
            url: `${API_BASE_URL}/admin/users/${id}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                showMessageModal('Success', 'User deleted successfully', 'success');
                loadUsers();
            },
            error: function(xhr, status, error) {
                console.error('User delete error:', error, xhr.responseText);
                let errorMessage = 'Failed to delete user';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    $('#confirm-no').off('click').on('click', function() {
        $('#confirm-modal').hide();
    });
}

// Edit plan
function editPlan(id) {
    $.ajax({
        url: `${API_BASE_URL}/admin/plans/${id}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        success: function(plan) {
            console.log('Plan data for edit:', plan);
            $('#plan-modal-title').text('Edit Plan');
            $('#plan-id').val(plan._id);
            $('#plan-name').val(plan.name);
            $('#plan-description').val(plan.description);
            $('#plan-type').val(plan.type);
            $('#plan-price').val(plan.price);
            $('#plan-data-limit').val(plan.dataLimit);
            $('#plan-time-limit').val(plan.timeLimit);
            $('#plan-bandwidth-limit').val(plan.bandwidthLimit || '');
            $('#plan-concurrent-devices').val(plan.concurrentDevices || '');
            $('#plan-display-order').val(plan.displayOrder);
            $('#plan-active').prop('checked', plan.isActive);
            $('#plan-modal').css('display', 'flex');
        },
        error: function(xhr, status, error) {
            console.error('Plan fetch error:', error, xhr.responseText);
            showMessageModal('Error', 'Failed to load plan data for editing.', 'error');
        }
    });
}

// Delete plan
function deletePlan(id) {
    $('#confirm-message').text('Are you sure you want to delete this plan? This action cannot be undone.');
    $('#confirm-modal').css('display', 'flex');
    
    $('#confirm-yes').off('click').on('click', function() {
        $('#confirm-modal').hide();
        $.ajax({
            url: `${API_BASE_URL}/admin/plans/${id}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                showMessageModal('Success', 'Plan deleted successfully', 'success');
                loadPlans();
            },
            error: function(xhr, status, error) {
                console.error('Plan delete error:', error, xhr.responseText);
                let errorMessage = 'Failed to delete plan';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    $('#confirm-no').off('click').on('click', function() {
        $('#confirm-modal').hide();
    });
}

// Delete voucher
function deleteVoucher(id) {
    $('#confirm-message').text('Are you sure you want to delete this voucher? This action cannot be undone.');
    $('#confirm-modal').css('display', 'flex');
    
    $('#confirm-yes').off('click').on('click', function() {
        $('#confirm-modal').hide();
        $.ajax({
            url: `${API_BASE_URL}/vouchers/${id}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                showMessageModal('Success', 'Voucher deleted successfully', 'success');
                loadVouchers();
            },
            error: function(xhr, status, error) {
                console.error('Voucher delete error:', error, xhr.responseText);
                let errorMessage = 'Failed to delete voucher';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    $('#confirm-no').off('click').on('click', function() {
        $('#confirm-modal').hide();
    });
}

// Terminate session
function terminateSession(id) {
    $('#confirm-message').text('Are you sure you want to terminate this session? The user will be disconnected.');
    $('#confirm-modal').css('display', 'flex');
    
    $('#confirm-yes').off('click').on('click', function() {
        $('#confirm-modal').hide();
        $.ajax({
            url: `${API_BASE_URL}/admin/sessions/${id}/terminate`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            success: function(response) {
                showMessageModal('Success', 'Session terminated successfully', 'success');
                loadSessions();
            },
            error: function(xhr, status, error) {
                console.error('Session terminate error:', error, xhr.responseText);
                let errorMessage = 'Failed to terminate session';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                showMessageModal('Error', errorMessage, 'error');
            }
        });
    });
    
    $('#confirm-no').off('click').on('click', function() {
        $('#confirm-modal').hide();
    });
}
