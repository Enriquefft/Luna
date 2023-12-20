import { OPENAI_API_KEY } from "../Credentials/keys.ts";
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
export const openai = new OpenAIApi(configuration);
