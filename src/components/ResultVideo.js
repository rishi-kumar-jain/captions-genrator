import { useState, useEffect, useRef } from "react";
import SparklesIcon from "./SparklesIcon";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { transcriptionItemsToSrt } from "@/libs/awsTranscriptionHelpers";
import robotoBold from "../fonts/Roboto-Bold.ttf";
import roboto from "../fonts/Roboto-Regular.ttf";


// import { fetchFile, toBlobURL } from '@ffmpeg/util';

/////hmesha params {} ke andar pass kro
export default function ResultVideo({ filename, transcriptionItems }) {
  const videoUrl = "https://rishi-capti-sync.s3.amazonaws.com/" + filename;
  const [loaded, setLoaded] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#FFFFFF');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [progress, setProgress] = useState(1);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    videoRef.current.src = videoUrl;
    load();
  }, []);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;

    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    await ffmpeg.writeFile("/tmp/roboto.ttf", await fetchFile(roboto));
    await ffmpeg.writeFile("/tmp/roboto-bold.ttf", await fetchFile(robotoBold));
    setLoaded(true);
  };




  function toFFmpegColor(rgb){
    // rgb = 1f55c2 -> c2551f
    const bgr = rgb.slice(5, 7) + rgb.slice(3,5) + rgb.slice(1,3);
    console.log({rgb, bgr}); 
    return '&H' + bgr + '&';
  }

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    const srt = transcriptionItemsToSrt(transcriptionItems);
    await ffmpeg.writeFile(filename, await fetchFile(videoUrl));
    await ffmpeg.writeFile("subs.srt", srt);
    videoRef.current.src = videoUrl;
    await new Promise((resolve, reject) => {
      videoRef.current.onloadedmetadata = resolve;

    });
    const duration = videoRef.current.duration;
    




    ffmpeg.on("log", ({ message }) => {
      const regexResult = /time=([0-9:.]+)/.exec(message);
      // console.log(regexResult);
      if(regexResult && regexResult?.[1]){
        const howMuchIsDone = regexResult?.[1];
        // console.log({howMuchIsDone});
        const [hours,minutes,seconds] = howMuchIsDone.split(':');
        // console.log({hours,minutes,seconds});
        const doneTotalSeconds = hours*3600 + minutes*60 + seconds;
        const videoProgress = doneTotalSeconds/duration;
        // console.log(porgress);
        setProgress(videoProgress); 
       
      }
    });

    await ffmpeg.exec([
      "-i",
      filename,
      "-preset",
      "ultrafast",
      "-to",
      "00:00:05",
      "-vf",
      `subtitles=subs.srt:fontsdir=/tmp:force_style='Fontname=Roboto Bold,FontSize=30,MarginV=100,
        PrimaryColour=${toFFmpegColor(primaryColor)},OutlineColour=${toFFmpegColor(outlineColor)}`,
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    videoRef.current.src = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" })
    );
    setProgress(1);
  };

  return (
    <>
      <div className="mb-4">
        <button
          onClick={transcode}
          className="bg-green-600 py-2 px-2 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer"
        >
          <SparklesIcon />

          <span>Apply Captions</span>
        </button>
      </div>

      <div>
        
        primary color:
        <input type="color" value={primaryColor}  onChange={ev=>setPrimaryColor(ev.target.value)}/>
        <br />
        outline color:
        <input type="color" value={outlineColor}  onChange={ev=>setOutlineColor(ev.target.value)}/>
      </div>

      <div className="rounded-xl overflow-hidden relative">
        {progress && progress < 1 && (
          <div className="absolute inset-0 bg-black/80 flex items-center">
            <h3 className="text-white text-3xl w-full text-center">{parseInt(progress * 100)}%</h3>
            
          </div>
        )}
        <video data-video={0} ref={videoRef} controls></video>
      </div>

    </>
  );
}
