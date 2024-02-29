"use client";

import axios from "axios";
import UploadButton from "./UploadButton";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  async function upload(ev) {
    ev.preventDefault();
    // console.log(ev);
    const files = ev.target?.files; //handling empty vlaues
    if (files.length > 0) {
      const file = files[0];
      // console.log(file);
      setIsUploading(true);
      const res = await axios.postForm("/api/upload", {
        file,
      });
      setIsUploading(false);
      // console.log(res.data);
      const newName = res.data.newName;
      console.log("nazr---------->" + newName);
      router.push('/'+ newName);//redirect ot lhost/htt//newName
    }
  }

  return (
    <>
      {isUploading && (
        <div className="bg-black/90 text-white fixed inset-0 flex items-center">
          <div className="w-full text-center"><h2 className="text-4xl mb-4">Uploading...</h2><h3 className="text-xl">Please wait</h3></div>
        </div>
      )}
      <label className="bg-green-600 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer">
        <UploadButton />
        <span>Choose File</span>
        <input onChange={upload} type="file" className="hidden" />
      </label>
    </>
  );
}
