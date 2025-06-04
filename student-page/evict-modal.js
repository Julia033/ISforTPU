document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('evict-modal.html');
        const html = await res.text();

        document.body.insertAdjacentHTML('beforeend', html);
        setupEvictModalEvents();
    } catch (err) {
        console.error('Ошибка при загрузке evict-modal:', err);
    }
});

function openEvictModal() {
    document.getElementById('evictModal')?.classList.remove('hidden');
}

function closeEvictModal() {
    document.getElementById('evictModal')?.classList.add('hidden');
}

function setupEvictModalEvents() {
    const evictButton = document.querySelector('.left-buttons button:nth-child(4)');
    const confirmEvictBtn = document.getElementById('confirmEvict');
    const cancelEvictBtn = document.getElementById('cancelEvict');

    if (!evictButton || !confirmEvictBtn || !cancelEvictBtn) {
        console.warn('Элементы модального окна не найдены');
        return;
    }

    evictButton.addEventListener('click', () => {
        openEvictModal();
    });

    cancelEvictBtn.addEventListener('click', () => {
        closeEvictModal();
    });

    confirmEvictBtn.addEventListener('click', async () => {
        const studentId = window.studentId;

        if (!studentId) {
            alert('ID студента не найден');
            return;
        }

        try {
            const token = localStorage.getItem("jwt");

            const res = await fetch(`http://45.89.65.217:5000/api/data/students/${studentId}/evict`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }


            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Ошибка API: ${res.status} — ${errText}`);
            }

            closeEvictModal();
            window.location.href = '../studentlist-page/index.html';
        } catch (err) {
            console.error('Ошибка при выселении:', err);
            alert('Ошибка при выселении');
        }
    });
}
