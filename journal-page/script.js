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
const tableBody = document.getElementById('journal-table-body');


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

let fullData = [];
let filterFioQuery = '';
let filterOffenceName = '';
let sortState = 'none'; // 'none' | 'asc' | 'desc'
let filterType = ''; // '' | 'Первое' | 'Повторное'

// ====== Основная логика фильтрации и сортировки ======
function applyAllFiltersAndSort() {
    let result = [...fullData];

    if (filterFioQuery) {
        const terms = filterFioQuery.split(' ');
        result = result.filter(entry =>
            terms.every(term => entry.fullName.toLowerCase().includes(term))
        );
    }

    if (filterOffenceName) {
        result = result.filter(entry => entry.offenceName === filterOffenceName);
    }

    if (filterType) {
        result = result.filter(entry => {
            const type = entry.offenceCount ? 'Первое' : 'Повторное';
            return type === filterType;
        });
    }

    if (sortState === 'asc') {
        result.sort((a, b) => new Date(a.offenceDate) - new Date(b.offenceDate));
    } else if (sortState === 'desc') {
        result.sort((a, b) => new Date(b.offenceDate) - new Date(a.offenceDate));
    }

    updateSortArrow();
    renderTable(result);
    updateClearButtonVisibility(); 


}

// ====== Отрисовка таблицы ======
function renderTable(data) {
    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="5" class="no-data">Нет данных</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';

    data.forEach(entry => {
        const row = document.createElement('tr');
        const offenceType = entry.offenceCount ? 'Первое' : 'Повторное';
        const date = new Date(entry.offenceDate).toLocaleDateString('ru-RU');

        row.innerHTML = `
      <td>${entry.index}</td>
      <td>${entry.fullName}</td>
      <td>${entry.offenceName}</td>
      <td>${date}</td>
      <td>${offenceType}</td>
    `;
        tableBody.appendChild(row);
    });
}

// ====== Загрузка данных ======
fetch('http://45.89.65.217:5000/api/Students/Offences', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(res => {
        if (!res.ok) throw new Error("Ошибка авторизации");
        return res.json();
    })
    .then(data => {
        fullData = Array.isArray(data) ? data : [];
        applyAllFiltersAndSort();
    })
    .catch(err => {
        console.error('Ошибка загрузки:', err);
        tableBody.innerHTML = `<tr><td colspan="5" class="no-data">Ошибка загрузки</td></tr>`;
    });


// ====== Поиск по ФИО ======
const fioTh = document.querySelector('th:nth-child(2)');
fioTh.innerHTML = 'ФИО студента <img src="images/search.png" class="filter-icon" alt="поиск">';
const fioFilterIcon = fioTh.querySelector('.filter-icon');

fioFilterIcon.addEventListener('click', showFioFilter);

function showFioFilter() {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Поиск по ФИО...';
    input.value = filterFioQuery;
    styleInput(input);

    fioTh.innerHTML = '';
    fioTh.appendChild(input);
    input.focus();

    input.addEventListener('input', () => {
        filterFioQuery = input.value.trim().toLowerCase();
        applyAllFiltersAndSort();
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            filterFioQuery = '';
            restoreFioHeader();
            applyAllFiltersAndSort();
        } else if (e.key === 'Enter') {
            input.blur();
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(restoreFioHeader, 200);
    });
}

function restoreFioHeader() {
    fioTh.innerHTML = 'ФИО студента <img src="images/search.png" class="filter-icon" alt="поиск">';
    const icon = fioTh.querySelector('.filter-icon');
    icon.addEventListener('click', showFioFilter);
}

// ====== Фильтр по Нарушению ======
const offenceTh = document.querySelector('th:nth-child(3)');
const offenceFilterIcon = offenceTh.querySelector('.filter-icon');

offenceFilterIcon.addEventListener('click', showOffenceFilter);

function showOffenceFilter() {
    const select = document.createElement('select');
    styleInput(select);

    const uniqueOffences = [...new Set(fullData.map(entry => entry.offenceName))];

    select.innerHTML = `<option value="">Все</option>` +
        uniqueOffences.map(offence => `<option value="${offence}">${offence}</option>`).join('');

    select.value = filterOffenceName;

    offenceTh.innerHTML = '';
    offenceTh.appendChild(select);
    select.focus();

    select.addEventListener('change', () => {
        filterOffenceName = select.value;
        applyAllFiltersAndSort();
    });

    select.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            filterOffenceName = '';
            restoreOffenceHeader();
            applyAllFiltersAndSort();
        }
    });

    select.addEventListener('blur', () => {
        setTimeout(restoreOffenceHeader, 200);
    });
}

function restoreOffenceHeader() {
    offenceTh.innerHTML = 'Нарушение <img src="images/filter-icon.png" class="filter-icon offence-filter" alt="фильтр">';
    const icon = offenceTh.querySelector('.filter-icon');
    icon.addEventListener('click', showOffenceFilter);
}

// ====== Фильтр по Первое/Повторное ======
const typeTh = document.querySelector('th:nth-child(5)');
const typeFilterIcon = typeTh.querySelector('.filter-icon');

typeFilterIcon.addEventListener('click', showTypeFilter);

function showTypeFilter() {
    const select = document.createElement('select');
    styleInput(select);

    select.innerHTML = `
    <option value="">Все</option>
    <option value="Первое">Первое</option>
    <option value="Повторное">Повторное</option>
    
    
  `;
    select.value = filterType;

    typeTh.innerHTML = '';
    typeTh.appendChild(select);
    select.focus();

    select.addEventListener('change', () => {
        filterType = select.value;
        applyAllFiltersAndSort();
    });

    select.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            filterType = '';
            restoreTypeHeader();
            applyAllFiltersAndSort();
        }
    });

    select.addEventListener('blur', () => {
        setTimeout(restoreTypeHeader, 200);
    });
}

function restoreTypeHeader() {
    typeTh.innerHTML = 'Первое/повторное <img src="images/filter-icon.png" class="filter-icon type-filter" alt="фильтр">';
    const icon = typeTh.querySelector('.filter-icon');
    icon.addEventListener('click', showTypeFilter);
}

// ====== Сортировка по дате с отображением стрелочек ======
const dateTh = document.querySelector('th:nth-child(4)');
const sortArrow = document.createElement('span');
sortArrow.id = 'sort-arrow';
sortArrow.style.marginLeft = '6px';
sortArrow.style.fontSize = '12px';
dateTh.appendChild(sortArrow);

dateTh.addEventListener('click', () => {
    if (sortState === 'none') {
        sortState = 'desc';
    } else if (sortState === 'desc') {
        sortState = 'asc';
    } else {
        sortState = 'none';
    }

    applyAllFiltersAndSort();
});

function updateSortArrow() {
    sortArrow.textContent =
        sortState === 'asc' ? '↑' :
            sortState === 'desc' ? '↓' : '';
}

// ====== Стили для input/select ======
function styleInput(el) {
    el.style.width = '100%';
    el.style.boxSizing = 'border-box';
    el.style.padding = '4px';
    el.style.fontSize = '13px';
}

//кнопка отчистить
document.getElementById('clear-filters-btn').addEventListener('click', () => {
    filterFioQuery = '';
    filterOffenceName = '';
    filterType = '';
    sortState = 'none';
    updateSortArrow();

    restoreFioHeader();
    restoreOffenceHeader();
    restoreTypeHeader();
    applyAllFiltersAndSort();
});

function updateClearButtonVisibility() {
    const isFiltering =
        filterFioQuery !== '' ||
        filterOffenceName !== '' ||
        filterType !== '' ||
        sortState !== 'none';

    document.getElementById('clear-filters-btn').style.display = isFiltering ? 'inline-block' : 'none';
}

