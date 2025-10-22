const accountsList = document.getElementById('accounts-list');
const activeAccountInfo = document.getElementById('active-account-info');
const generateButton = document.getElementById('generate-account');
const importForm = document.getElementById('import-form');
const importLabel = document.getElementById('import-label');
const importAddress = document.getElementById('import-address');
const importPrivate = document.getElementById('import-private');
const walletConnectButton = document.getElementById('start-walletconnect');
const walletConnectUri = document.getElementById('walletconnect-uri');
const walletConnectSessions = document.getElementById('walletconnect-sessions');

function sendMessage(action, payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { channel: 'codexwallet:popup', action, payload },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response?.result);
      }
    );
  });
}

function truncate(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function refreshState() {
  try {
    const data = await sendMessage('listAccounts');
    renderActiveAccount(data);
    renderAccounts(data);
    renderWalletConnect(data.walletConnect || {});
  } catch (error) {
    activeAccountInfo.textContent = error.message;
    activeAccountInfo.classList.add('empty');
  }
}

function renderActiveAccount(state) {
  const { accounts, activeAccountId } = state;
  const active = accounts.find((account) => account.id === activeAccountId);
  if (!active) {
    activeAccountInfo.textContent = 'Sin seleccionar';
    activeAccountInfo.classList.add('empty');
    return;
  }
  activeAccountInfo.classList.remove('empty');
  activeAccountInfo.innerHTML = `
    <div class="label">${active.label}</div>
    <div class="address">${active.address}</div>
  `;
}

function renderAccounts(state) {
  const { accounts, activeAccountId } = state;
  accountsList.innerHTML = '';
  if (!accounts.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No hay cuentas';
    accountsList.appendChild(li);
    return;
  }

  accounts.forEach((account) => {
    const li = document.createElement('li');
    li.className = 'account-item';
    const details = document.createElement('div');
    details.className = 'details';
    const label = document.createElement('strong');
    label.textContent = account.label;
    const address = document.createElement('span');
    address.className = 'address';
    address.textContent = account.address;
    details.appendChild(label);
    details.appendChild(address);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const selectBtn = document.createElement('button');
    selectBtn.className = 'secondary';
    selectBtn.textContent = account.id === activeAccountId ? 'Activa' : 'Activar';
    selectBtn.disabled = account.id === activeAccountId;
    selectBtn.addEventListener('click', async () => {
      await sendMessage('setActiveAccount', { accountId: account.id });
      await refreshState();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'secondary';
    removeBtn.textContent = 'Eliminar';
    removeBtn.addEventListener('click', async () => {
      if (confirm(`¿Eliminar ${account.label}?`)) {
        await sendMessage('deleteAccount', { accountId: account.id });
        await refreshState();
      }
    });

    actions.appendChild(selectBtn);
    actions.appendChild(removeBtn);

    li.appendChild(details);
    li.appendChild(actions);
    accountsList.appendChild(li);
  });
}

function renderWalletConnect(sessions) {
  walletConnectSessions.innerHTML = '';
  walletConnectUri.textContent = '';

  const entries = Object.values(sessions || {});
  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Sin sesiones activas';
    walletConnectSessions.appendChild(li);
    return;
  }

  entries.forEach((session) => {
    const li = document.createElement('li');
    li.className = 'session-item';
    const info = document.createElement('div');
    info.innerHTML = `<strong>Topic:</strong> ${truncate(session.topic)}<br /><small>${new Date(session.createdAt).toLocaleString()}</small>`;
    const button = document.createElement('button');
    button.className = 'secondary';
    button.textContent = 'Cerrar';
    button.addEventListener('click', async () => {
      await sendMessage('disconnectWalletConnect', { sessionId: session.sessionId });
      await refreshState();
    });
    li.appendChild(info);
    li.appendChild(button);
    walletConnectSessions.appendChild(li);
  });
}

generateButton.addEventListener('click', async () => {
  generateButton.disabled = true;
  try {
    await sendMessage('generateAccount');
    await refreshState();
  } catch (error) {
    alert(error.message);
  } finally {
    generateButton.disabled = false;
  }
});

importForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const label = importLabel.value.trim();
  const address = importAddress.value.trim();
  const privateKey = importPrivate.value.trim();
  try {
    await sendMessage('saveAccount', { label, address, privateKey });
    importForm.reset();
    await refreshState();
  } catch (error) {
    alert(error.message);
  }
});

walletConnectButton.addEventListener('click', async () => {
  walletConnectButton.disabled = true;
  try {
    const session = await sendMessage('startWalletConnect');
    walletConnectUri.textContent = session.uri;
    await refreshState();
  } catch (error) {
    alert(error.message);
  } finally {
    walletConnectButton.disabled = false;
  }
});

refreshState();
