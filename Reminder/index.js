// AI model
import { openai } from "./libs/openaiClient.mjs";

// Bucket for login
import { s3Client } from "./libs/S3Client.mjs";

// whatsapp web client
import { whatsappClient } from "./libs/whatsappClient.mjs";

import { CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// qr
// const qrcode = require("qrcode");
import qrcode from "qrcode";
// const fs = require("fs-extra");
import fs from "fs-extra";

whatsappClient.on("qr", async (qr) => {
  await qrcode.toFile("./qrCode.png", qr, async (qrcode) => {
    const qrImageFile = fs.createReadStream("./qrCode.png");

    const command = new PutObjectCommand({
      Bucket: "luna-mvp-login",
      Key: "qr.png",
      Body: qrImageFile,
    });

    try {
      const response = await s3Client.send(command);
      console.log(response);
    } catch (err) {
      console.error(err);
    }
  });
});

function NumberToId(number) {
  return "51" + number + "@c.us";
}

function getPrompt(event, description, start, end, user) {
  // Send the message
  return `Eres Lun, una entrenadora academica amigable, Debes enviarle un recordatorio a ${user} acerca del evento proximo ${event}, ${description}. Este inicia a las ${start} y termina a las ${end}. \n\nNombreEvento: ${event}\nDescripcion: ${description}\nInicio: ${start}\nFin: ${end}\nUsuario: ${user}\n\n`;
}

async function run(event) {
  console.log("Bot is running...");
  console.log(event);

  const eventName = "Estudiar v:";
  const description = "Mañana martes";
  const start = "5:00 PM";
  const end = "8:00 PM";
  const user = "Jamo";
  const number = NumberToId("969423746");

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: getPrompt(eventName, description, start, end, user),
      },
    ],
  });
  const response_msg = response.data.choices[0].message.content;

  let http_response;

  if (!response_msg) {
    http_response = {
      statusCode: 500,
      body: JSON.stringify("No response"),
    };
  } else {
    http_response = {
      statusCode: 200,
      body: JSON.stringify(response_msg),
    };
  }

  whatsappClient.sendMessage(number, response_msg);
  return http_response;
}

export const handler = async (event) => {
  await whatsappClient.initialize();
  return run(event);
};

handler(3);

whatsappClient.on("ready", () => {
  console.log("Whatsapp client is ready");
});

whatsappClient.on("authenticated", () => {
  console.log("AUTHENTICATED");
});
