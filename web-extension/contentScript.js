(function injectProvider() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.type = 'text/javascript';
  script.async = false;
  script.onload = () => script.remove();
  (document.head || document.documentElement).prepend(script);
})();

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'codexwallet:page') {
    return;
  }

  if (event.data.type === 'REQUEST') {
    const { id, payload } = event.data;
    chrome.runtime.sendMessage(
      {
        channel: 'codexwallet:provider',
        id,
        payload,
        tab: { id: event?.source?.tab?.id },
      },
      (response) => {
        window.postMessage(
          {
            source: 'codexwallet:content',
            type: 'RESPONSE',
            id,
            payload: response,
          },
          '*'
        );
      }
    );
  }
});
