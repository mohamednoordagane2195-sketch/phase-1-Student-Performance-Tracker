const API_URL = 'http://localhost:3000';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const alertBox = document.getElementById('login-alert');

    // Show loading state
    loginBtn.classList.add('btn-loading');
    loginBtn.innerHTML = '<div class="spinner"></div> <span>Authenticating...</span>';
    alertBox.style.display = 'none';

    try {
        // Fetch users from JSON server
        const response = await fetch(`${API_URL}/users?email=${email}&password=${password}`);
        const users = await response.json();

        if (users.length > 0) {
            // Success: Store user session
            const user = users[0];
            localStorage.setItem('userSession', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                loginTime: new Date().getTime()
            }));

            // Redirect to dashboard
            window.location.href = 'index.html';
        } else {
            // Failure: Show error
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        alertBox.style.display = 'block';
        alertBox.querySelector('span').textContent = error.message;

        // Reset button
        loginBtn.classList.remove('btn-loading');
        loginBtn.innerHTML = '<span>LOGIN TO DASHBOARD</span> <i class="fas fa-arrow-right"></i>';
    }
});

// Check if already logged in
window.onload = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
        window.location.href = 'index.html';
    }
};