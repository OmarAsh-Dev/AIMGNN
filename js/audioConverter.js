// Audio conversion Web Worker
importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');

self.onmessage = async function(e) {
  const { audioData, sampleRate, channels } = e.data;

  try {
    // Initialize MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 320);
    
    // Convert Float32Array to Int16Array for the encoder
    const samples = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      // Scale to 16-bit range and clip
      samples[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
    }

    // Encode to MP3 in chunks
    const chunkSize = 1152; // Must be multiple of 576
    const mp3Data = [];
    
    for (let i = 0; i < samples.length; i += chunkSize) {
      const chunk = samples.subarray(i, i + chunkSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
      }
    }

    // Get the last chunk of data
    const final = mp3encoder.flush();
    if (final.length > 0) {
      mp3Data.push(new Int8Array(final));
    }

    // Combine all chunks
    const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedData = new Int8Array(totalLength);
    let offset = 0;
    for (const chunk of mp3Data) {
      combinedData.set(chunk, offset);
      offset += chunk.length;
    }

    // Send back the processed data
    self.postMessage({ success: true, data: combinedData.buffer }, [combinedData.buffer]);
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
}; 