
interface ColumnData {
  name: string;
  tldr: string;
  description: string;
  commonValues: string[];
  examples: string[];
  tips: string[];
}

const formatColumns: ColumnData[] = [
  {
    name: "ID",
    tldr: "Format code to select specific formats with -f",
    description: "A unique identifier for each format that can be used with the -f flag to download that specific format. Format IDs are extractor-specific and can be numbers, letters, or combinations.",
    commonValues: ["22", "18", "140", "251", "bestaudio", "bestvideo"],
    examples: ["yt-dlp -f 22 URL", "yt-dlp -f bestvideo+bestaudio URL"],
    tips: ["Use yt-dlp -F URL to see available IDs", "IDs are not consistent across different videos or sites"]
  },
  {
    name: "EXT",
    tldr: "File extension/container format (mp4, webm, m4a, etc.)",
    description: "The file extension that determines the container format used for the media. Different extensions support different codecs and have different compatibility characteristics.",
    commonValues: ["mp4", "webm", "m4a", "mp3", "flv", "3gp"],
    examples: ["mp4 - Universal compatibility", "webm - Modern format with VP9/AV1", "m4a - Audio-only container"],
    tips: ["MP4 is most compatible across devices", "WebM often has better compression", "Choose based on device compatibility"]
  },
  {
    name: "RESOLUTION",
    tldr: "Video dimensions (width×height) or 'audio only'",
    description: "Video resolution in pixels (width×height) or 'audio only' for audio-only formats. Higher resolutions provide better quality but larger file sizes.",
    commonValues: ["1920x1080", "1280x720", "854x480", "640x360", "audio only"],
    examples: ["1920x1080 - Full HD", "1280x720 - HD", "audio only - No video track"],
    tips: ["Higher resolutions = better quality but larger files", "Consider your display/screen size", "4K = 3840x2160, 8K = 7680x4320"]
  },
  {
    name: "FPS",
    tldr: "Frames per second - video smoothness/quality",
    description: "Frames per second (FPS) indicates how smooth the video appears. Higher FPS provides smoother motion but requires more data. Standard is 30fps, high frame rate content may be 60fps.",
    commonValues: ["30", "60", "24", "25", "48"],
    examples: ["30 - Standard video", "60 - High frame rate gaming/sports", "24 - Cinematic films"],
    tips: ["60fps provides smoother motion", "Most content is 30fps", "Higher FPS = larger files"]
  },
  {
    name: "CH",
    tldr: "Audio channel configuration (stereo, 5.1, etc.)",
    description: "Number of audio channels. 'stereo' means 2 channels (left/right), '5.1' means 6 channels (surround sound), 'mono' means 1 channel.",
    commonValues: ["stereo", "5.1", "mono", "7.1"],
    examples: ["stereo - Standard headphones/speakers", "5.1 - Home theater surround", "mono - Single channel audio"],
    tips: ["Stereo is most compatible", "5.1 provides immersive audio", "Choose based on your audio setup"]
  },
  {
    name: "FILESIZE",
    tldr: "Estimated download size in bytes/MiB/GiB",
    description: "Approximate file size of the format. Helps you choose formats based on storage/bandwidth constraints. May show as '~1.2GiB' or '123.45MiB'.",
    commonValues: ["~1.2GiB", "456.78MiB", "89.12MiB"],
    examples: ["1.2GiB - Large HD video", "100MiB - Medium quality", "10MiB - Audio file"],
    tips: ["Estimate download time and storage needs", "Sizes are approximate", "Consider your internet speed"]
  },
  {
    name: "TBR",
    tldr: "Total bitrate (video + audio combined)",
    description: "Total bitrate in kbps (kilobits per second) combining both video and audio streams. Higher bitrates generally mean better quality but larger files.",
    commonValues: ["1280k", "2560k", "512k", "320k"],
    examples: ["2560k - High quality video", "320k - Good audio quality", "128k - Basic quality"],
    tips: ["Higher TBR = better quality", "Balance quality vs file size", "Consider your internet speed"]
  },
  {
    name: "PROTO",
    tldr: "Transfer protocol (https, dash, hls, etc.)",
    description: "The protocol used to deliver the media stream. HTTPS is standard, DASH/HLS are adaptive streaming protocols that allow quality switching.",
    commonValues: ["https", "dash", "hls", "http"],
    examples: ["https - Standard web delivery", "dash - Adaptive bitrate streaming", "hls - Apple's HTTP Live Streaming"],
    tips: ["DASH/HLS formats are more reliable", "HTTPS is most compatible", "Protocol affects download stability"]
  },
  {
    name: "VCODEC",
    tldr: "Video codec used for compression",
    description: "The video codec that compresses the video data. Different codecs offer different quality/size trade-offs. H.264 (avc1) is most compatible, newer codecs like VP9/AV1 offer better compression.",
    commonValues: ["avc1", "vp09", "av01", "hev1", "hvc1"],
    examples: ["avc1 - H.264, most compatible", "vp09 - VP9, better compression", "av01 - AV1, newest standard"],
    tips: ["H.264 for maximum compatibility", "VP9/AV1 for better compression", "Newer codecs need modern devices"]
  },
  {
    name: "VBR",
    tldr: "Video bitrate only (without audio)",
    description: "Video-only bitrate in kbps. This is the portion of total bitrate used just for video compression, excluding audio.",
    commonValues: ["2500k", "1500k", "800k", "500k"],
    examples: ["2500k - High quality video", "800k - Medium quality", "500k - Basic quality"],
    tips: ["Higher VBR = sharper video", "Depends on resolution and content", "Part of total TBR"]
  },
  {
    name: "ACODEC",
    tldr: "Audio codec used for compression",
    description: "The audio codec that compresses the audio data. AAC (mp4a) is most compatible, Opus offers better quality at low bitrates.",
    commonValues: ["mp4a", "opus", "vorbis", "mp3"],
    examples: ["mp4a - AAC, most compatible", "opus - High quality, efficient", "mp3 - Legacy format"],
    tips: ["AAC for maximum compatibility", "Opus for best quality/size ratio", "Choose based on device support"]
  },
  {
    name: "ABR",
    tldr: "Audio bitrate only (without video)",
    description: "Audio-only bitrate in kbps. This is the portion of total bitrate used just for audio compression, excluding video.",
    commonValues: ["128k", "256k", "320k", "64k"],
    examples: ["320k - High quality audio", "256k - Very good quality", "128k - Good quality"],
    tips: ["Higher ABR = better audio quality", "128k is usually sufficient", "Part of total TBR"]
  },
  {
    name: "ASR",
    tldr: "Audio sample rate in Hz (44100, 48000)",
    description: "Audio sampling rate in Hertz (Hz). Higher sample rates capture more detail but create larger files. CD quality is 44100 Hz.",
    commonValues: ["44100", "48000", "22050", "11025"],
    examples: ["44100 - CD quality", "48000 - Professional audio", "22050 - Low quality"],
    tips: ["44100+ Hz for high quality", "Lower rates save space", "Most music is 44100 Hz"]
  }
];

export function FormatDocs() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">yt-dlp Format Columns Guide</h1>
          <p className="text-slate-300 text-lg">
            Understanding the columns shown when you run <code className="bg-slate-800 px-2 py-1 rounded font-mono">yt-dlp -F URL</code>
          </p>
          <p className="text-slate-400 mt-2">
            This guide explains every column in yt-dlp's format table to help you choose the right formats for your downloads.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-3">Quick Start</h2>
          <div className="space-y-3 text-slate-300">
            <p>
              When you run <code className="bg-slate-700 px-2 py-1 rounded font-mono">yt-dlp -F https://youtube.com/watch?v=VIDEO_ID</code>,
              yt-dlp shows a table with information about all available formats. Each column tells you something important about that format.
            </p>
            <p>
              <strong>To download a specific format:</strong> Use <code className="bg-slate-700 px-2 py-1 rounded font-mono">yt-dlp -f FORMAT_ID URL</code><br />
              <strong>To combine video + audio:</strong> Use <code className="bg-slate-700 px-2 py-1 rounded font-mono">yt-dlp -f VIDEO_ID+AUDIO_ID URL</code>
            </p>
          </div>
        </div>

        {/* Column Reference Table */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4 font-semibold text-slate-200">Column</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-200">TLDR</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-200">Common Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {formatColumns.map((column, index) => (
                  <tr key={index} className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-mono font-semibold text-violet-300">{column.name}</td>
                    <td className="py-3 px-4 text-slate-300">{column.tldr}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {column.commonValues.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Explanations */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Detailed Explanations</h2>

          {formatColumns.map((column, index) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                <code className="bg-slate-700 px-2 py-1 rounded font-mono text-violet-300">{column.name}</code>
                <span className="text-slate-400 text-sm ml-2">— {column.tldr}</span>
              </h3>

              <p className="text-slate-300 mb-4">{column.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Common Values:</h4>
                  <ul className="space-y-1 text-slate-400 text-sm">
                    {column.commonValues.map((value, i) => (
                      <li key={i} className="font-mono">• {value}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Examples:</h4>
                  <ul className="space-y-1 text-slate-400 text-sm">
                    {column.examples.map((example, i) => (
                      <li key={i}>• {example}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-slate-200 mb-2">Tips:</h4>
                <ul className="space-y-1 text-slate-400 text-sm">
                  {column.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Usage Examples */}
        <div className="bg-slate-800/50 rounded-lg p-6 mt-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Common Usage Examples</h2>
          <div className="space-y-4 text-slate-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Download best quality video + audio:</h3>
              <code className="bg-slate-700 px-3 py-2 rounded block font-mono text-sm">
                yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" URL
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Download specific format by ID:</h3>
              <code className="bg-slate-700 px-3 py-2 rounded block font-mono text-sm">
                yt-dlp -f 22 URL  # Downloads format with ID "22"
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Download best audio only:</h3>
              <code className="bg-slate-700 px-3 py-2 rounded block font-mono text-sm">
                yt-dlp -f bestaudio -x --audio-format mp3 URL
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Download video under specific size:</h3>
              <code className="bg-slate-700 px-3 py-2 rounded block font-mono text-sm">
                yt-dlp -f "best[filesize&lt;100M]" URL
              </code>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-slate-800/50 rounded-lg p-6 mt-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Best Practices</h2>
          <div className="space-y-3 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-violet-400 font-bold mt-1">•</span>
              <p><strong>Compatibility first:</strong> MP4 with H.264 video (avc1) and AAC audio (mp4a) works on almost all devices</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 font-bold mt-1">•</span>
              <p><strong>Quality vs size:</strong> Higher resolution/bitrate = better quality but larger files. Choose based on your needs</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 font-bold mt-1">•</span>
              <p><strong>Modern codecs:</strong> VP9/AV1 offer better compression than H.264, but need newer devices/players</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 font-bold mt-1">•</span>
              <p><strong>Format selection:</strong> Use yt-dlp's format selection syntax to combine video and audio streams optimally</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-violet-400 font-bold mt-1">•</span>
              <p><strong>Test first:</strong> Always run <code className="bg-slate-700 px-1 py-0.5 rounded font-mono text-xs">-F</code> to see available formats before downloading</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
