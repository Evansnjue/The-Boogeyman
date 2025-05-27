import fs from 'fs';
import path from 'path';

const commands = new Map();

// Load all commands from commands folder dynamically
const commandsPath = path.resolve('./commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (file.endsWith('.js')) {
    const cmd = await import(path.join(commandsPath, file));
    if (cmd.default && cmd.default.name) {
      commands.set(cmd.default.name, cmd.default);
    }
  }
}

export async function handleIncomingMessage(sock, msg) {
  try {
    const messageType = Object.keys(msg.message)[0];
    if (!messageType) return;

    // Extract text message or caption (for media)
    let text = '';
    if (messageType === 'conversation') {
      text = msg.message.conversation || '';
    } else if (msg.message[messageType].caption) {
      text = msg.message[messageType].caption || '';
    } else if (msg.message[messageType].text) {
      text = msg.message[messageType].text || '';
    }

    if (!text.startsWith('.')) return;

    // Extract command and arguments
    const args = text.trim().slice(1).split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (!commands.has(commandName)) return;

    const command = commands.get(commandName);
    await command.execute(sock, msg, args);
  } catch (error) {
    console.error('Error in messageHandler:', error);
  }
}
