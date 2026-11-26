(() => {
  const { api, escapeHtml, state, syncGuestCartIfNeeded } = window.KoboStore;
  const { initShell, showToast } = window.KoboUI;

  const params = new URLSearchParams(window.location.search);
  const rawRedirect = params.get('redirect') || '/account.html';
  const safeRedirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/account.html';

  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegBtn = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const feedbackEl = document.getElementById('auth-feedback');

  function setMode(mode) {
    feedbackEl.innerHTML = '';
    const isLogin = mode === 'login';
    tabLoginBtn.classList.toggle('is-active', isLogin);
    tabRegBtn.classList.toggle('is-active', !isLogin);
    loginForm.style.display = isLogin ? 'block' : 'none';
    registerForm.style.display = isLogin ? 'none' : 'block';
  }

  function showError(msg) {
    feedbackEl.innerHTML = `<div class="form-banner is-error">${escapeHtml(msg)}</div>`;
  }

  tabLoginBtn.addEventListener('click', () => setMode('login'));
  tabRegBtn.addEventListener('click', () => setMode('register'));

  if (params.get('mode') === 'register') {
    setMode('register');
  }

  document.getElementById('fill-demo-btn').addEventListener('click', () => {
    document.getElementById('login-email').value = 'demo@kobo-studio.in';
    document.getElementById('login-password').value = 'Demo@1234';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedbackEl.innerHTML = '';
    const submitBtn = document.getElementById('login-submit-btn');
    submitBtn.disabled = true;

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('login-email').value,
          password: document.getElementById('login-password').value,
        }),
      });
      state.user = data.user;
      await syncGuestCartIfNeeded();
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}`);
      window.location.href = safeRedirect;
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedbackEl.innerHTML = '';
    const submitBtn = document.getElementById('register-submit-btn');
    submitBtn.disabled = true;

    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('reg-name').value,
          email: document.getElementById('reg-email').value,
          phone: document.getElementById('reg-phone').value,
          password: document.getElementById('reg-password').value,
          default_address: document.getElementById('reg-address').value,
        }),
      });
      state.user = data.user;
      await syncGuestCartIfNeeded();
      showToast('Account created');
      window.location.href = safeRedirect;
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
    }
  });

  initShell('account').then((currentState) => {
    if (currentState.user) {
      window.location.href = safeRedirect;
    }
  });
})();
