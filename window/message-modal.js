document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('../window/message-modal.html');
    const html = await res.text();

    document.body.insertAdjacentHTML('beforeend', html);
    initModalBehavior();
  } catch (err) {
    console.error('Ошибка загрузки modal.html:', err);
  }
});

function initModalBehavior() {
  const modal = document.getElementById('messageModal');
  const openBtn = document.getElementById('open-message-btn');
  const closeBtn = modal?.querySelector('.message-close-btn');
  const tabs = modal?.querySelectorAll('.message-tab') || [];
  const tabContents = modal?.querySelectorAll('.message-tab-content') || [];
  const recipientWrapper = modal?.querySelector('#recipientWrapper');
  const newMessageBtn = modal?.querySelector('#newMessageBtn');
  const sendBtn = modal?.querySelector('.message-send-btn');
  const messageInput = modal?.querySelector('.message-input');
  const footer = modal?.querySelector('.message-modal-footer');

  if (!modal || !openBtn) {
    console.warn("Не найдены messageModal или open-message-btn");
    return;
  }

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    footer?.classList.add('hidden');
    recipientWrapper?.classList.add('hidden');

    // Устанавливаем активной вкладку "Входящие"
    tabs.forEach(t => t.classList.remove('active', 'grayed'));
    modal.querySelector('[data-tab="inbox"]')?.classList.add('active');

    // Отображаем блок inbox, скрываем остальные
    tabContents.forEach(c => c.classList.add('hidden'));
    modal.querySelector('#inbox')?.classList.remove('hidden');
    modal.querySelector('#sent')?.classList.add('hidden');
  });



  closeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    footer?.classList.add('hidden');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'grayed'));
      tab.classList.add('active');
      tabContents.forEach(c => c.classList.add('hidden'));
      const targetId = tab.dataset.tab;
      modal.querySelector(`#${targetId}`)?.classList.remove('hidden');
      footer?.classList.add('hidden');
      recipientWrapper?.classList.add('hidden');
    });
  });

  newMessageBtn?.addEventListener('click', () => {
    recipientWrapper?.classList.remove('hidden');
    modal.querySelector('#inbox')?.classList.add('hidden');
    modal.querySelector('#sent')?.classList.add('hidden');
    tabs.forEach(t => {
      t.classList.remove('active');
      t.classList.add('grayed');
    });
    footer?.classList.remove('hidden');
  });

  const inboxTab = modal.querySelector('[data-tab="inbox"]');
  inboxTab?.addEventListener('click', () => {
    const inbox = modal.querySelector('#inbox');
    if (inbox && inbox.innerHTML.trim() === '') {
      inbox.innerHTML = `
        <div class="message-card new">
          <div class="message-card-header">
            Новый вопрос <span class="message-reply-icon" style="cursor: pointer;">↩</span>
          </div>
          <div class="message-card-body">
            <strong>Иван Иванов</strong><br>Комната 720<br>
            Здравствуйте! В комнате 720 холодные трубы, можно вызвать сантехника?
          </div>
        </div>
      `;
    }
    footer?.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('message-reply-icon')) {
      footer?.classList.remove('hidden');
    }
  });

  sendBtn?.addEventListener('click', () => {
    if (messageInput) messageInput.value = '';
    footer?.classList.add('hidden');
    tabs.forEach(t => t.classList.remove('active', 'grayed'));
    modal.querySelector('[data-tab="sent"]')?.classList.add('active');
    modal.querySelector('#sent')?.classList.remove('hidden');
    modal.querySelector('#inbox')?.classList.add('hidden');
  });
}
