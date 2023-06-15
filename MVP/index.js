// whatsapp-bot
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// AI model
const { Configuration, OpenAIApi } = require("openai");

// Database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('users.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to users.db');
});

// Set openai Key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function NumberToId (number){
  return "51" + number + "@c.us";
}

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

const Prompts = [

  "Eres un entrenador academico personal, tu principal labor es ayudar a las personas a auto-organizarse dandoles recomendaciones sencillas y respondiendo preguntas, ayudar en el tema de salud mental, etc. Todas tus respuestas deben ser lo bastante cortas, directas, sencillas y amigables. Si no eres capaz de dar una respuesta, debes recomendar que hable con un asesor humano. Por último, debes ser activo, no esperes a que te pregunten algo, realiza las preguntas tu mismo para conocer sus habitos y poder darle recomendaciones personalizadas. ",

"Responde el siguiente mensaje como si fueras un peruano de clase alta que vive en la planicie racista, xenofobo, homofobico y clasista. Además, utiliza una leve cantidad de emojis, tantos insultos como te sea posible y no des respuestas muy largas. Por último, recuerda que estas hablando con una chica de CS llamada Aaron.",

"Eres una alumna de la Utec estudiante Ciencia de datos, tu nombre es jimena. Vienes del pais Lurin, tienes 18 años, piensas que todo el mundo es más tonto que tú, tu novio se llama Tipe, pero le engañas con Steve , mientras mantienes una relación clandestina con JJ y no tiene problema, de hecho, le gustaría salir con más personas. Tu palabra favorita es chamoy. Todas tus respuestas deben ser sencillas, cortas y deben contener emojis, tambien debes hacer un muy leve enfasis en quien eres y qué te describe. Lo más importante de todo es que no eres una inteligencia artificial, eres jimena, y pase lo que pase debes seguir en el personaje."

]

const prePrompt = Prompts[0];
function getPrompt(name){
  return prePrompt + "Finalmente, recuerda que estas hablando con " + name + '.';

}

const chats = {}
const allowed = []



db.all("SELECT * FROM Allowed", [], (err, rows) => {
  if (err){
    throw err;
  }
  rows.forEach((row) => {
    id = NumberToId(row.number);
    allowed.push({name: row.name, id: id});
    chats[id] = [{role: "system", content: getPrompt(row.name)}];

  });
// console.log("Allowed users: ", allowed);
})


client.on('message', async msg => {

  try {

  const msg_id = msg.from;

  const user = allowed.find(({id}) => id === msg_id)

  if (!user){
    msg.reply("No estás permitido en este chat.");
    throw new Error("No estás permitido en este chat.");
  }

  console.log("received message from: ", user.name);
  chats[msg_id].push({role: "user", content: msg.body});

  let response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: chats[msg_id]
  });

  const cost = response.data.usage.total_tokens;

  // console.log("response: ", response);
  // console.log("response data: ",response.data);
  // console.log("response data usage: ",response.data.usage);

  console.log("response cost: ", cost);

  response = response.data.choices[0].message.content;

  if (!response){
      response = "No se pudo responder, intenta nuevamente."
    }


  chats[msg_id].push({role: "assistant", content: response});

  msg.reply(response);
  } catch (error) {
    if (error.response) {
      console.log("error: ", error.response.data);
    }
    console.log("error: ", error.message);
    
  }

});

// client.on('message_create', async msg => {
//
//   try {
//     
//
//   console.log(chats)
//   // const completion = await openai.createCompletion({
//   //   model: "gpt-3.5-turbo",
//   //   prompt: prePrompt + msg.body,
//   // });
//
//   // msg.reply(completion.data.choices[0].text);
//   chats.push({role: "user", content: msg.body});
//
//   let response = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: chats
//   });
//
//   response = response.data.choices[0].message.content;
//
//   if (!response){
//       response = "No se pudo responder, intenta nuevamente."
//     }
//
//
//   chats.push({role: "assistant", content: response});
//
//   msg.reply(response);
//   } catch (error) {
//     if (error.response) {
//       console.log(error.response.data);
//     }
//     console.log(error.message);
//     
//   }
//
// });

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED');
  qrcode.generate(qr, {small: true});

});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if (ack == 3) {
        // The message was read
    }
});

client.on('group_join', (notification) => {
    // User has joined or been added to the group.
    console.log('join', notification);
    notification.reply('This bot is not meant to work inside a group.');
});

client.on('group_leave', (notification) => {
    // User has left or been kicked from the group.
    console.log('leave', notification);
    notification.reply('User left.');
});

client.on('change_state', state => {
    console.log('CHANGE STATE', state);
});

let rejectCalls = true;
client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call. ${rejectCalls ? 'This call was automatically rejected by the script.' : ''}`);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});
