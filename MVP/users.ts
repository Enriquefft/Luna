import { Prompt } from "./config.ts";
// Database imports

const chats = {};
const allowed = [];

function getPrompt(name: string): string {
  return Prompt + "Finalmente, recuerda que estas hablando con " + name + ".";
}

function NumberToId(number: string) {
  return "51" + number + "@c.us";
}

import { dbClient } from "./libs/dynamoDBClient.ts";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

(async () => {
  const response = await dbClient.send(
    new ScanCommand({ TableName: "LunaUsers" }),
  );

  for (const item of response.Items) {
    const id = NumberToId(item.number);
    allowed.push({ name: item.name, id: id });
    chats[id] = [{ role: "system", content: getPrompt(item.name) }];
  }
})();
export { allowed, chats };
