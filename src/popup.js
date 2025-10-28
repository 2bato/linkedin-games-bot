const pingButton = document.getElementById('ping');
const responseEl = document.getElementById('response');

pingButton?.addEventListener('click', async () => {
  responseEl.textContent = 'Pinging…';
  try {
    const response = await chrome.runtime.sendMessage({ type: 'PING' });
    responseEl.textContent = `Background replied at ${new Date(response.timestamp).toLocaleTimeString()}`;
  } catch (error) {
    console.error(error);
    responseEl.textContent = 'Ping failed. Check the extension logs.';
  }
});
