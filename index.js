import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useSingleFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';

// Load session from file or create new
const { state, saveState } = useSingleFileAuthState('./session.json');

// Load commands from /commands folder
const commands = new Map();
const commandsPath = path.join('./commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (file.endsWith('.js')) {
    const command = (await import(path.join(commandsPath, file))).default;
    commands.set(command.name, command);
  }
}

async function startBot() {
  try {
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      // logger: P({ level: 'info' }), // Uncomment for debug logs
    });

    // Save auth state on credentials update
    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        if (statusCode !== DisconnectReason.loggedOut) {
          console.log('Connection closed unexpectedly, reconnecting...');
          startBot();
        } else {
          console.log('Logged out. Delete session.json to re-authenticate.');
          process.exit(0);
        }
      } else if (connection === 'open') {
        console.log('✅ Connected to WhatsApp!');
      }
    });

    // Anti delete: detect deleted messages and notify
    sock.ev.on('message.delete', async (msg) => {
      try {
        if (!msg.key.fromMe && msg.message) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ Someone deleted a message:\n\n${JSON.stringify(msg.message)}`,
          });
        }
      } catch (e) {
        console.error('Error in anti-delete:', e);
      }
    });

    // Anti view once (can be handled by intercepting message type 'viewOnceMessage')
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      const msg = messages[0];
      if (!msg.message) return;

      // Check if message is view once
      if (msg.message.viewOnceMessage) {
        try {
          // Extract the actual message inside viewOnceMessage and resend it
          const innerMsg = msg.message.viewOnceMessage.message;
          await sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ Someone sent a view-once message, here is the content:`,
          });
          await sock.sendMessage(msg.key.remoteJid, innerMsg, { quoted: msg });
        } catch (e) {
          console.error('Error handling view once message:', e);
        }
      }
    });

    // Message handler for commands
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      let text = '';

      // Support for different message types
      if (msg.message.conversation) text = msg.message.conversation;
      else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
      else return;

      if (!text.startsWith('.')) return;

      const args = text.slice(1).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!commands.has(commandName)) {
        await sock.sendMessage(msg.key.remoteJid, { text: `Unknown command: ${commandName}` }, { quoted: msg });
        return;
      }

      try {
        await commands.get(commandName).execute(sock, msg, args);
      } catch (err) {
        console.error('Command execution error:', err);
        await sock.sendMessage(msg.key.remoteJid, { text: 'Error executing that command.' }, { quoted: msg });
      }
    });

  } catch (error) {
    console.error('Bot crashed:', error);
    setTimeout(startBot, 5000); // retry after 5 seconds
  }
}

startBot();
