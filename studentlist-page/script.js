
let students = [];
let currentView = "original";
const filters = { room: "", name: "", birth: "", phone: "", status: "" };
let activeFilterKey = null;

const tableBody = document.getElementById("student-table-body");
const tableHead = document.querySelector("thead");

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



// Загрузка студентов при запуске страницы
document.addEventListener("DOMContentLoaded", fetchStudents);

async function fetchStudents() {
  try {
    const token = localStorage.getItem('jwt');

    if (!token) {
      alert("Вы не авторизованы. Пожалуйста, войдите снова.");
      window.location.href = "../login-page/index.html";
      return;
    }

    const response = await fetch("http://45.89.65.217:5000/api/Students", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Ошибка при загрузке студентов. Статус: " + response.status);
    }

    const data = await response.json();
    students = data;
    renderTable(currentView);
  } catch (err) {
    console.error("Ошибка при загрузке студентов:", err);
    alert("Не удалось загрузить список студентов");
  }
}

async function fetchData(url) {
  try {
    const token = localStorage.getItem('jwt');

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    return await response.json();
  } catch (err) {
    console.error("Ошибка при запросе:", err);
    return [];
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "нет информации";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU");
}

function parseCertificateStatus(validArray) {
  if (!validArray || !Array.isArray(validArray)) return "нет информации";
  if (validArray.every(v => v)) return "актуальны";
  if (validArray.every(v => !v)) return "просрочены";
  return "есть просрочка";
}

function applyFiltersToList(list) {
  return list.filter(s =>
    (s.room_Number + "").toLowerCase().includes(filters.room) &&
    s.fullName?.toLowerCase().includes(filters.name) &&
    (s.birth_Date || "").toLowerCase().includes(filters.birth) &&
    (s.phone_Number || "").toLowerCase().includes(filters.phone) &&
    (s.inDorm ? "в общежитии" : "нет").includes(filters.status)
  );
}

async function renderTable(view = "original") {
  tableBody.innerHTML = "";
  let list = [];

  if (view === "original") {
    list = applyFiltersToList(students);
  } else {
    const apiMap = {
      education: "http://45.89.65.217:5000/api/Students/Studies",
      certificate: "http://45.89.65.217:5000/api/Students/Certificates",
      accounting: "http://45.89.65.217:5000/api/Students/Accounting"
    };

    list = await fetchData(apiMap[view]);
    list = applyFiltersToList(list);
  }

  list.sort((a, b) => {
    const roomA = a.room_Number || 0;
    const roomB = b.room_Number || 0;

    if (roomA !== roomB) return roomA - roomB;

    const nameA = (a.fullName || "").toLowerCase();
    const nameB = (b.fullName || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });


  list.forEach(s => {
    const row = document.createElement("tr");
    if (role === "admin") {
      row.innerHTML += `<td class="col-dorm">${s.dormNumb ?? "нет информации"}</td>`;
    }
    row.innerHTML += `<td class="col-room">${s.room_Number ?? "нет информации"}</td>`;

    row.innerHTML += `<td><a href="../student-page/index.html?id=${s.person_ID}" class="student-link">${s.fullName ?? "нет информации"}</a></td>`;

    if (view === "original") {
      row.innerHTML += `<td>${formatDate(s.birth_Date)}</td>`;
      row.innerHTML += `<td>${s.phone_Number ?? "нет информации"}</td>`;
      row.innerHTML += `<td>${s.inDorm ? "В общежитии" : "Нет"}</td>`;
      row.innerHTML += `<td>${s.studyGroup ?? "нет информации"}</td>`;
      row.innerHTML += `<td>${s.certificateStatus ?? "нет информации"}</td>`;
      row.innerHTML += `<td>нет информации</td>`;
      row.innerHTML += `<td>${s.hasDebt ? "Нет задолженности" : "Есть долг"}</td>`;
      row.innerHTML += `<td></td>`;
    } else if (view === "education") {
      row.innerHTML += `<td>${s.school ?? "нет информации"}</td>`;
      row.innerHTML += `<td>${s.studyGroup ?? "нет информации"}</td>`;
      row.innerHTML += `<td>${s.course ?? "нет информации"}</td>`;
      row.innerHTML += `<td>${s.studyForm ?? "нет информация"}</td>`;
    } else if (view === "certificate") {
      const certs = Array.isArray(s.certNames) ? s.certNames : ["нет информации"];
      const statuses = Array.isArray(s.isValid) ? s.isValid : [null];
      const fromDates = Array.isArray(s.fromDates) ? s.fromDates : [null];

      const certCount = Math.max(certs.length, statuses.length, fromDates.length);
      const certRows = [];

      for (let i = 0; i < certCount; i++) {
        const name = certs[i] ?? "нет информации";
        const status = statuses[i] === true ? "Актуальна" :
          statuses[i] === false ? "Не актуальна" : "нет информация";
        const date = formatDate(fromDates[i]);
        certRows.push(`${name} | ${status} | ${date}`);
      }

      row.innerHTML += `<td colspan="3">${certRows.join("<br>")}</td>`;
    } else if (view === "accounting") {
      row.innerHTML += `<td>${s.hasDebt ? "Нет задолженности" : "Есть долг"}</td>`;
      row.innerHTML += `<td>${s.amount ?? "нет информация"}₽</td>`;
      row.innerHTML += `<td>${formatDate(s.lastPaymentDate)}</td>`;
    }

    tableBody.appendChild(row);
  });

  updateHeaders(view);
  enableFilters();
}

function updateHeaders(view) {
  const headerRow1 = document.createElement("tr");
  const headerRow2 = document.createElement("tr");
  tableHead.innerHTML = "";

  if (role === "admin") {
    headerRow1.innerHTML += `<th rowspan="2" class="col-dorm">Общ.</th>`;
  }
  headerRow1.innerHTML += `<th rowspan="2" class="col-room">Ком.</th>`;


  headerRow1.innerHTML += `<th rowspan="2">ФИО</th>`;

  if (view === "original") {
    headerRow1.innerHTML += `<th rowspan="2">Дата рождения</th>`;
    headerRow1.innerHTML += `<th rowspan="2">Телефон</th>`;
    headerRow1.innerHTML += `<th rowspan="2">Статус</th>`;
    headerRow1.innerHTML += `<th rowspan="2" class="toggleable" data-type="education">Обучение <span class="arrow">▾</span></th>`;
    headerRow1.innerHTML += `<th rowspan="2" class="toggleable" data-type="certificate">Справка <span class="arrow">▾</span></th>`;
    headerRow1.innerHTML += `<th rowspan="2">Паспортный стол</th>`;
    headerRow1.innerHTML += `<th rowspan="2" class="toggleable" data-type="accounting">Бухгалтерия <span class="arrow">▾</span></th>`;
    headerRow1.innerHTML += `<th rowspan="2">Примечание</th>`;
  } else if (view === "education") {
    headerRow1.innerHTML += `<th colspan="4" class="toggleable" data-type="education">Обучение <span class="arrow">▾</span></th>`;
    headerRow2.innerHTML += `<th>Школа</th><th>Группа</th><th>Курс</th><th>Форма обучения</th>`;
  } else if (view === "certificate") {
    headerRow1.innerHTML += `<th colspan="3" class="toggleable" data-type="certificate">Справка <span class="arrow">▾</span></th>`;
  } else if (view === "accounting") {
    headerRow1.innerHTML += `<th colspan="3" class="toggleable" data-type="accounting">Бухгалтерия <span class="arrow">▾</span></th>`;
    headerRow2.innerHTML += `<th>Долг</th><th>Задолженность</th><th>Дата оплаты</th>`;
  }

  tableHead.appendChild(headerRow1);
  if (view !== "original") tableHead.appendChild(headerRow2);

  document.querySelectorAll("th.toggleable").forEach(th => {
    th.addEventListener("click", () => {
      if (role === "admin" || role === "user") {
        const selected = th.dataset.type;
        currentView = currentView === selected ? "original" : selected;
        renderTable(currentView);
      }
    });
  });
}

function enableFilters() {
  const headerRows = tableHead.querySelectorAll("tr");

  if (currentView === "original") {
    const filterRow = headerRows[1] || headerRows[0];
    const headers = Array.from(filterRow.children);
    const keys = ["room", "name", "birth", "phone", "status"];

    headers.forEach((th, i) => {
      const key = keys[i];
      if (!key) return;
      th.style.cursor = "pointer";
      th.addEventListener("click", () => showFilterInput(th, key));
    });
  }
}


function showFilterInput(th, key) {
  if (activeFilterKey === key) return;

  activeFilterKey = key;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Поиск...";
  input.value = filters[key];
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  input.style.padding = "4px";
  input.style.fontSize = "13px";
  input.style.border = "none";
  input.style.borderBottom = "1px solid #aaa";
  input.style.fontFamily = "inherit";
  input.style.backgroundColor = "transparent";

  th.innerHTML = "";
  th.appendChild(input);
  input.focus();

  input.addEventListener("input", () => {
    filters[key] = input.value.trim().toLowerCase();
    renderTablePreserveInput(key, input.value);
    updateClearButtonVisibility();
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      filters[key] = "";
      activeFilterKey = null;
      renderTable(currentView);
      updateClearButtonVisibility();
    }
  });

  input.addEventListener("blur", () => {
    activeFilterKey = null;
    renderTable(currentView);
    updateClearButtonVisibility();
  });
}


function renderTablePreserveInput(preservedKey, preservedValue) {
  renderTable(currentView);

  // восстанавливаем input после render
  const filterRow = tableHead.querySelectorAll("tr")[1] || tableHead.querySelector("tr");
  const headers = Array.from(filterRow.children);
  const keyIndex = ["room", "name", "birth", "phone", "status"].indexOf(preservedKey);
  if (keyIndex !== -1) {
    const th = headers[keyIndex];
    if (th) {
      showFilterInput(th, preservedKey);
      const input = th.querySelector("input");
      if (input) input.value = preservedValue;
    }
  }
}

function updateClearButtonVisibility() {
  const isFiltering = Object.values(filters).some(val => val);
  const btn = document.getElementById("clear-filters-btn");
  if (btn) btn.style.display = isFiltering ? "inline-block" : "none";
}

document.getElementById("clear-filters-btn").addEventListener("click", () => {
  Object.keys(filters).forEach(k => filters[k] = "");
  activeFilterKey = null;
  renderTable(currentView);
  updateClearButtonVisibility();
});
