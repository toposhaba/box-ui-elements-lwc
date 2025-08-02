// Media preprocessor for video and audio files
// Provides functionality for audio extraction, format conversion, and metadata extraction

export interface MediaMetadata {
    duration: number;
    format: string;
    size: number;
    width?: number;
    height?: number;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
}

export interface MediaPreprocessorResult {
    success: boolean;
    processedFile?: Blob;
    metadata?: MediaMetadata;
    audioData?: Float32Array;
    error?: string;
}

export interface MediaPreprocessorOptions {
    extractAudio?: boolean;
    convertToFormat?: string;
    extractMetadata?: boolean;
    targetSampleRate?: number;
    targetBitrate?: number;
    onProgress?: (progress: number, message: string) => void;
}

/**
 * Media preprocessor class for handling video and audio files
 */
export class MediaPreprocessor {
    private audioContext: AudioContext | null = null;

    constructor() {
        // Initialize AudioContext if available
        if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    /**
     * Extract metadata from media file
     */
    async extractMetadata(file: File): Promise<MediaMetadata> {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');
            
            if (isVideo) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                
                video.onloadedmetadata = () => {
                    const metadata: MediaMetadata = {
                        duration: video.duration,
                        format: file.type,
                        size: file.size,
                        width: video.videoWidth,
                        height: video.videoHeight,
                    };
                    URL.revokeObjectURL(url);
                    resolve(metadata);
                };
                
                video.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load video metadata'));
                };
                
                video.src = url;
            } else {
                // Audio file
                const audio = document.createElement('audio');
                audio.preload = 'metadata';
                
                audio.onloadedmetadata = () => {
                    const metadata: MediaMetadata = {
                        duration: audio.duration,
                        format: file.type,
                        size: file.size,
                    };
                    URL.revokeObjectURL(url);
                    resolve(metadata);
                };
                
                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load audio metadata'));
                };
                
                audio.src = url;
            }
        });
    }

    /**
     * Extract audio from video file
     */
    async extractAudioFromVideo(file: File, options: MediaPreprocessorOptions = {}): Promise<Blob> {
        if (!file.type.startsWith('video/')) {
            throw new Error('File is not a video');
        }

        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const url = URL.createObjectURL(file);
            
            video.onloadedmetadata = async () => {
                try {
                    if (options.onProgress) {
                        options.onProgress(10, 'Initializing audio extraction...');
                    }

                    // Create MediaRecorder to capture audio
                    const stream = (canvas as any).captureStream ? (canvas as any).captureStream() : (canvas as any).mozCaptureStream();
                    
                    // For actual audio extraction, we would need to use more sophisticated methods
                    // This is a simplified implementation that demonstrates the structure
                    
                    if (options.onProgress) {
                        options.onProgress(50, 'Processing audio track...');
                    }

                    // Simulate audio extraction process
                    const audioBlob = await this.simulateAudioExtraction(file, options);
                    
                    if (options.onProgress) {
                        options.onProgress(100, 'Audio extraction complete');
                    }

                    URL.revokeObjectURL(url);
                    resolve(audioBlob);
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video for audio extraction'));
            };
            
            video.src = url;
        });
    }

    /**
     * Convert audio file to different format
     */
    async convertAudioFormat(file: File, targetFormat: string, options: MediaPreprocessorOptions = {}): Promise<Blob> {
        if (!this.audioContext) {
            throw new Error('AudioContext not available');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    if (options.onProgress) {
                        options.onProgress(10, 'Loading audio data...');
                    }

                    const arrayBuffer = event.target?.result as ArrayBuffer;
                    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
                    
                    if (options.onProgress) {
                        options.onProgress(50, `Converting to ${targetFormat}...`);
                    }

                    // Convert audio buffer to target format
                    const convertedBlob = await this.convertAudioBuffer(audioBuffer, targetFormat, options);
                    
                    if (options.onProgress) {
                        options.onProgress(100, 'Conversion complete');
                    }

                    resolve(convertedBlob);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read audio file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract audio data for analysis
     */
    async extractAudioData(file: File, options: MediaPreprocessorOptions = {}): Promise<Float32Array> {
        if (!this.audioContext) {
            throw new Error('AudioContext not available');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    if (options.onProgress) {
                        options.onProgress(10, 'Loading audio data...');
                    }

                    const arrayBuffer = event.target?.result as ArrayBuffer;
                    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
                    
                    if (options.onProgress) {
                        options.onProgress(50, 'Extracting audio samples...');
                    }

                    // Extract audio data from first channel
                    const audioData = audioBuffer.getChannelData(0);
                    
                    if (options.onProgress) {
                        options.onProgress(100, 'Audio data extraction complete');
                    }

                    resolve(audioData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read audio file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Process media file with all requested operations
     */
    async processMediaFile(file: File, options: MediaPreprocessorOptions = {}): Promise<MediaPreprocessorResult> {
        try {
            const result: MediaPreprocessorResult = {
                success: true
            };

            if (options.onProgress) {
                options.onProgress(0, 'Starting media processing...');
            }

            // Extract metadata if requested
            if (options.extractMetadata) {
                if (options.onProgress) {
                    options.onProgress(20, 'Extracting metadata...');
                }
                result.metadata = await this.extractMetadata(file);
            }

            // Extract audio if requested
            if (options.extractAudio && file.type.startsWith('video/')) {
                if (options.onProgress) {
                    options.onProgress(40, 'Extracting audio from video...');
                }
                result.processedFile = await this.extractAudioFromVideo(file, options);
            }

            // Convert format if requested
            if (options.convertToFormat && file.type.startsWith('audio/')) {
                if (options.onProgress) {
                    options.onProgress(60, 'Converting audio format...');
                }
                result.processedFile = await this.convertAudioFormat(file, options.convertToFormat, options);
            }

            // Extract audio data for analysis
            if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                if (options.onProgress) {
                    options.onProgress(80, 'Extracting audio data...');
                }
                try {
                    const audioFile = result.processedFile ? new File([result.processedFile], file.name) : file;
                    if (audioFile.type.startsWith('audio/')) {
                        result.audioData = await this.extractAudioData(audioFile, options);
                    }
                } catch (error) {
                    // Audio data extraction is optional, don't fail the entire process
                    console.warn('Failed to extract audio data:', error);
                }
            }

            if (options.onProgress) {
                options.onProgress(100, 'Media processing complete');
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during media processing'
            };
        }
    }

    /**
     * Private method to simulate audio extraction from video
     * In a real implementation, this would use FFmpeg.js or similar
     */
    private async simulateAudioExtraction(file: File, options: MediaPreprocessorOptions): Promise<Blob> {
        // This is a placeholder implementation
        // In a real scenario, you would use FFmpeg.js or a similar library
        return new Promise((resolve) => {
            setTimeout(() => {
                // Create a simple audio blob as placeholder
                const audioBlob = new Blob(['audio data placeholder'], { type: 'audio/wav' });
                resolve(audioBlob);
            }, 1000);
        });
    }

    /**
     * Private method to convert audio buffer to target format
     */
    private async convertAudioBuffer(audioBuffer: AudioBuffer, targetFormat: string, options: MediaPreprocessorOptions): Promise<Blob> {
        // This is a simplified implementation
        // In a real scenario, you would implement proper format conversion
        const length = audioBuffer.length;
        const sampleRate = options.targetSampleRate || audioBuffer.sampleRate;
        
        // Create a simple WAV file
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Convert audio data
        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

// Utility functions for media file validation
export function isVideoFile(file: File): boolean {
    const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
    return VIDEO_TYPES.includes(file.type.toLowerCase());
}

export function isAudioFile(file: File): boolean {
    const AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac'];
    return AUDIO_TYPES.includes(file.type.toLowerCase());
}

export function isMediaFile(file: File): boolean {
    return isVideoFile(file) || isAudioFile(file);
}

// Export a default instance
export default new MediaPreprocessor();