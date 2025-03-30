chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getTimestamp") {
      let video = document.querySelector("video");
      if (video) {
        let currentTime = Math.floor(video.currentTime);
        sendResponse({ timestamp: currentTime });
      }
    }
    return true; // Required for async response
  });
  