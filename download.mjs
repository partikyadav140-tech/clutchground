import ytdl from "@distube/ytdl-core";
import fs from "fs";

const videoId = "IGEc06Eypkg";
const url = `https://www.youtube.com/watch?v=${videoId}`;
const output = "public/free-fire-hero.mp4";

console.log("Downloading video...");

ytdl(url, { filter: "videoonly", quality: "highestvideo" })
  .pipe(fs.createWriteStream(output))
  .on("finish", () => {
    console.log("Video downloaded successfully.");
  })
  .on("error", (err) => {
    console.error("Error downloading video:", err);
  });
