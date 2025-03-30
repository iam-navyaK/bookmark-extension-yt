chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openTimestamp") {
      chrome.tabs.create({ url: message.url });
    }
  });
  