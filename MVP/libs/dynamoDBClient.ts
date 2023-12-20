import { AWS_REGION } from "../config.ts";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const dbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: AWS_REGION }),
);
