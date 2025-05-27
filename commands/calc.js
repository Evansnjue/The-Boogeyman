export default {
  name: 'calc',
  description: 'Calculate math expression. Usage: .calc 5+5*2',

  async execute(sock, msg, args) {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: 'Usage: .calc <expression>' }, { quoted: msg });
    try {
      // Sanitize expression to avoid code injection
      const expr = args.join(' ').replace(/[^-()\d/*+.]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      await sock.sendMessage(msg.key.remoteJid, { text: `Result: ${result}` }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Invalid expression' }, { quoted: msg });
    }
  }
};
