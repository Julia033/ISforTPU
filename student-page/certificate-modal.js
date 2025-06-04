document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('certificate-modal.html'); // путь изменён
    const html = await res.text();

    document.body.insertAdjacentHTML('beforeend', html);

    await loadCertificateTypes();
    setupCertificateModalEvents();
  } catch (err) {
    console.error('Ошибка при загрузке окна справки:', err);
  }
});

function closeCertificateModal() {
  document.getElementById('certificateModal')?.classList.add('hidden');
}

function openCertificateModal() {
  document.getElementById('certificateModal')?.classList.remove('hidden');
}

async function loadCertificateTypes() {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id'); // берем id из URL

  if (!studentId) {
    console.warn('ID студента не указан');
    return;
  }

  try {
    const token = localStorage.getItem("jwt");
    const res = await fetch('http://45.89.65.217:5000/api/data/students/CertificatesName', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const types = await res.json();
    const select = document.getElementById('certificateType');
    select.innerHTML = '';

    types.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Ошибка при загрузке типов справок:', err);
    const select = document.getElementById('certificateType');
    select.innerHTML = '<option disabled>Ошибка загрузки</option>';
  }
}

function setupCertificateModalEvents() {
  const submitBtn = document.getElementById('submitCertificate');
  submitBtn?.addEventListener('click', async () => {
    const type = document.getElementById('certificateType').value;
    const from = new Date(document.getElementById('startDate').value);
    const to = new Date(document.getElementById('endDate').value);


    const studentId = window.studentId;


    if (!studentId) {
      console.warn('ID студента не указан');
      return;
    }

    try {
      const res = await fetch(`http://45.89.65.217:5000/api/data/students/${studentId}/certificates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          certificateName: type,
          fromDate: from,
          toDate: to
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ошибка API: ${res.status} — ${errorText}`);
      }

      console.log('Справка успешно добавлена');
      closeCertificateModal();
      location.reload();

    } catch (err) {
      console.error('Ошибка при отправке справки:', err);
    }
  });
}

