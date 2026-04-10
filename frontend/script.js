// ============================================
// HOSTEL COMPLAINT MANAGEMENT SYSTEM
// Global JavaScript File
// ============================================

// API Configuration - CHANGE THIS WHEN DEPLOYING
// For local development: use 'http://localhost:5000'
// For production: use your deployed backend URL (e.g., 'https://your-app.onrender.com')
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://hostel-complaint-kb17.onrender.com'; // ← CHANGE THIS TO YOUR DEPLOYED URL

// ============================================
// HELPER FUNCTIONS
// ============================================

// Show notification message
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#00b894' : '#ff4757'};
        color: white;
        border-radius: 10px;
        font-family: 'Poppins', sans-serif;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
}

// Hide loading (clear loading message)
function hideLoading(elementId, content) {
    const element = document.getElementById(elementId);
    if (element && content) {
        element.innerHTML = content;
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    const statusClasses = {
        'Pending': 'status-pending',
        'In Progress': 'status-in-progress',
        'Resolved': 'status-resolved',
        'Rejected': 'status-rejected'
    };
    
    const statusIcons = {
        'Pending': 'fa-clock',
        'In Progress': 'fa-spinner fa-pulse',
        'Resolved': 'fa-check-circle',
        'Rejected': 'fa-times-circle'
    };
    
    return `<span class="complaint-status ${statusClasses[status] || 'status-pending'}">
        <i class="fas ${statusIcons[status] || 'fa-clock'}"></i> ${status}
    </span>`;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number (Indian)
function isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Logout function
function logout() {
    localStorage.clear();
    showNotification('Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Redirect if not logged in
function requireAuth(role = null) {
    if (!isLoggedIn()) {
        showNotification('Please login to continue', 'error');
        window.location.href = 'login.html';
        return false;
    }
    
    const user = getCurrentUser();
    if (role && user.role !== role) {
        showNotification('Access denied. Unauthorized access.', 'error');
        window.location.href = user.role === 'student' ? 'student-dashboard.html' : 'admin-dashboard.html';
        return false;
    }
    
    return true;
}

// ============================================
// STUDENT FUNCTIONS
// ============================================

// Submit new complaint
async function submitComplaint(complaintData) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/complaints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(complaintData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Complaint submitted successfully!', 'success');
            return { success: true, data };
        } else {
            showNotification(data.error || 'Failed to submit complaint', 'error');
            return { success: false, error: data.error };
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        return { success: false, error: error.message };
    }
}

// Get student's complaints
async function getMyComplaints() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/my-complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, complaints: data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Render student complaints list
function renderStudentComplaints(complaints, containerId) {
    const container = document.getElementById(containerId);
    
    if (!complaints || complaints.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No complaints yet. Submit your first complaint!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = complaints.map(complaint => `
        <div class="complaint-card">
            <div class="complaint-header">
                <span class="complaint-category">
                    <i class="fas fa-tag"></i> ${complaint.category}
                </span>
                ${getStatusBadge(complaint.status)}
            </div>
            <div class="complaint-body">
                <p><strong>Issue:</strong> ${complaint.description}</p>
                <small>
                    <i class="far fa-calendar-alt"></i> 
                    Submitted: ${formatDate(complaint.createdAt)}
                </small>
                ${complaint.adminRemark ? `
                    <div class="admin-remark">
                        <strong><i class="fas fa-comment-dots"></i> Admin Response:</strong>
                        <p>${complaint.adminRemark}</p>
                    </div>
                ` : ''}
                ${complaint.resolvedAt ? `
                    <small class="resolved-date">
                        <i class="fas fa-check-circle"></i> 
                        Resolved: ${formatDate(complaint.resolvedAt)}
                    </small>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all complaints (admin)
async function getAllComplaints() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/all-complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, complaints: data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get statistics (admin)
async function getStatistics() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true, stats: data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update complaint status (admin)
async function updateComplaintStatus(complaintId, status, adminRemark) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/complaints/${complaintId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, adminRemark })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Complaint updated successfully!', 'success');
            return { success: true, complaint: data.complaint };
        } else {
            showNotification(data.error || 'Failed to update complaint', 'error');
            return { success: false, error: data.error };
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        return { success: false, error: error.message };
    }
}

// Render admin complaints list
function renderAdminComplaints(complaints, containerId, showUpdateButton = true) {
    const container = document.getElementById(containerId);
    
    if (!complaints || complaints.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No complaints found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = complaints.map(complaint => `
        <div class="complaint-card">
            <div class="complaint-header">
                <span class="complaint-category">
                    <i class="fas fa-tag"></i> ${complaint.category}
                </span>
                ${getStatusBadge(complaint.status)}
            </div>
            <div class="complaint-body">
                <p><strong><i class="fas fa-user"></i> Student:</strong> ${complaint.studentName}</p>
                <p><strong><i class="fas fa-door-open"></i> Room:</strong> ${complaint.roomNumber}</p>
                <p><strong><i class="fas fa-exclamation-triangle"></i> Issue:</strong> ${complaint.description}</p>
                <small>
                    <i class="far fa-calendar-alt"></i> 
                    Submitted: ${formatDate(complaint.createdAt)}
                </small>
                ${complaint.adminRemark ? `
                    <div class="admin-remark">
                        <strong><i class="fas fa-comment-dots"></i> Previous Response:</strong>
                        <p>${complaint.adminRemark}</p>
                    </div>
                ` : ''}
                ${showUpdateButton ? `
                    <button onclick="openUpdateModal('${complaint._id}', '${complaint.status}', ${JSON.stringify(complaint.adminRemark || '').replace(/"/g, '&quot;')})" class="btn-update">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// REGISTRATION FUNCTION
// ============================================

async function registerStudent(formData) {
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Registration successful! Please login.', 'success');
            return { success: true, message: data.message };
        } else {
            showNotification(data.error || 'Registration failed', 'error');
            return { success: false, error: data.error };
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
        return { success: false, error: error.message };
    }
}

// ============================================
// LOGIN FUNCTION
// ============================================

async function loginUser(email, password, role) {
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showNotification(`Welcome back, ${data.user.name}!`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'student') {
                    window.location.href = 'student-dashboard.html';
                } else {
                    window.location.href = 'admin-dashboard.html';
                }
            }, 1000);
            
            return { success: true, user: data.user };
        } else {
            showNotification(data.error || 'Login failed', 'error');
            return { success: false, error: data.error };
        }
    } catch (error) {
        showNotification('Network error. Please check your connection.', 'error');
        return { success: false, error: error.message };
    }
}

// ============================================
// DASHBOARD STATISTICS FUNCTIONS
// ============================================

// Update student dashboard statistics
async function updateStudentStats() {
    const complaints = await getMyComplaints();
    if (complaints.success) {
        const total = complaints.complaints.length;
        const pending = complaints.complaints.filter(c => c.status === 'Pending').length;
        const inProgress = complaints.complaints.filter(c => c.status === 'In Progress').length;
        const resolved = complaints.complaints.filter(c => c.status === 'Resolved').length;
        
        // Update stats if elements exist
        if (document.getElementById('totalComplaints')) {
            document.getElementById('totalComplaints').textContent = total;
            document.getElementById('pendingComplaints').textContent = pending;
            document.getElementById('inProgressComplaints').textContent = inProgress;
            document.getElementById('resolvedComplaints').textContent = resolved;
        }
    }
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

// Auto-initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    // Add animation keyframes if not present
    if (!document.querySelector('#dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .status-rejected {
                background: #ff7675;
                color: #d63031;
            }
            
            .resolved-date {
                display: block;
                margin-top: 10px;
                color: #00b894;
            }
            
            .loading-spinner {
                text-align: center;
                padding: 40px;
                color: #667eea;
            }
            
            .loading-spinner i {
                font-size: 2rem;
                margin-right: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Handle logout buttons
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Auto-redirect if already logged in on login/register pages
    const currentPage = window.location.pathname.split('/').pop();
    if ((currentPage === 'login.html' || currentPage === 'register.html') && isLoggedIn()) {
        const user = getCurrentUser();
        if (user.role === 'student') {
            window.location.href = 'student-dashboard.html';
        } else if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        }
    }
});

// Export functions for global use (for inline onclick handlers)
window.showNotification = showNotification;
window.logout = logout;
window.submitComplaint = submitComplaint;
window.loginUser = loginUser;
window.registerStudent = registerStudent;
window.updateComplaintStatus = updateComplaintStatus;
window.formatDate = formatDate;
window.getStatusBadge = getStatusBadge;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
