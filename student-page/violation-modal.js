document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('violation-modal.html');
        const html = await res.text();

        document.body.insertAdjacentHTML('beforeend', html);
        await loadViolationTypes();
        setupViolationModalEvents();
    } catch (err) {
        console.error('Ошибка при загрузке violation-modal:', err);
    }
});

function openViolationModal() {
    document.getElementById('violationModal')?.classList.remove('hidden');
}

function closeViolationModal() {
    document.getElementById('violationModal')?.classList.add('hidden');
}

async function loadViolationTypes() {
    const studentId = window.studentId;

    if (!studentId) {
        console.warn('ID студента не указан');
        return;
    }

    try {
        const token = localStorage.getItem("jwt");
        const res = await fetch(`http://45.89.65.217:5000/api/data/students/OffencesName`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const types = await res.json();
        const select = document.getElementById('violationType');
        select.innerHTML = '';

        types.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Ошибка при загрузке типов нарушений:', err);
        const select = document.getElementById('violationType');
        select.innerHTML = '<option disabled>Ошибка загрузки</option>';
    }
}
function setupViolationModalEvents() {
    const submitBtn = document.getElementById('submitViolation');

    submitBtn?.addEventListener('click', async () => {
        const type = document.getElementById('violationType').value;
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('id');

        if (!type || !studentId) {
            alert('Не выбран тип нарушения или не указан studentId');
            return;
        }

        try {
            const res = await fetch(`http://45.89.65.217:5000/api/data/students/${studentId}/offences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    OffenceName: type
                })

            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Ошибка API: ${res.status} — ${errText}`);
            }

            closeViolationModal();
        } catch (err) {
            console.error('Ошибка при отправке нарушения:', err);
            alert('Не удалось добавить нарушение');
        }
    });
}

