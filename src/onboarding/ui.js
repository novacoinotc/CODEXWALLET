import { createWallet, importWallet, unlockWallet, removeWallet } from './index.js';

function showMessage(target, message, type = 'info') {
  if (!target) {
    return;
  }
  target.textContent = message;
  target.dataset.type = type;
}

function formatMnemonic(mnemonic) {
  return mnemonic.split(' ').reduce((lines, word, index) => {
    const position = index + 1;
    const padded = position.toString().padStart(2, '0');
    return `${lines}${padded}. ${word}${(position % 4 === 0) ? '\n' : ' '}`;
  }, '').trim();
}

export function initializeOnboarding() {
  const createForm = document.getElementById('create-wallet-form');
  const createPassword = document.getElementById('create-password');
  const createStrength = document.getElementById('create-strength');
  const createOutput = document.getElementById('create-output');
  const createStatus = document.getElementById('create-status');

  const importForm = document.getElementById('import-wallet-form');
  const importMnemonicField = document.getElementById('import-mnemonic');
  const importPasswordField = document.getElementById('import-password');
  const importStatus = document.getElementById('import-status');

  const unlockForm = document.getElementById('unlock-wallet-form');
  const unlockPasswordField = document.getElementById('unlock-password');
  const unlockOutput = document.getElementById('unlock-output');
  const unlockStatus = document.getElementById('unlock-status');
  const clearButton = document.getElementById('clear-storage');

  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      showMessage(createStatus, 'Generando semilla...', 'info');
      try {
        const { mnemonic } = await createWallet(createPassword.value, Number(createStrength.value));
        createOutput.value = formatMnemonic(mnemonic);
        showMessage(createStatus, 'Semilla creada y cifrada localmente.', 'success');
      } catch (error) {
        showMessage(createStatus, error.message, 'error');
      }
    });
  }

  if (importForm) {
    importForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      showMessage(importStatus, 'Importando semilla...', 'info');
      try {
        const { mnemonic } = await importWallet(importMnemonicField.value, importPasswordField.value);
        showMessage(importStatus, `Semilla importada y cifrada. ${mnemonic.split(' ').length} palabras.`, 'success');
        importMnemonicField.value = '';
      } catch (error) {
        showMessage(importStatus, error.message, 'error');
      }
    });
  }

  if (unlockForm) {
    unlockForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      showMessage(unlockStatus, 'Descifrando semilla...', 'info');
      try {
        const { mnemonic } = await unlockWallet(unlockPasswordField.value);
        unlockOutput.value = formatMnemonic(mnemonic);
        showMessage(unlockStatus, 'Semilla descifrada correctamente.', 'success');
      } catch (error) {
        showMessage(unlockStatus, error.message, 'error');
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      await removeWallet();
      createOutput.value = '';
      unlockOutput.value = '';
      showMessage(createStatus, 'Almacenamiento seguro reiniciado.', 'info');
      showMessage(unlockStatus, 'Almacenamiento seguro reiniciado.', 'info');
    });
  }
}
