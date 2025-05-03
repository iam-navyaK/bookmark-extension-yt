// popup.js (using module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase Config (check if this is correct in your Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyAo5ObSGTPOznj_njzCA6JcE0GGxFIkruY",
  authDomain: "extension-9f7f8.firebaseapp.com",
  projectId: "extension-9f7f8",
  storageBucket: "extension-9f7f8.appspot.com",
  messagingSenderId: "925964859967",
  appId: "1:925964859967:web:b3275e4c4cf5b4134d568a",
  measurementId: "G-PJFBSHPF3P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM References
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authMessage = document.getElementById("auth-message");
const bookmarkSection = document.getElementById("bookmark-section");

// Authentication Logic
document.getElementById("signup").addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    console.log("Attempting to sign up with:", email); // Debugging line
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User signed up:", userCredential); // Debugging line
    await sendEmailVerification(userCredential.user);
    authMessage.textContent = "Verification email sent. Please verify to use bookmarks.";
    authMessage.style.color = "green";
  } catch (error) {
    console.error("Error during sign up:", error); // Debugging line
    authMessage.textContent = `Error: ${error.message}`;
    authMessage.style.color = "red";
  }
});

document.getElementById("login").addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    console.log("Attempting to log in with:", email); // Debugging line
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential); // Debugging line
    if (userCredential.user.emailVerified) {
      authMessage.textContent = "Login successful!";
      authMessage.style.color = "green";
      bookmarkSection.style.display = "block";
    } else {
      authMessage.textContent = "Please verify your email before using the extension.";
      authMessage.style.color = "red";
      bookmarkSection.style.display = "none";
    }
  } catch (error) {
    console.error("Error during login:", error); // Debugging line
    authMessage.textContent = `Error: ${error.message}`;
    authMessage.style.color = "red";
  }
});

// Auto-check for login state
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    bookmarkSection.style.display = "block";
  } else {
    bookmarkSection.style.display = "none";
  }
});

// Bookmark logic (handles getting timestamp and saving bookmarks)
document.addEventListener("DOMContentLoaded", () => {
  const bookmarkBtn = document.getElementById("bookmark");
  const timestampList = document.getElementById("timestampList");
  const tagsInput = document.getElementById("tags");
  const exportBtn = document.getElementById("export");

  bookmarkBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: getCurrentTimestamp
        },
        (results) => {
          if (results && results[0].result !== null) {
            saveTimestamp(tab.url, results[0].result);
          }
        }
      );
    });
  });

  exportBtn.addEventListener("click", () => {
    chrome.storage.local.get({ timestamps: [] }, (data) => {
      const json = JSON.stringify(data.timestamps, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "youtube_timestamps.json";
      a.click();

      URL.revokeObjectURL(url);
    });
  });

  function getCurrentTimestamp() {
    let video = document.querySelector("video");
    return video ? Math.floor(video.currentTime) : null;
  }

  function getVideoIdFromUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes("youtu.be")) {
        return parsedUrl.pathname.slice(1);
      }
      return parsedUrl.searchParams.get("v");
    } catch (e) {
      return null;
    }
  }

  function saveTimestamp(videoUrl, timestamp) {
    const videoId = getVideoIdFromUrl(videoUrl);
    const tags = tagsInput.value.trim();
    const thumbnailUrl = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : "";

    const timestampEntry = {
      url: `${videoUrl}&t=${timestamp}s`,
      time: timestamp,
      tags,
      thumbnailUrl,
      favorite: false
    };

    chrome.storage.local.get({ timestamps: [] }, (data) => {
      const timestamps = data.timestamps || [];
      timestamps.push(timestampEntry);
      chrome.storage.local.set({ timestamps }, displayTimestamps);
      tagsInput.value = ""; // Clear tags input after save
    });
  }

  function displayTimestamps() {
    chrome.storage.local.get({ timestamps: [] }, (data) => {
      timestampList.innerHTML = "";

      const sorted = [...data.timestamps].sort((a, b) => {
        return (b.favorite === true) - (a.favorite === true);
      });

      sorted.forEach((entry, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
          <img src="${entry.thumbnailUrl}" alt="Thumbnail" width="100" />
          <a href="#" data-url="${entry.url}">Jump to ${entry.time}s</a>
          <span class="tags">${entry.tags}</span>
          <button class="edit" data-index="${index}">Edit</button>
          <button class="delete" data-index="${index}">X</button>
          <button class="fav" data-index="${index}">${entry.favorite ? "★" : "☆"}</button>
        `;

        li.querySelector("a").addEventListener("click", (e) => {
          e.preventDefault();
          chrome.runtime.sendMessage({ action: "openTimestamp", url: entry.url });
        });

        li.querySelector(".edit").addEventListener("click", () => {
          const newTags = prompt("Edit tags:", entry.tags);
          if (newTags !== null) {
            entry.tags = newTags;
            updateTimestamp(index, entry);
          }
        });

        li.querySelector(".delete").addEventListener("click", () => {
          removeTimestamp(index);
        });

        li.querySelector(".fav").addEventListener("click", () => {
          entry.favorite = !entry.favorite;
          updateTimestamp(index, entry);
        });

        timestampList.appendChild(li);
      });
    });
  }

  function updateTimestamp(index, updatedEntry) {
    chrome.storage.local.get({ timestamps: [] }, (data) => {
      const timestamps = data.timestamps;
      timestamps[index] = updatedEntry;
      chrome.storage.local.set({ timestamps }, displayTimestamps);
    });
  }

  function removeTimestamp(index) {
    chrome.storage.local.get({ timestamps: [] }, (data) => {
      const timestamps = data.timestamps;
      timestamps.splice(index, 1);
      chrome.storage.local.set({ timestamps }, displayTimestamps);
    });
  }

  displayTimestamps();
});
