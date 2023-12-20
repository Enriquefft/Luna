// import { Client, LocalAuth } from "whatsapp-web.js";
import whatsapp_web from "whatsapp-web.js";
const { Client, LocalAuth } = whatsapp_web;

export const whatsappClient = new Client({
  webVersionCache: {
    type: "local",
    path: "./Credentials/.wwebjs_cache/",
  },
  authStrategy: new LocalAuth({
    dataPath: "./Credentials/.wwebjs_auth/",
  }),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  },
});
