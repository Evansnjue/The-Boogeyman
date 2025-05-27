export default {
  name: 'dice',
  description: 'Roll a dice',

  async execute(sock, msg, args) {
    const result = Math.floor(Math.random() * 6) + 1;
    await sock.sendMessage(msg.key.remoteJid, { text: `🎲 Dice Roll: ${result}` }, { quoted: msg });
  }
};
