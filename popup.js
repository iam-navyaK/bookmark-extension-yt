document.addEventListener("DOMContentLoaded", () => {
    const bookmarkBtn = document.getElementById("bookmark");
    const timestampList = document.getElementById("timestampList");
  
    bookmarkBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            function: getCurrentTimestamp
          },
          (results) => {
            if (results && results[0].result) {
              saveTimestamp(tab.url, results[0].result);
            }
          }
        );
      });
    });
  
    function getCurrentTimestamp() {
      let video = document.querySelector("video");
      return video ? Math.floor(video.currentTime) : null;
    }
  
    function saveTimestamp(videoUrl, timestamp) {
      let timestampEntry = { url: `${videoUrl}&t=${timestamp}s`, time: timestamp };
  
      chrome.storage.local.get({ timestamps: [] }, (data) => {
        let timestamps = data.timestamps;
        timestamps.push(timestampEntry);
        chrome.storage.local.set({ timestamps: timestamps }, displayTimestamps);
      });
    }
  
    function displayTimestamps() {
      chrome.storage.local.get({ timestamps: [] }, (data) => {
        timestampList.innerHTML = "";
        data.timestamps.forEach((entry, index) => {
          let li = document.createElement("li");
          li.innerHTML = `<a href="#" data-url="${entry.url}">Jump to ${entry.time}s</a> <button data-index="${index}">X</button>`;
          
          li.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            chrome.runtime.sendMessage({ action: "openTimestamp", url: entry.url });
          });
  
          li.querySelector("button").addEventListener("click", (e) => {
            removeTimestamp(index);
          });
  
          timestampList.appendChild(li);
        });
      });
    }
  
    function removeTimestamp(index) {
      chrome.storage.local.get({ timestamps: [] }, (data) => {
        let timestamps = data.timestamps;
        timestamps.splice(index, 1);
        chrome.storage.local.set({ timestamps: timestamps }, displayTimestamps);
      });
    }
  
    displayTimestamps();
  });
  