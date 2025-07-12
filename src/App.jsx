import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import toast from "react-hot-toast";
import githubsvg from "./assets/github.svg";
import uploadsvg from "./assets/upload.svg";
import deletesvg from "./assets/delete.svg";
import photosvg from "./assets/photo.svg";
import convert from "./utils/convert";

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [ready, setReady] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [convertedName, setConvertedName] = useState("");
  const ffmpegRef = useRef(new FFmpeg());

  const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "ico", "tif", "raw"];
  const audioFormats = ["wav", "ogg", "aac", "wma", "flac", "m4a"];
  const videoFormats = ["m4v", "mp4", "3gp", "3g2", "avi", "mov", "wmv", "mkv", "flv", "ogv"];

  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current.loaded) {
        try {
          await ffmpegRef.current.load();
          setReady(true);
        } catch (error) {
          console.error("FFmpeg loading failed:", error);
          toast.error("Failed to initialize file converter");
        }
      }
    };
    loadFFmpeg();
    return () => ffmpegRef.current.terminate();
  }, []);

  const getFileCategory = (file) => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("audio/")) return "audio";
    if (type.startsWith("video/")) return "video";
    return "other";
  };

  const handleFileChange = (e) => e.target.files[0] && handleUpload(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.files[0] && handleUpload(e.dataTransfer.files[0]);
  };

  const handleUpload = (file) => {
    const category = getFileCategory(file);
    const formats = category === "audio" ? audioFormats : category === "video" ? videoFormats : imageFormats;
    const ext = file.name.split('.').pop().toLowerCase();
    const outputFormat = formats.find(f => f !== ext) || formats[0];
    setSelectedFiles([{ file, outputFormat }]);
    setConvertedUrl(null);
    setConvertedName("");
    setIsConverting(false);
    toast.success(`${file.name} added for conversion`);
  };

  const fileInputRef = useRef(null);
  const openFileDialog = () => fileInputRef.current?.click();

  const resetConversion = () => {
    setConvertedUrl(null);
    setConvertedName("");
    setSelectedFiles([]);
    toast.success("Conversion reset");
  };

  const handleConvert = async () => {
    if (!selectedFiles.length) return;
    setIsConverting(true);
    setConvertedUrl(null);
    try {
      const { file, outputFormat } = selectedFiles[0];
      const result = await convert(ffmpegRef.current, {
        file,
        to: outputFormat,
        file_name: file.name,
        file_type: file.type,
      });
      setConvertedUrl(result.url);
      setConvertedName(result.output);
      toast.success("File converted successfully");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className={`${isDarkMode ? "bg-black" : "bg-[#fff5eb]"} min-h-screen w-full p-4 sm:p-6`}>
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-wrap justify-between items-center rounded-full mx-auto max-w-7xl px-4 py-3 sm:px-6 gap-4 ${isDarkMode ? "bg-neutral-900" : "bg-white shadow-xl"}`}
      >
        <h1 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
          FlipConvert
        </h1>
        <div className="flex items-center gap-5">
          <a href="https://github.com/ashwindumane" target="_blank" rel="noreferrer">
            <img src={githubsvg} className={`${!isDarkMode && "invert"} w-6 h-6`} alt="GitHub" />
          </a>
          <a href="https://www.linkedin.com/in/ashwindumane/" target="_blank" rel="noreferrer">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" className={`${!isDarkMode && "invert"} w-6 h-6`} alt="LinkedIn" />
          </a>
          <a href="https://www.instagram.com/ashwin_kshatriya_/?hl=en" target="_blank" rel="noreferrer">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" className="w-6 h-6 rounded-md" alt="Instagram" />
          </a>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-11 h-6 rounded-full transition-colors ${isDarkMode ? "bg-neutral-700" : "bg-gray-300"} relative`}>
            <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-0"}`}>
              <span className="text-xs flex justify-center items-center">{isDarkMode ? "☀️" : "🌙"}</span>
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="text-center mt-16 sm:mt-24 max-w-4xl mx-auto px-4 space-y-4">
        <h2 className={`text-3xl sm:text-5xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
          FlipConvert File Converter
        </h2>
        <p className="text-neutral-400 text-base sm:text-lg">
          Quick & easy file conversion for images, audio, and video – all in your browser
        </p>
      </div>

      {/* Upload Section */}
      <div className="mt-12 max-w-xl mx-auto px-4 w-full">
        {selectedFiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={openFileDialog}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed border-gray-400 ${isDarkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-100"} rounded-lg p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center space-y-4`}
          >
            <img src={uploadsvg} className={`${!isDarkMode && "invert"} w-16 h-16`} alt="Upload" />
            <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Drag and drop a file here or <span className="underline">click to browse</span>
            </p>
            <p className={`${isDarkMode ? "text-white" : "text-black"}`}>
              Supported: Images, Audio, Video
            </p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,audio/*,video/*" />
          </motion.div>
        ) : (
          <div className={`rounded-xl p-6 sm:p-8 w-full border ${isDarkMode ? "text-white border-neutral-700" : "text-black border-gray-300"}`}>
            {/* File Card */}
            <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 rounded-lg p-4 sm:p-5 ${isDarkMode ? "bg-neutral-800" : "bg-white shadow"}`}>
              <div className="flex items-center gap-4">
                <img src={photosvg} className="w-10 h-10" alt="File Icon" />
                <div>
                  <p>{selectedFiles[0].file.name}</p>
                  <p className="text-neutral-400 text-sm">{formatFileSize(selectedFiles[0].file.size)}</p>
                </div>
              </div>
              <img src={deletesvg} onClick={resetConversion} className="w-6 h-6 cursor-pointer hover:opacity-80" alt="Delete" />
            </div>

            {/* Format Dropdown & Actions */}
            <div className="flex flex-col gap-4 mt-6">
              <select
                value={selectedFiles[0].outputFormat}
                onChange={(e) => setSelectedFiles([{ ...selectedFiles[0], outputFormat: e.target.value }])}
                className={`p-2 rounded-lg border ${isDarkMode ? "bg-black text-white border-neutral-700" : "bg-[#fffbf7] text-black border-gray-300"}`}
              >
                {(getFileCategory(selectedFiles[0].file) === "audio" ? audioFormats :
                  getFileCategory(selectedFiles[0].file) === "video" ? videoFormats : imageFormats)
                  .map((format) => (
                    <option key={format} value={format}>Convert to {format.toUpperCase()}</option>
                  ))}
              </select>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <button onClick={resetConversion} className="border border-neutral-700 px-4 py-2 rounded-xl">
                  Reset
                </button>

                {convertedUrl ? (
                  <a
                    href={convertedUrl}
                    download={convertedName}
                    onClick={() => {
                      toast.success("Download started");
                      setTimeout(resetConversion, 100);
                    }}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 justify-center w-full sm:w-auto ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/80"}`}
                  >
                    <img src={uploadsvg} className={`${isDarkMode ? "invert" : ""} w-4 h-4`} alt="Download" />
                    Download
                  </a>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={isConverting || !ready}
                    className={`px-5 py-2 rounded-xl w-full sm:w-auto transition disabled:opacity-50 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/80"}`}
                  >
                    {isConverting ? "Converting..." : "Convert"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center text-[10px] text-gray-400 py-16">
      Designed & Developed By Ashwin Dumane
      </footer>
    </div>
  );
};

export default App;
