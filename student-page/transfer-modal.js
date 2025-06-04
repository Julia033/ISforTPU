// === Загрузка HTML модального окна ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('../student-page/transfer-modal.html');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);
    setupTransferModalEvents();
  } catch (err) {
    console.error('Ошибка при загрузке transfer-modal:', err);
  }
});

// === Открытие модального окна переселения ===
function openTransferModal(roomNumber) {
  window.pendingTransferRoom = roomNumber;
  document.getElementById('transferModal')?.classList.remove('hidden');
}

// === Закрытие модального окна переселения ===
function closeTransferModal() {
  document.getElementById('transferModal')?.classList.add('hidden');
}

// === Инициализация кнопок в модальном окне ===
function setupTransferModalEvents() {
  const confirmTransferBtn = document.getElementById('confirmTransfer');
  const cancelTransferBtn = document.getElementById('cancelTransfer');

  if (!confirmTransferBtn || !cancelTransferBtn) {
    console.warn('Кнопки подтверждения переселения не найдены');
    return;
  }

  // Закрытие модального окна по кнопке "Отмена"
  cancelTransferBtn.addEventListener('click', () => {
    closeTransferModal();
  });

  // Обработка переселения
  confirmTransferBtn.addEventListener('click', () => {
    const roomNumber = window.pendingTransferRoom;
    const studentId = window.studentId;

    if (!studentId || !roomNumber) {
      alert('Данные для переселения не найдены');
      return;
    }

    // ✅ Вызов уже существующей функции из script.js
    transferStudentToRoom(roomNumber);
    closeTransferModal();
  });
}
