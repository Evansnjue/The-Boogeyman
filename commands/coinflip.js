export default {
  name: 'coinflip',
  description: 'Flip a coin',

  async execute(sock, msg, args) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await sock.sendMessage(msg.key.remoteJid, { text: `🪙 Coin Flip: ${result}` }, { quoted: msg });
  }
};
