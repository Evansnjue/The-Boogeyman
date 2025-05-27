import gTTS from 'google-tts-api';

export default {
  name: 'tts',
  description: 'Convert text to speech. Usage: .tts <text>',

  async execute(sock, msg, args) {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, { text: 'Usage: .tts <text>' }, { quoted: msg });
    }

    const text = args.join(' ');
    try {
      const url = gTTS.getAudioUrl(text, { lang: 'en', slow: false, host: 'https://translate.google.com' });
      await sock.sendMessage(msg.key.remoteJid, { audio: { url }, mimetype: 'audio/mp3' }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Error generating speech' }, { quoted: msg });
    }
  }
};
