// === Проверка токена и получение роли ===
const token = localStorage.getItem("jwt");
if (!token) {
  alert("Вы не авторизованы. Выполните вход.");
  window.location.href = "../login-page/index.html";
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const payload = parseJwt(token);
if (!payload) {
  alert("Ошибка токена. Выполните вход заново.");
  localStorage.removeItem("jwt");
  window.location.href = "../login-page/index.html";
}

const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?.toLowerCase();
// Скрыть кнопку "Сообщения" для всех, кроме роли user
if (role !== "user") {
  const messageButton = document.getElementById("open-message-btn");
  if (messageButton) {
    messageButton.style.display = "none";
  }
}


// === Навигация ===
document.getElementById("home-button").addEventListener("click", () => {
  window.location.href = "../studentlist-page/index.html";
});
document.getElementById("exit-button").addEventListener("click", () => {
  localStorage.removeItem("jwt");
  window.location.href = "../login-page/index.html";
});

// === Разрешённые страницы по ролям ===
if (role === "user") {
  document.getElementById("rooms-button")?.addEventListener("click", () => {
    window.location.href = "../room-page/index.html";
  });
  document.getElementById("journal-button")?.addEventListener("click", () => {
    window.location.href = "../journal-page/index.html";
  });
  document.getElementById("report-button")?.parentElement?.style?.setProperty("display", "none");
} else if (role === "admin") {
  document.getElementById("report-button")?.addEventListener("click", () => {
    window.location.href = "../report-page/index.html";
  });
  document.getElementById("rooms-button")?.addEventListener("click", () => {
    window.location.href = "../campus-page/index.html";
  });
  document.getElementById("journal-button")?.parentElement?.style?.setProperty("display", "none");

  // скрытие функциональных кнопок, если они есть
  const buttons = [
    'openCertificateModal',
    'openViolationModal',
    'openTransferPage',
    'openEvictModal'
  ];
  buttons.forEach(func => {
    const btn = document.querySelector(`button[onclick="${func}()"]`);
    if (btn) btn.style.display = "none";
  });
}


const searchIcon = document.getElementById('search-icon');
const searchInput = document.getElementById('search-input');
const reportTitle = document.getElementById('report-title');

searchIcon.addEventListener('click', () => {
  reportTitle.style.display = 'none';
  searchIcon.style.display = 'none';
  searchInput.style.display = 'block';
  searchInput.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    searchInput.style.display = 'none';
    reportTitle.style.display = 'inline';
    searchIcon.style.display = 'inline';
    searchInput.value = '';
  }
});

document.querySelector('button').addEventListener('click', async () => {
  const [startInput, endInput] = document.querySelectorAll('input[type="date"]');
  const startDate = startInput.value;
  const endDate = endInput.value;
  const dormNumber = document.getElementById('dorm-select').value;

  let url = `http://45.89.65.217:5000/api/Students/DebtorsReport?startDate=${startDate}&endDate=${endDate}`;
  if (dormNumber) url += `&dormitoryNumber=${dormNumber}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("Сессия истекла. Войдите заново.");
        localStorage.removeItem("jwt");
        window.location.href = "../login-page/index.html";
        return;
      }
      throw new Error('Ошибка при формировании отчета');
    }

    const blob = await response.blob();
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'Должники.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);
  } catch (error) {
    alert('Ошибка: ' + error.message);
    console.error(error);
  }
});

async function loadDormitories() {
  try {
    const response = await fetch('http://45.89.65.217:5000/api/Dormitories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("Сессия истекла. Войдите заново.");
        localStorage.removeItem("jwt");
        window.location.href = "../login-page/index.html";
        return;
      }
      throw new Error("Ошибка при загрузке общежитий");
    }

    const dorms = await response.json();
    const select = document.getElementById('dorm-select');

    dorms.forEach(dorm => {
      const option = document.createElement('option');
      option.value = dorm.dormitory_Number;
      option.textContent = `№${dorm.dormitory_Number} ${dorm.address}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Ошибка при загрузке общежитий:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDormitories();
});

document.getElementById('search-input').addEventListener('input', () => {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const reportItems = document.querySelectorAll('#report-list li');

  reportItems.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? 'block' : 'none';
  });
});

document.querySelectorAll('#report-list li').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('#report-list li').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    const selectedReport = item.dataset.report;
    const form = document.getElementById('report-form');
    const placeholder = document.getElementById('report-placeholder');

    if (selectedReport === 'debtors') {
      form.style.display = 'block';
      placeholder.style.display = 'none';
    } else {
      form.style.display = 'none';
      placeholder.style.display = 'block';
    }
  });
});
