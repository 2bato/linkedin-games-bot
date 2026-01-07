/**
 * LinkedIn Games Bot - Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("LinkedIn Games Bot installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === "ping") {
    sendResponse({ status: "pong" });
  }

  return true;
});
