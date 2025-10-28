chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Games Bot extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ type: 'PONG', timestamp: Date.now() });
  }
});
