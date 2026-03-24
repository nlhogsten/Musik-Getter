import { useState, useMemo } from "react";

export interface DataSource {
  name: string;
  extractor: string;
  category: 'video' | 'audio' | 'both';
  qualityRank: 1 | 2 | 3 | 4 | 5;
  maxAudioQuality: string;
  maxVideoQuality: string;
  supportedCodecs: string[];
  reliability: 'high' | 'medium' | 'low';
  typicalBitrates: string[];
  sampleUrls: string[];
  notes: string[];
  description: string;
}

const dataSources: DataSource[] = [
  {
    name: "YouTube",
    extractor: "youtube",
    category: "both",
    qualityRank: 4,
    maxAudioQuality: "Opus 160kbps",
    maxVideoQuality: "4K VP9/AV1",
    supportedCodecs: ["opus", "aac", "mp3", "vp9", "av01", "avc1"],
    reliability: "high",
    typicalBitrates: ["128-160kbps audio", "4-20Mbps video"],
    sampleUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    notes: [
      "Most reliable source",
      "Consistent quality",
      "Large content library",
      "Opus audio codec provides excellent quality"
    ],
    description: "World's largest video platform with extensive music content"
  },
  {
    name: "Bandcamp",
    extractor: "bandcamp",
    category: "audio",
    qualityRank: 5,
    maxAudioQuality: "FLAC/ALAC lossless",
    maxVideoQuality: "N/A",
    supportedCodecs: ["flac", "alac", "aac", "mp3", "vorbis"],
    reliability: "high",
    typicalBitrates: ["Lossless", "320kbps", "256kbps", "128kbps"],
    sampleUrls: ["https://artist.bandcamp.com/track/song"],
    notes: [
      "Artist-direct support",
      "Lossless audio available",
      "High quality downloads",
      "Supports independent artists"
    ],
    description: "Direct-to-fan music platform with lossless audio support"
  },
  {
    name: "SoundCloud",
    extractor: "soundcloud",
    category: "audio",
    qualityRank: 4,
    maxAudioQuality: "AAC 256kbps",
    maxVideoQuality: "N/A",
    supportedCodecs: ["aac", "mp3"],
    reliability: "high",
    typicalBitrates: ["128kbps", "256kbps"],
    sampleUrls: ["https://soundcloud.com/artist/track"],
    notes: [
      "Independent artist platform",
      "Consistent quality",
      "Large music library",
      "Some tracks may be private"
    ],
    description: "Audio distribution platform for independent artists"
  },
  {
    name: "Vimeo",
    extractor: "vimeo",
    category: "both",
    qualityRank: 4,
    maxAudioQuality: "AAC 320kbps",
    maxVideoQuality: "4K H.264",
    supportedCodecs: ["aac", "h264", "vp9"],
    reliability: "high",
    typicalBitrates: ["128-320kbps audio", "5-15Mbps video"],
    sampleUrls: ["https://vimeo.com/123456789"],
    notes: [
      "Professional content",
      "High quality standards",
      "Less restricted than YouTube",
      "Good for music videos"
    ],
    description: "Professional video platform with high-quality content"
  },
  {
    name: "Dailymotion",
    extractor: "dailymotion",
    category: "both",
    qualityRank: 3,
    maxAudioQuality: "AAC 128kbps",
    maxVideoQuality: "1080p H.264",
    supportedCodecs: ["aac", "h264", "vp9"],
    reliability: "medium",
    typicalBitrates: ["96-128kbps audio", "2-8Mbps video"],
    sampleUrls: ["https://www.dailymotion.com/video/x123456"],
    notes: [
      "European platform",
      "Moderate quality",
      "Some regional restrictions",
      "Reliable for mainstream content"
    ],
    description: "European video hosting platform"
  },
  {
    name: "Internet Archive",
    extractor: "archive.org",
    category: "both",
    qualityRank: 5,
    maxAudioQuality: "FLAC lossless",
    maxVideoQuality: "4K various",
    supportedCodecs: ["flac", "aac", "mp3", "h264", "vp9"],
    reliability: "high",
    typicalBitrates: ["Lossless audio", "Variable video"],
    sampleUrls: ["https://archive.org/details/concert-name"],
    notes: [
      "Public domain content",
      "Lossless audio archives",
      "Concert recordings",
      "Historical content"
    ],
    description: "Digital library with vast audio/video archives"
  },
  {
    name: "Spotify (via extractor)",
    extractor: "spotify",
    category: "audio",
    qualityRank: 3,
    maxAudioQuality: "AAC 320kbps",
    maxVideoQuality: "N/A",
    supportedCodecs: ["aac", "ogg"],
    reliability: "medium",
    typicalBitrates: ["96kbps", "160kbps", "320kbps"],
    sampleUrls: ["https://open.spotify.com/track/123456789"],
    notes: [
      "Requires authentication",
      "Premium quality available",
      "Large catalog",
      "May have restrictions"
    ],
    description: "Music streaming service (extractor-dependent)"
  },
  {
    name: "Apple Podcasts",
    extractor: "applepodcasts",
    category: "audio",
    qualityRank: 4,
    maxAudioQuality: "AAC 256kbps",
    maxVideoQuality: "N/A",
    supportedCodecs: ["aac"],
    reliability: "high",
    typicalBitrates: ["64kbps", "96kbps", "128kbps", "256kbps"],
    sampleUrls: ["https://podcasts.apple.com/podcast/id123456789"],
    notes: [
      "High quality podcasts",
      "Consistent availability",
      "Wide range of content",
      "Good for educational content"
    ],
    description: "Apple's podcast directory with high-quality audio"
  },
  {
    name: "Twitch",
    extractor: "twitch",
    category: "both",
    qualityRank: 3,
    maxAudioQuality: "AAC 160kbps",
    maxVideoQuality: "1080p60 H.264",
    supportedCodecs: ["aac", "h264"],
    reliability: "medium",
    typicalBitrates: ["96-160kbps audio", "3-8Mbps video"],
    sampleUrls: ["https://www.twitch.tv/videos/123456789"],
    notes: [
      "Live streaming focus",
      "VODs available",
      "Music content common",
      "May require authentication"
    ],
    description: "Live streaming platform with video-on-demand content"
  },
  {
    name: "Beatport",
    extractor: "beatport",
    category: "audio",
    qualityRank: 4,
    maxAudioQuality: "MP3 320kbps",
    maxVideoQuality: "N/A",
    supportedCodecs: ["mp3", "wav"],
    reliability: "high",
    typicalBitrates: ["192kbps", "320kbps", "WAV lossless"],
    sampleUrls: ["https://www.beatport.com/track/artist-name/123456"],
    notes: [
      "Electronic music focus",
      "Professional DJ source",
      "High quality downloads",
      "Commercial content"
    ],
    description: "Electronic music store and DJ resource"
  }
];

const categoryColors = {
  video: 'bg-blue-500',
  audio: 'bg-green-500',
  both: 'bg-purple-500'
};

const reliabilityColors = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400'
};

const qualityStars = (rank: number) => {
  return '★'.repeat(rank) + '☆'.repeat(5 - rank);
};

export function DataSources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'video' | 'audio' | 'both'>('all');
  const [selectedQuality, setSelectedQuality] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');

  const filteredSources = useMemo(() => {
    return dataSources.filter(source => {
      const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           source.extractor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           source.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || source.category === selectedCategory;
      
      const matchesQuality = selectedQuality === 'all' || source.qualityRank >= selectedQuality;
      
      return matchesSearch && matchesCategory && matchesQuality;
    });
  }, [searchTerm, selectedCategory, selectedQuality]);

  const handleTestUrl = async (url: string) => {
    // This would integrate with the existing inspection system
    // For now, we'll just open a new tab with the download page
    window.open(`/?urls=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Data Sources</h1>
          <p className="text-slate-300 text-lg">
            High-quality audio and video sources supported by yt-dlp
          </p>
          <p className="text-slate-400 mt-2">
            Ranked by quality, reliability, and safety. Click to test URLs directly.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Sources
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or extractor..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'all' | 'video' | 'audio' | 'both')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Categories</option>
                <option value="video">Video Only</option>
                <option value="audio">Audio Only</option>
                <option value="both">Video + Audio</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Minimum Quality
              </label>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value as 'all' | 1 | 2 | 3 | 4 | 5)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Qualities</option>
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4+ Stars (Good)</option>
                <option value="3">3+ Stars (Fair)</option>
                <option value="2">2+ Stars (Limited)</option>
                <option value="1">1+ Stars (All)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-8 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-slate-400">Audio Only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-slate-400">Video Only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span className="text-slate-400">Video + Audio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★★★★★</span>
              <span className="text-slate-400">Quality Rating</span>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-400">
            Showing {filteredSources.length} of {dataSources.length} sources
          </p>
        </div>

        {/* Source Cards */}
        <div className="grid gap-6">
          {filteredSources.map((source, index) => (
            <div key={index} className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 hover:border-violet-600/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{source.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded ${categoryColors[source.category]}`}>
                      {source.category}
                    </span>
                    <span className={`text-sm ${reliabilityColors[source.reliability]}`}>
                      {source.reliability === 'high' ? '●' : source.reliability === 'medium' ? '○' : '◌'} {source.reliability}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2">{source.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="text-yellow-400">{qualityStars(source.qualityRank)}</span>
                    <span>Extractor: <code className="bg-slate-700 px-1 rounded">{source.extractor}</code></span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Quality Information</h4>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p>• Max Audio: {source.maxAudioQuality}</p>
                    {source.maxVideoQuality !== "N/A" && <p>• Max Video: {source.maxVideoQuality}</p>}
                    <p>• Typical Bitrates: {source.typicalBitrates.join(", ")}</p>
                    <p>• Codecs: {source.supportedCodecs.join(", ")}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Key Features</h4>
                  <ul className="space-y-1 text-sm text-slate-400">
                    {source.notes.map((note, i) => (
                      <li key={i}>• {note}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {source.sampleUrls.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="text-sm text-slate-400">
                    <span className="font-medium">Sample URL:</span>
                    <code className="ml-2 bg-slate-700 px-2 py-1 rounded text-xs">
                      {source.sampleUrls[0]}
                    </code>
                  </div>
                  <button
                    onClick={() => handleTestUrl(source.sampleUrls[0])}
                    className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-500 transition-colors"
                  >
                    Test URL
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No sources found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
