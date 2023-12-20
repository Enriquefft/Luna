import { AWS_REGION } from "../config.js";
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: AWS_REGION,
});
