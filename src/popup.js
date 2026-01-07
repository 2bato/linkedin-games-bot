/**
 * Popup script for LinkedIn Games Bot
 */

document.addEventListener("DOMContentLoaded", () => {
  const gameItems = document.querySelectorAll(".game-item");

  gameItems.forEach((item) => {
    item.addEventListener("click", () => {
      const game = item.dataset.game;
      const gameUrls = {
        tango: "https://www.linkedin.com/games/tango/",
        queens: "https://www.linkedin.com/games/queens/",
        pinpoint: "https://www.linkedin.com/games/pinpoint/",
        crossclimb: "https://www.linkedin.com/games/crossclimb/",
      };

      if (gameUrls[game]) {
        chrome.tabs.create({ url: gameUrls[game] });
      }
    });
  });
});
