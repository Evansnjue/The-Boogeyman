export default {
  name: 'fakecall',
  description: 'Simulate a fake call',

  async execute(sock, msg, args) {
    await sock.sendMessage(msg.key.remoteJid, { text: '📞 Ring Ring... Incoming fake call! 😄' }, { quoted: msg });
  }
};
