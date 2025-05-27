export default {
  name: 'toimg',
  description: 'Convert a sticker to image. Reply to a sticker with .toimg',

  async execute(sock, msg, args) {
    try {
      if (!msg.message.stickerMessage) {
        return sock.sendMessage(msg.key.remoteJid, { text: 'Please reply to a sticker with .toimg' }, { quoted: msg });
      }
      const buffer = await sock.downloadMediaMessage(msg);
      await sock.sendMessage(msg.key.remoteJid, { image: buffer }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Failed to convert sticker to image' }, { quoted: msg });
    }
  }
};
