import { useSingleFileAuthState } from '@whiskeysockets/baileys';
import fs from 'fs';

const SESSION_FILE_PATH = './session.json';

// Load or create session
export const { state, saveState } = useSingleFileAuthState(SESSION_FILE_PATH);

// Optional: Watch for session changes and save automatically
fs.watchFile(SESSION_FILE_PATH, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('Session file updated.');
  }
});
