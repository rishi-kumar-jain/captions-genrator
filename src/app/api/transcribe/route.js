import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";

function getClient() {
  return new TranscribeClient({
    region: "ap-southeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function createTranscriptionCommand(filename) {
  return new StartTranscriptionJobCommand({
    TranscriptionJobName: filename,
    OutputBucketName: process.env.BUCKET_NAME,
    OutputKey: filename + ".transcription",
    IdentifyLanguage: true,
    Media: {
      MediaFileUri: "s3://" + process.env.BUCKET_NAME + "/" + filename,
    },
  });
}

async function createTranscriptionJob(filename) {
  const transcribeClient = getClient();
  const transcriptionCommand = createTranscriptionCommand(filename);
  return transcribeClient.send(transcriptionCommand);
}

async function getJob(filename) {
  const transcribeClient = getClient();
  let jobStatusResult = null;
  try {
    const transcriptionJobStatusCommand = new GetTranscriptionJobCommand({
      TranscriptionJobName: filename,
    });
    jobStatusResult = await transcribeClient.send(
      transcriptionJobStatusCommand
    );
  } catch (e) {}

  return jobStatusResult;
}

async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    //It creates a Buffer object from the incoming data chunk. Buffers are used to represent binary data in Node.js.
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
}

//get file if already exist
async function getTranscriptionFile(filename) {
  const transcriptionFile = filename + ".transcription";
  const s3client = new S3Client({
    region: "ap-southeast-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: transcriptionFile,
  });

  let transcriptionFileResponse = null;
  try {
    transcriptionFileResponse = await s3client.send(getObjectCommand);
  } catch (e) {}

  if (transcriptionFileResponse) {
    // console.log(transcriptionFileResponse.Body);
    const v = await streamToString(transcriptionFileResponse.Body);
    // console.log(v);
    return JSON.parse(v);
  }
  return null;
}

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.searchParams);
  const filename = searchParams.get("filename");

  //find ready transcription
  const transcription = await getTranscriptionFile(filename);
  if (transcription) {
    console.log("fell into transcription");
    return Response.json({
      status: "COMPLETED",
      transcription,
    });
  }

  const existingJob = await getJob(filename);

  if (existingJob) {
    console.log(
      "fell into exisitingJob" +
        existingJob.TranscriptionJob.TranscriptionJobStatus
    );
    return Response.json({
      status: existingJob.TranscriptionJob.TranscriptionJobStatus,
    });
  }

  //creating new transcription job
  if (!existingJob) {
    const newJob = await createTranscriptionJob(filename);
    console.log(
      "fell into !exisiting" + newJob.TranscriptionJob.TranscriptionJobStatus
    );
    return Response.json({
      status: newJob.TranscriptionJob.TranscriptionJobStatus,
    });
  }

  return Response.json(false);
}
