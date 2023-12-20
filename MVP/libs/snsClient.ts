import { AWS_REGION } from "../config.ts";
import { SNSClient } from "@aws-sdk/client-sns";

// Create SNS service object.
export const snsClient = new SNSClient({ region: AWS_REGION });
