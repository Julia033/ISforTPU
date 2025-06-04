document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById('username');
  const email = emailInput.value.trim();
  const password = document.getElementById('password').value;
  const emailError = document.getElementById('email-error');

  // Очистка предыдущей ошибки
  emailError.textContent = "";

  // Проверка формата
  const emailPattern = /^[a-zA-Z0-9._%+-]+@tpu\.ru$/;
  if (!emailPattern.test(email)) {
    emailError.textContent = "Введите email в формате login@tpu.ru";
    return;
  }

  try {
    const response = await fetch('http://45.89.65.217:5000/api/Auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 401 || response.status === 403) {
      emailError.textContent = "Неверный логин или пароль";
      return;
    }

    if (!response.ok) {
      emailError.textContent = `Ошибка сервера: ${response.status}`;
      return;
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      emailError.textContent = "Сервер не вернул токен";
      return;
    }

    localStorage.setItem('jwt', token);
    window.location.href = '../studentlist-page/index.html';

  } catch (err) {
    console.error('Ошибка при попытке входа:', err);
    emailError.textContent = "Не удалось подключиться к серверу";
  }
});
