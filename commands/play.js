import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default {
  name: 'play',
  description: 'Download and send YouTube audio or video. Usage: .play <query or url>',

  async execute(sock, msg, args) {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, { text: 'Usage: .play <query or YouTube URL>' }, { quoted: msg });
    }

    const searchOrUrl = args.join(' ');

    // Prepare output file path
    const id = msg.key.id || Date.now();
    const outputAudio = path.resolve(`./tmp/${id}.mp3`);
    const outputVideo = path.resolve(`./tmp/${id}.mp4`);

    // Clean up tmp folder
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    try {
      // Download audio only using yt-dlp
      await new Promise((resolve, reject) => {
        exec(`yt-dlp -x --audio-format mp3 -o "${outputAudio}" "${searchOrUrl}"`, (error, stdout, stderr) => {
          if (error) reject(stderr || error);
          else resolve(stdout);
        });
      });

      // Send audio file back
      const buffer = fs.readFileSync(outputAudio);
      await sock.sendMessage(msg.key.remoteJid, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: msg });

      // Cleanup
      fs.unlinkSync(outputAudio);

    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Failed to download: ${error}` }, { quoted: msg });
    }
  }
};
