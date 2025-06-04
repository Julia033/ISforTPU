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
  document.getElementById("rooms-button").addEventListener("click", () => {
    window.location.href = "../room-page/index.html";
  });
  document.getElementById("journal-button").addEventListener("click", () => {
    window.location.href = "../journal-page/index.html";
  });
  // скрыть кнопки, недоступные пользователю
  document.getElementById("report-button").style.display = "none";
} else if (role === "admin") {
  document.getElementById("report-button").addEventListener("click", () => {
    window.location.href = "../report-page/index.html";
  });
  document.getElementById("rooms-button").addEventListener("click", () => {
    window.location.href = "../campus-page/index.html";
  });
  document.getElementById("journal-button").style.display = "none";
}


const emptyMessage = document.getElementById('empty-message');
const floorButtons = document.querySelectorAll('.floor-btn');
const scrollContainer = document.getElementById('scroll-container');
const btnLeft = document.getElementById('scroll-left');
const btnRight = document.getElementById('scroll-right');

const dormNumber = 14; // фиксируем для текущего общежития
document.getElementById('dorm-title').textContent = `Общежитие №${dormNumber}`;


document.getElementById('scroll-left').onclick = () => scrollContainer.scrollLeft -= 300;
document.getElementById('scroll-right').onclick = () => scrollContainer.scrollLeft += 300;

function updateScrollButtons() {
  const scrollable = scrollContainer.scrollWidth > scrollContainer.clientWidth;
  btnLeft.style.display = scrollable ? 'block' : 'none';
  btnRight.style.display = scrollable ? 'block' : 'none';
}
window.addEventListener('load', updateScrollButtons);
window.addEventListener('resize', updateScrollButtons);

// Загрузка комнат по этажу
function renderRooms(floor) {
  fetch(`http://45.89.65.217:5000/api/Dormitories/${dormNumber}/floors/${floor}/rooms`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

    .then(res => {
      if (!res.ok) throw new Error('Ошибка при получении комнат');
      return res.json();
    })
    .then(rooms => {
      const rowOdd = document.getElementById('row-odd');
      const rowEven = document.getElementById('row-even');
      rowOdd.innerHTML = '';
      rowEven.innerHTML = '';
      emptyMessage.style.display = rooms.length === 0 ? 'block' : 'none';

      rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';

        const roomNumber = document.createElement('div');
        roomNumber.className = 'room-number';
        roomNumber.textContent = room.roomNumber;
        card.appendChild(roomNumber);

        const occupantContainer = document.createElement('div');
        occupantContainer.className = 'room-occupants';

        const occupied = room.residents.length;
        const free = 3 - occupied;

        room.residents.forEach(resident => {
          const s = document.createElement('div');
          s.className = 'student';
          s.innerHTML = `
            <img src="images/nophoto.jpg" alt="Фото">
            <div>${resident.fullName.replace(' ', '<br>')}</div>
          `;
          occupantContainer.appendChild(s);
        });

        for (let i = 0; i < free; i++) {
          const plus = document.createElement('div');
          plus.className = 'free-slot';
          plus.innerHTML = `
    <div class="plus-icon">+</div>
    <div class="plus-label">&nbsp;</div>
  `;
          plus.addEventListener('click', () => {
            if (!room.roomNumber) {
              console.warn('room.roomNumber отсутствует. Сам объект комнаты:', room);
              alert('Ошибка: комната не содержит номер');
              return;
            }

            openTransferModal(room.roomNumber);
          });

          // ✅ Добавить в контейнер
          occupantContainer.appendChild(plus);
        }


        card.appendChild(occupantContainer);

        const num = parseInt(room.roomNumber, 10);
        if (num % 2 === 0) {
          rowEven.appendChild(card);
        } else {
          rowOdd.appendChild(card);
        }
      });

      updateScrollButtons();
    })
    .catch(error => {
      console.error('Ошибка загрузки комнат:', error);
      emptyMessage.style.display = 'block';
    });
}

// Обработка кнопок этажей
floorButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    floorButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const floor = btn.dataset.floor;
    renderRooms(floor);
  });
});

// Загрузка доступных этажей и запуск первого
fetch(`http://45.89.65.217:5000/api/Dormitories/${dormNumber}/floors`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

  .then(res => res.json())
  .then(floors => {
    floorButtons.forEach(btn => {
      const floor = parseInt(btn.dataset.floor, 10);
      if (!floors.includes(floor)) {
        btn.style.display = 'none'; // скрыть недоступный этаж
      }
    });

    // показать первый доступный
    const first = floors[0];
    const firstBtn = [...floorButtons].find(b => b.dataset.floor == first);
    if (firstBtn) {
      firstBtn.classList.add('active');
      renderRooms(first);
    }
  });

// Получаем studentId из URL
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('studentId');

window.studentId = studentId; // Делаем доступным глобально

// Функция переселения
function transferStudentToRoom(roomNumber) {
  const token = localStorage.getItem("jwt");

  if (!token) {
    alert("Вы не авторизованы. Выполните вход.");
    window.location.href = "../login-page/index.html";
    return;
  }

  const studentId = window.studentId;
  if (!studentId) {
    alert("ID студента не передан");
    return;
  }

  // Расшифровка токена для проверки срока действия
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    const payload = JSON.parse(jsonPayload);

    console.log("Токен:", token);
    console.log("Расшифрованный payload:", payload);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      alert("Срок действия токена истёк. Войдите заново.");
      localStorage.removeItem("jwt");
      window.location.href = "../login-page/index.html";
      return;
    }
  } catch (e) {
    console.error("Ошибка при расшифровке токена:", e);
  }

  console.log("Перед переселением:");
  console.log("studentId:", studentId);
  console.log("roomNumber:", roomNumber);

  fetch(`http://45.89.65.217:5000/api/data/students/${studentId}/transfer`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      newRoomNumber: roomNumber
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Ошибка переселения: " + res.status);
      window.location.href = `../studentlist-page/index.html`;
    })
    .catch(err => {
      console.error("Ошибка при переселении:", err);
      alert("Не удалось переселить студента");
    });
}

