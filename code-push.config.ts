import {
  CliConfigInterface,
  ReleaseHistoryInterface,
} from "@bravemobile/react-native-code-push";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const BUCKET = process.env.CODE_PUSH_S3_BUCKET!;
const REGION = process.env.AWS_REGION!;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

async function streamToString(
  stream: NodeJS.ReadableStream | undefined,
): Promise<string> {
  if (!stream) throw new Error("Empty response body");
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

const Config: CliConfigInterface = {
  bundleUploader: async (
    source: string,
    platform: "ios" | "android",
    identifier?: string,
  ): Promise<{ downloadUrl: string }> => {
    const id = identifier ?? "production";
    const fileName = path.basename(source);
    const key = `bundles/${platform}/${id}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fs.readFileSync(source),
        ContentType: "application/zip",
      }),
    );

    console.log(`Bundle uploaded: ${key}`);
    return { downloadUrl: getPublicUrl(key) };
  },

  getReleaseHistory: async (
    targetBinaryVersion: string,
    platform: "ios" | "android",
    identifier?: string,
  ): Promise<ReleaseHistoryInterface> => {
    const id = identifier ?? "production";
    const key = `histories/${platform}/${id}/${targetBinaryVersion}.json`;

    try {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      );
      const body = await streamToString(
        response.Body as NodeJS.ReadableStream,
      );
      return JSON.parse(body);
    } catch (error: any) {
      if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
        throw new Error(
          `Release history not found for ${platform}/${identifier}/${targetBinaryVersion}. ` +
            `Run "npx code-push create-history" first.`,
        );
      }
      throw error;
    }
  },

  setReleaseHistory: async (
    targetBinaryVersion: string,
    jsonFilePath: string,
    _releaseInfo: ReleaseHistoryInterface,
    platform: "ios" | "android",
    identifier?: string,
  ): Promise<void> => {
    const id = identifier ?? "production";
    const key = `histories/${platform}/${id}/${targetBinaryVersion}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fs.readFileSync(jsonFilePath, "utf-8"),
        ContentType: "application/json",
      }),
    );

    console.log(`Release history uploaded: ${key}`);
  },
};

module.exports = Config;
