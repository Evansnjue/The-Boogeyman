import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

export default {
  name: 'bass',
  description: 'Apply bass boost to audio. Send audio with caption .bass',

  async execute(sock, msg, args) {
    try {
      if (!msg.message.audioMessage && !msg.message.documentMessage) {
        return sock.sendMessage(msg.key.remoteJid, { text: 'Please send an audio file with caption .bass' }, { quoted: msg });
      }

      const buffer = await sock.downloadMediaMessage(msg);
      if (!buffer) throw new Error('Failed to download audio');

      const inputFile = `./tmp/${msg.key.id}.mp3`;
      const outputFile = `./tmp/${msg.key.id}_bass.mp3`;
      fs.writeFileSync(inputFile, buffer);

      await new Promise((resolve, reject) => {
        ffmpeg(inputFile)
          .audioFilters('bass=g=10')
          .save(outputFile)
          .on('end', resolve)
          .on('error', reject);
      });

      const outputBuffer = fs.readFileSync(outputFile);
      await sock.sendMessage(msg.key.remoteJid, { audio: outputBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });

      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);
    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to apply bass boost' }, { quoted: msg });
    }
  }
};
