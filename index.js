// whatsapp-bot
const { Client, Location, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// AI model
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

const Prompts = [
"Responde el siguiente mensaje como si fueras un niño peruano racista, xenofobo, homofobico y clasista. Si no puedes dar una respuesta satisfactoria, responde 'no se'.",
"Responde el siguiente mensaje como si fueras un alumno universitario peruano de la universidad Utec que estudia Ciencias de la computación. Si no puedes dar una respuesta satisfactoria, responde 'no se'.",
"Eres una alumna de la Utec estudiante Ciencia de datos, tu nombre es jimena. Vienes del pais Lurin, tienes 18 años, piensas que todo el mundo es más tonto que tú, tu novio se llama Tipe, pero le engañas con Steve, tu palabra favorita es chamoy. Todas tus respuestas deben ser sencillas, cortas y deben contener emojis, tambien debes hacer un muy leve enfasis en quien eres y qué te describe."
]
const prePrompt = Prompts[2];

const chats = []

chats.push({role: "system", content: prePrompt});





client.on('message', async msg => {
  // try{
  //
  // chats.push({role: "user", content: msg.body});
  //
  // let response = await openai.createChatCompletion({
  //   model: "gpt-3.5-turbo",
  //   messages: chats
  // });
  //
  // response = response.data.choices[0].text;
  // chats.push({role: "assistant", content: response});
  //
  // msg.reply();
  // } catch (error) {
  //   if (error.response) {
  //     console.log(error.response.data);
  //   }
  //   console.log(error.message);
  //   
  // }

});

client.on('message_create', async msg => {

  try {
    

  console.log(chats)
  // const completion = await openai.createCompletion({
  //   model: "gpt-3.5-turbo",
  //   prompt: prePrompt + msg.body,
  // });

  // msg.reply(completion.data.choices[0].text);
  chats.push({role: "user", content: msg.body});

  let response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: chats
  });

  response = response.data.choices[0].message.content;

  if (!response){
      response = "No se pudo responder, intenta nuevamente."
    }


  chats.push({role: "assistant", content: response});

  msg.reply(response);
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
    }
    console.log(error.message);
    
  }

});

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
