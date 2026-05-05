const fs = require("fs");
const ytdl = require("ytdl-core");

const videoUrl = "https://youtu.be/JDY8XkebaeA";
const outputFilePath = "public/hero.mp4";

console.log("Starting download...");

ytdl(videoUrl, { filter: (format) => format.container === "mp4" })
  .pipe(fs.createWriteStream(outputFilePath))
  .on("finish", () => {
    console.log("Download completed successfully.");
  })
  .on("error", (err) => {
    console.error("Download failed:", err);
  });
