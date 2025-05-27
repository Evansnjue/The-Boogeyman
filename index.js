// index.js - Main entry for The Boogie Man WhatsApp Bot

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import { handleIncomingMessage } from "./handlers/messageHandler.js";

const logger = pino({ level: "silent" });
const SESSION_FOLDER = "./session";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    patchMessageBeforeSending: (msg) => {
      const requiresPatch = !!(
        msg.buttonsMessage ||
        msg.listMessage ||
        msg.templateMessage
      );
      if (requiresPatch) {
        msg = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {},
              ...msg,
            },
          },
        };
      }
      return msg;
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    await handleIncomingMessage(sock, msg);
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : 0) !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Reconnecting...");
        startBot();
      } else {
        console.log("Connection closed. You are logged out.");
      }
    } else if (connection === "open") {
      console.log("✅ The Boogie Man bot is online.");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();
