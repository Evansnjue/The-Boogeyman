import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export default {
  name: 'sticker',
  description: 'Create sticker from image or short video. Send media with caption .sticker',

  async execute(sock, msg, args) {
    try {
      const mediaMessage = msg.message.imageMessage || msg.message.videoMessage;
      if (!mediaMessage) {
        return sock.sendMessage(msg.key.remoteJid, { text: 'Please send an image or short video with the caption .sticker' }, { quoted: msg });
      }

      const buffer = await sock.downloadMediaMessage(msg);
      const tempFile = `./tmp/${msg.key.id}.webp`;
      if (!buffer) throw new Error('Failed to download media');

      // Save buffer to a temp file
      writeFileSync(tempFile, buffer);

      // Send as sticker
      await sock.sendMessage(msg.key.remoteJid, { sticker: { url: tempFile } }, { quoted: msg });

      // Delete temp file
      unlinkSync(tempFile);
    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to create sticker' }, { quoted: msg });
    }
  }
};
