const API_BASE = '/api/users';
let token = null;

function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function showRegister() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('profile-section').style.display = 'none';
    clearForms();
}

function showLogin() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('profile-section').style.display = 'none';
    clearForms();
}

function showProfile() {
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('profile-section').style.display = 'block';
}

function clearForms() {
    document.getElementById('registerForm').reset();
    document.getElementById('loginForm').reset();
}

//  Registration - 
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Registration successful!');
            showLogin();
        } else {
            showMessage(data.message || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed. Please try again.', 'error');
    }
});




document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('login'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

      

        const data = await response.json();

        if (response.ok) {
            
            // FIX: Call handleLogin to save BOTH token and user data
            await handleLogin({
                token: data.token,
                user: data.user
            });
            
        } else {
            showMessage(data.message || 'Login failed.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed. Please try again.', 'error');
    }
});

async function handleLogin(response) {
    
    const { token, user } = response;

    if (!token) {
        console.error(' Login failed: token missing', response);
        showMessage('Login failed: No token received', 'error');
        return;
    }

    // Save BOTH token and user data to localStorage
    localStorage.setItem('authToken', token); 
    
    if (user) {
        localStorage.setItem('userData', JSON.stringify(user));
    } else {
        console.warn('⚠️ No user data in response');
    }
    
    
    // Show profile section
    await loadProfile();
    showProfile();
    showMessage('Login successful! Redirecting to home...');

    
    
    //  Redirect to index.html after 2 seconds
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 50000);
}


async function loadProfile() {
    try {
        const token = localStorage.getItem('authToken'); // 

        if (!token) {
            console.warn('❌ No auth token found');
            return;
        }

        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {

            const profileInfo = document.getElementById('profile-info');
            profileInfo.innerHTML = `
                <p><strong>Name:</strong> ${data.user.username}</p>
                <p><strong>Email:</strong> ${data.user.email}</p>
                <p><strong>Phone Number:</strong> ${data.user.phone_number || 'N/A'}</p>
            `;
        } else {
            showMessage(data.error || 'Failed to load profile.', 'error');
        }
    } catch (error) {
        console.error('Profile load error:', error);
        showMessage('Failed to load profile.', 'error');
    }
}
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.style.display = 'block';
    loadProfileIntoModal();
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

async function loadProfileIntoModal() {
    const body = document.getElementById('profile-modal-body');
    const token = localStorage.getItem('authToken');

    if (!token) {
        body.innerHTML = '<p>Please log in.</p>';
        return;
    }

    try {
        const res = await fetch('/api/users/profile', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            body.innerHTML = `<p>${data.error || 'Failed to load profile'}</p>`;
            return;
        }

        body.innerHTML = `
            <p><strong>Username:</strong> ${data.user.username}</p>
            <p><strong>Email:</strong> ${data.user.email}</p>
            <p><strong>Phone:</strong> ${data.user.phone_number || 'N/A'}</p>
        `;
    } catch (err) {
        console.error(err);
        body.innerHTML = '<p>Error loading profile.</p>';
    }
}



// Logout
function logout() {
    token = null;
    localStorage.removeItem('token');
    showLogin();
    showMessage('Logged out successfully');
}

document.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        token = savedToken;
        try {
            await loadProfile();
            showProfile();
        } catch (error) {
            console.error('Session validation failed:', error);
            localStorage.removeItem('token');
            showLogin();
        }
    } else {
        showRegister();
    }
});


function continueToHome() {
    window.location.href = '/index.html';
}



