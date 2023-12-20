// App config

import { MaxMessages, Prompt } from "./config.ts";
import { SNS_ARN } from "./Credentials/keys.ts";

import { snsClient } from "./libs/snsClient.ts";
import { PublishCommand } from "@aws-sdk/client-sns";

// AI model
import { openai } from "./libs/openaiClient.ts";

// whatsapp web client
import { whatsappClient } from "./libs/whatsappClient.ts";

// Database data
import { allowed, chats } from "./users.ts";

import { dbClient } from "./libs/dynamoDBClient.ts";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const qrcode = require("qrcode-terminal");

whatsappClient.initialize();

whatsappClient.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

whatsappClient.on("message", async (msg) => {
  try {
    const msg_id = msg.from;

    let user = allowed.find(({ id }) => id === msg_id);
    if (!user) {
      user = {
        name: "Desconocido",
        id: msg_id,
      };
      chats[msg_id] = [{ role: "system", content: Prompt }];
      // msg.reply("No estás permitido en este chat.");
      // throw new Error(`El número ${msg.from} intento contactar con el bot.`);
    }

    // Remove 2nd and 3rd elements
    if (chats[msg_id].length > MaxMessages) {
      chats[msg_id].splice(2, 2);
    }
    // Add message to local chat
    chats[msg_id].push({ role: "user", content: msg.body });

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: chats[msg_id],
    });
    const response_msg = response.data.choices[0].message.content;

    if (!response_msg) {
      msg.reply(
        "No se pudo obtener una respuesta del bot, por favor, contacte con el administrador.",
      );
      throw new Error("No se pudo obtener una respuesta del bot.");
    }

    chats[msg_id].push({ role: "assistant", content: response_msg });
    msg.reply(response_msg);

    const command = new PutCommand({
      TableName: "LunaChats",
      Item: {
        nombre: user.name,
        msg: {
          query: msg.body,
          response: response_msg,
        },
      },
    });
    dbClient.send(command);
  } catch (error) {
    snsClient.send(
      new PublishCommand({
        Message: error.message,
        TopicArn: SNS_ARN,
      }),
    );
  }
});

whatsappClient.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});

whatsappClient.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

whatsappClient.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
  snsClient.send(
    new PublishCommand({
      Message: "Authenntication failure (whatsapp): " + msg,
      TopicArn: SNS_ARN,
    }),
  );
});

whatsappClient.on("ready", () => {
  console.log("READY");
});

whatsappClient.on("message_ack", (msg, ack) => {
  /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

  // Resend message on any kind of failure
  if (ack == -1) {
    whatsappClient.sendMessage(msg.from, msg.body);
    snsClient.send(
      new PublishCommand({
        Message: `Message failure with: ${msg.from}`,
        TopicArn: SNS_ARN,
      }),
    );
  }
});

whatsappClient.on("group_join", (notification) => {
  console.log("joined group: ", notification);
  notification.reply("This bot is not meant to work inside a group.");
});

whatsappClient.on("group_leave", (notification) => {
  console.log("left group: ", notification);
});

whatsappClient.on("call", async (call) => {
  console.log("Call received, rejecting.", call);
  await call.reject();
});

whatsappClient.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
  snsClient.send(
    new PublishCommand({
      Message: "Bot has been turned off",
      TopicArn: SNS_ARN,
    }),
  );
});
