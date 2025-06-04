// === Проверка токена и получение роли ===
const token = localStorage.getItem("jwt");
if (!token) {
  alert("Вы не авторизованы. Выполните вход.");
  window.location.href = "../login-page/index.html";
}
console.log("JWT токен:", token);

// Расшифровка токена
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Ошибка при парсинге токена", e);
    return null;
  }
}

const payload = parseJwt(token);
console.log("Payload токена:", payload);

if (!payload) {
  alert("Ошибка токена. Выполните вход заново.");
  localStorage.removeItem("jwt");
  window.location.href = "../login-page/index.html";
}

const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?.toLowerCase();

// Скрыть кнопку "Написать сообщение" для всех, кроме user
if (role !== "user") {
  document.getElementById("open-message-btn")?.style?.setProperty("display", "none");
}

// === Навигация ===
document.getElementById("home-button")?.addEventListener("click", () => {
  window.location.href = "../studentlist-page/index.html";
});
document.getElementById("exit-button")?.addEventListener("click", () => {
  localStorage.removeItem("jwt");
  window.location.href = "../login-page/index.html";
});


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


// === Аккордеоны ===
document.querySelectorAll('.accordion-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const content = btn.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  });
});

// === Загрузка данных студента ===
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');
window.studentId = studentId;

if (studentId) {
  fetch(`http://45.89.65.217:5000/api/Students/${studentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(student => {
      document.getElementById('full-name').textContent = student.fullName;
      document.getElementById('student-number').textContent = `ID: ${student.person_ID}`;

      document.getElementById('left-info').innerHTML = `
        <p>Дата рождения: ${new Date(student.birth_Date).toLocaleDateString('ru-RU')}</p>
        <p>Гражданство: —</p>
        <p>Номер телефона: ${student.phone_Number}</p>
        <p>Email: ${student.email}</p>
        <p>Школа: ${student.schoolName}</p>
        <p>Группа: ${student.studyGroup}</p>
      `;

      const statusText = student.inDorm ? 'В общежитии' : 'Не в общежитии';
      document.getElementById('right-info').innerHTML = `
        <p>Общежитие: №${student.dormNumber}</p>
        <p>Комната: ${student.room_Number}</p>
        <p>Дата заселения: —</p>
        <p>Договор: —</p>
        <p>Статус: ${statusText}</p>
      `;

      fetch('http://45.89.65.217:5000/api/Students/Certificates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(certData => {
          const cert = certData.find(c => c.person_ID == student.person_ID);
          const certBlock = document.getElementById('certificates-block');
          certBlock.innerHTML = '';

          if (!cert || !cert.certNames || cert.certNames.length === 0) {
            certBlock.innerHTML = '<p>Нет данных</p>';
            return;
          }

          for (let i = 0; i < cert.certNames.length; i++) {
            const name = cert.certNames[i] || '—';
            const isValid = cert.isValid[i] ? 'Актуальна' : 'Не актуальна';
            const from = cert.fromDates[i] ? new Date(cert.fromDates[i]).toLocaleDateString('ru-RU') : '—';
            const to = cert.toDates[i] ? new Date(cert.toDates[i]).toLocaleDateString('ru-RU') : '—';

            const p = document.createElement('p');
            p.textContent = `${name} — ${isValid} (с ${from} по ${to})`;
            certBlock.appendChild(p);
          }
        })
        .catch(err => {
          console.error('Ошибка при загрузке справок:', err);
          document.getElementById('certificates-block').innerHTML = '<p>Ошибка загрузки</p>';
        });
      fetch('http://45.89.65.217:5000/api/Students/Offences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(offenceData => {
          const offences = offenceData.filter(o => o.person_ID == student.person_ID);
          const offencesBlock = document.getElementById('offences-block');
          offencesBlock.innerHTML = '';

          if (!offences || offences.length === 0) {
            offencesBlock.innerHTML = '<p>Нет данных</p>';
            return;
          }

          offences.forEach(o => {
            const date = o.offenceDate ? new Date(o.offenceDate).toLocaleDateString('ru-RU') : '—';
            const name = o.offenceName || '—';
            const type = o.isRepeated ? 'Повторное' : 'Первое';

            const p = document.createElement('p');
            p.textContent = `${date} — ${name} (${type})`;
            offencesBlock.appendChild(p);
          });
        })
        .catch(err => {
          console.error('Ошибка при загрузке нарушений:', err);
          document.getElementById('offences-block').innerHTML = '<p>Ошибка загрузки</p>';
        });


      fetch('http://45.89.65.217:5000/api/Students/Accounting', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(accountingData => {
          const acc = accountingData.find(a => a.person_ID == student.person_ID);
          const accBlock = document.getElementById('accounting-block');
          accBlock.innerHTML = '';

          if (!acc) {
            accBlock.innerHTML = '<p>Нет данных</p>';
            return;
          }

          const date = acc.lastPaymentDate ? new Date(acc.lastPaymentDate).toLocaleDateString('ru-RU') : '—';
          const status = acc.hasDebt ? 'Есть долг' : 'Долга нет';

          accBlock.innerHTML = `
            <p>Последний платеж: ${acc.amount}₽ — ${date}</p>
            <p>${status}</p>
          `;
        })
        .catch(err => {
          console.error('Ошибка при загрузке данных об оплате:', err);
          document.getElementById('accounting-block').innerHTML = '<p>Ошибка загрузки</p>';
        });
    })
    .catch(err => {
      document.getElementById('full-name').textContent = 'Ошибка загрузки данных';
      console.error('Ошибка при получении данных студента:', err);
    });
} else {
  document.getElementById('full-name').textContent = 'ID не указан';
}

// === Функция переселения ===
function openTransferPage() {
  const studentId = window.studentId;
  if (!studentId) {
    alert("ID студента не найден");
    return;
  }
  window.location.href = `../room-page/index.html?studentId=${studentId}`;
}
