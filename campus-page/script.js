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



// === Загрузка данных об общежитиях ===
const dormGrid = document.getElementById('dorm-grid');
const emptyMessage = document.getElementById('empty-message');

fetch('http://45.89.65.217:5000/api/Dormitories', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(response => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("Сессия истекла или у Вас недостаточно прав.");
        //localStorage.removeItem("jwt");
        window.location.href = "../studentlist-page/index.html";
        return;
      }
      throw new Error('Ошибка при загрузке данных');
    }
    return response.json();
  })
  .then(dormData => {
    if (!Array.isArray(dormData) || dormData.length === 0) {
      emptyMessage.style.display = 'block';
      return;
    }

    emptyMessage.style.display = 'none';
    dormData.forEach(dorm => {
      const card = document.createElement('div');
      card.className = 'dorm-card';
      card.innerHTML = `
        <h2>Общежитие №${dorm.dormitory_Number}</h2>
        <p>${dorm.address}</p>
        <div class="person">
          <img src="images/nophoto.jpg" alt="Заведующий">
          <div>
            <div><strong>${dorm.manager_Name}</strong></div>
            <div>${formatPhoneNumber(dorm.manager_Phone_Number)}</div>
          </div>
        </div>
      `;
      dormGrid.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Ошибка при получении данных:', error);
    emptyMessage.style.display = 'block';
  });

function formatPhoneNumber(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
}
