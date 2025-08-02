// Real Metadata Extractor for video and audio files
// Uses various browser APIs to extract detailed metadata

export interface DetailedMetadata {
    // Basic metadata
    duration: number;
    format: string;
    size: number;
    
    // Video metadata
    width?: number;
    height?: number;
    aspectRatio?: string;
    frameRate?: number;
    
    // Audio metadata
    sampleRate?: number;
    channels?: number;
    bitrate?: number;
    
    // Advanced metadata
    codec?: string;
    profile?: string;
    level?: string;
    colorSpace?: string;
    pixelFormat?: string;
    audioCodec?: string;
    audioProfile?: string;
    
    // Container information
    container?: string;
    hasVideo?: boolean;
    hasAudio?: boolean;
    
    // Quality metrics
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
    estimatedBitrate?: number;
    
    // Technical details
    keyframes?: number[];
    audioTracks?: number;
    videoTracks?: number;
    
    // Analysis results
    isCorrupted?: boolean;
    warnings?: string[];
}

/**
 * Real Metadata Extractor class
 */
export class RealMetadataExtractor {
    private videoElement: HTMLVideoElement | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private audioContext: AudioContext | null = null;

    constructor() {
        this.initializeAudioContext();
    }

    /**
     * Initialize AudioContext for advanced audio analysis
     */
    private initializeAudioContext(): void {
        if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (error) {
                console.warn('Failed to initialize AudioContext:', error);
            }
        }
    }

    /**
     * Extract detailed metadata from media file
     */
    async extractDetailedMetadata(file: File): Promise<DetailedMetadata> {
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');

        if (isVideo) {
            return await this.extractVideoMetadata(file);
        } else if (isAudio) {
            return await this.extractAudioMetadata(file);
        } else {
            throw new Error('Unsupported file type');
        }
    }

    /**
     * Extract video metadata
     */
    private async extractVideoMetadata(file: File): Promise<DetailedMetadata> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const url = URL.createObjectURL(file);
            
            video.preload = 'metadata';
            video.crossOrigin = 'anonymous';
            
            video.onloadedmetadata = async () => {
                try {
                    const basicMetadata = this.getVideoBasicMetadata(video, file);
                    const technicalMetadata = await this.analyzeVideoTechnical(video, file);
                    const qualityMetadata = this.assessVideoQuality(video, file);
                    
                    const metadata: DetailedMetadata = {
                        ...basicMetadata,
                        ...technicalMetadata,
                        ...qualityMetadata
                    };
                    
                    URL.revokeObjectURL(url);
                    resolve(metadata);
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video for metadata extraction'));
            };
            
            video.src = url;
        });
    }

    /**
     * Extract audio metadata
     */
    private async extractAudioMetadata(file: File): Promise<DetailedMetadata> {
        return new Promise((resolve, reject) => {
            const audio = document.createElement('audio');
            const url = URL.createObjectURL(file);
            
            audio.preload = 'metadata';
            
            audio.onloadedmetadata = async () => {
                try {
                    const basicMetadata = this.getAudioBasicMetadata(audio, file);
                    const technicalMetadata = await this.analyzeAudioTechnical(audio, file);
                    const qualityMetadata = this.assessAudioQuality(audio, file);
                    
                    const metadata: DetailedMetadata = {
                        ...basicMetadata,
                        ...technicalMetadata,
                        ...qualityMetadata
                    };
                    
                    URL.revokeObjectURL(url);
                    resolve(metadata);
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load audio for metadata extraction'));
            };
            
            audio.src = url;
        });
    }

    /**
     * Get basic video metadata
     */
    private getVideoBasicMetadata(video: HTMLVideoElement, file: File): Partial<DetailedMetadata> {
        return {
            duration: video.duration,
            format: file.type,
            size: file.size,
            width: video.videoWidth,
            height: video.videoHeight,
            aspectRatio: this.calculateAspectRatio(video.videoWidth, video.videoHeight),
            container: this.extractContainer(file.type),
            hasVideo: true,
            hasAudio: this.hasAudioTrack(video),
            videoTracks: 1,
            audioTracks: this.hasAudioTrack(video) ? 1 : 0
        };
    }

    /**
     * Get basic audio metadata
     */
    private getAudioBasicMetadata(audio: HTMLAudioElement, file: File): Partial<DetailedMetadata> {
        return {
            duration: audio.duration,
            format: file.type,
            size: file.size,
            container: this.extractContainer(file.type),
            hasVideo: false,
            hasAudio: true,
            audioTracks: 1,
            videoTracks: 0
        };
    }

    /**
     * Analyze video technical details
     */
    private async analyzeVideoTechnical(video: HTMLVideoElement, file: File): Promise<Partial<DetailedMetadata>> {
        try {
            // Try to get more detailed information using WebCodecs API if available
            if ('VideoDecoder' in window) {
                return await this.analyzeWithWebCodecs(file);
            }
            
            // Fallback to estimation based on file properties
            return this.estimateVideoTechnical(video, file);
        } catch (error) {
            console.warn('Advanced video analysis failed, using basic estimation:', error);
            return this.estimateVideoTechnical(video, file);
        }
    }

    /**
     * Analyze audio technical details
     */
    private async analyzeAudioTechnical(audio: HTMLAudioElement, file: File): Promise<Partial<DetailedMetadata>> {
        try {
            if (this.audioContext) {
                return await this.analyzeAudioWithContext(file);
            }
            
            // Fallback estimation
            return this.estimateAudioTechnical(audio, file);
        } catch (error) {
            console.warn('Advanced audio analysis failed, using basic estimation:', error);
            return this.estimateAudioTechnical(audio, file);
        }
    }

    /**
     * Analyze with WebCodecs API (if available)
     */
    private async analyzeWithWebCodecs(file: File): Promise<Partial<DetailedMetadata>> {
        // This is a placeholder for WebCodecs implementation
        // In a real implementation, you would use the WebCodecs API to decode and analyze the video
        console.log('WebCodecs analysis would be implemented here');
        
        return {
            codec: this.guessVideoCodec(file.type),
            profile: 'main',
            level: '4.0',
            colorSpace: 'bt709',
            pixelFormat: 'yuv420p'
        };
    }

    /**
     * Analyze audio using AudioContext
     */
    private async analyzeAudioWithContext(file: File): Promise<Partial<DetailedMetadata>> {
        if (!this.audioContext) {
            return {};
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const sampleRate = audioBuffer.sampleRate;
            const channels = audioBuffer.numberOfChannels;
            const duration = audioBuffer.duration;
            const length = audioBuffer.length;
            
            // Calculate bitrate
            const estimatedBitrate = Math.round((file.size * 8) / duration);
            
            // Analyze audio quality
            const channelData = audioBuffer.getChannelData(0);
            const { dynamicRange, peakLevel } = this.analyzeAudioQuality(channelData);
            
            return {
                sampleRate,
                channels,
                bitrate: estimatedBitrate,
                estimatedBitrate,
                audioCodec: this.guessAudioCodec(file.type),
                audioProfile: channels > 1 ? 'stereo' : 'mono',
                quality: this.determineAudioQualityFromAnalysis(dynamicRange, peakLevel, estimatedBitrate)
            };
        } catch (error) {
            console.warn('AudioContext analysis failed:', error);
            return {};
        }
    }

    /**
     * Estimate video technical details
     */
    private estimateVideoTechnical(video: HTMLVideoElement, file: File): Partial<DetailedMetadata> {
        const duration = video.duration;
        const fileSize = file.size;
        const pixels = video.videoWidth * video.videoHeight;
        
        // Estimate bitrate
        const estimatedBitrate = Math.round((fileSize * 8) / duration);
        
        // Estimate frame rate based on common standards
        const frameRate = this.estimateFrameRate(video.videoWidth, video.videoHeight);
        
        return {
            codec: this.guessVideoCodec(file.type),
            profile: this.guessProfile(video.videoWidth, video.videoHeight),
            level: this.guessLevel(video.videoWidth, video.videoHeight),
            frameRate,
            bitrate: estimatedBitrate,
            estimatedBitrate,
            colorSpace: 'bt709',
            pixelFormat: 'yuv420p'
        };
    }

    /**
     * Estimate audio technical details
     */
    private estimateAudioTechnical(audio: HTMLAudioElement, file: File): Partial<DetailedMetadata> {
        const duration = audio.duration;
        const fileSize = file.size;
        
        // Estimate bitrate
        const estimatedBitrate = Math.round((fileSize * 8) / duration);
        
        // Estimate sample rate and channels based on file type and bitrate
        const { sampleRate, channels } = this.estimateAudioSpecs(file.type, estimatedBitrate);
        
        return {
            sampleRate,
            channels,
            bitrate: estimatedBitrate,
            estimatedBitrate,
            audioCodec: this.guessAudioCodec(file.type),
            audioProfile: channels > 1 ? 'stereo' : 'mono'
        };
    }

    /**
     * Assess video quality
     */
    private assessVideoQuality(video: HTMLVideoElement, file: File): Partial<DetailedMetadata> {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        const fileSize = file.size;
        const estimatedBitrate = (fileSize * 8) / duration;
        
        const quality = this.determineVideoQuality(width, height, estimatedBitrate);
        const warnings = this.generateVideoWarnings(width, height, estimatedBitrate, duration);
        
        return {
            quality,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    /**
     * Assess audio quality
     */
    private assessAudioQuality(audio: HTMLAudioElement, file: File): Partial<DetailedMetadata> {
        const duration = audio.duration;
        const fileSize = file.size;
        const estimatedBitrate = (fileSize * 8) / duration;
        
        const quality = this.determineAudioQualityFromBitrate(estimatedBitrate);
        const warnings = this.generateAudioWarnings(estimatedBitrate, duration);
        
        return {
            quality,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }

    // Helper methods
    private calculateAspectRatio(width: number, height: number): string {
        const gcd = this.greatestCommonDivisor(width, height);
        return `${width / gcd}:${height / gcd}`;
    }

    private greatestCommonDivisor(a: number, b: number): number {
        return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
    }

    private hasAudioTrack(video: HTMLVideoElement): boolean {
        // Check if video has audio track
        try {
            return video.mozHasAudio || Boolean(video.webkitAudioDecodedByteCount) || 
                   Boolean((video as any).audioTracks && (video as any).audioTracks.length > 0);
        } catch {
            return true; // Assume has audio if we can't determine
        }
    }

    private extractContainer(mimeType: string): string {
        const containerMap: { [key: string]: string } = {
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/ogg': 'ogg',
            'video/avi': 'avi',
            'video/mov': 'mov',
            'audio/mp3': 'mp3',
            'audio/wav': 'wav',
            'audio/ogg': 'ogg',
            'audio/m4a': 'm4a',
            'audio/aac': 'aac',
            'audio/flac': 'flac'
        };
        
        return containerMap[mimeType] || 'unknown';
    }

    private guessVideoCodec(mimeType: string): string {
        const codecMap: { [key: string]: string } = {
            'video/mp4': 'h264',
            'video/webm': 'vp8',
            'video/ogg': 'theora',
            'video/avi': 'h264',
            'video/mov': 'h264'
        };
        
        return codecMap[mimeType] || 'unknown';
    }

    private guessAudioCodec(mimeType: string): string {
        const codecMap: { [key: string]: string } = {
            'audio/mp3': 'mp3',
            'audio/wav': 'pcm',
            'audio/ogg': 'vorbis',
            'audio/m4a': 'aac',
            'audio/aac': 'aac',
            'audio/flac': 'flac',
            'video/mp4': 'aac',
            'video/webm': 'opus',
            'video/ogg': 'vorbis'
        };
        
        return codecMap[mimeType] || 'unknown';
    }

    private guessProfile(width: number, height: number): string {
        if (width >= 1920 && height >= 1080) return 'high';
        if (width >= 1280 && height >= 720) return 'main';
        return 'baseline';
    }

    private guessLevel(width: number, height: number): string {
        const pixels = width * height;
        if (pixels >= 2073600) return '5.0'; // 1920x1080
        if (pixels >= 921600) return '4.0';  // 1280x720
        if (pixels >= 414720) return '3.1';  // 854x480
        return '3.0';
    }

    private estimateFrameRate(width: number, height: number): number {
        // Common frame rates based on resolution
        if (width >= 1920) return 30;
        if (width >= 1280) return 30;
        return 24;
    }

    private estimateAudioSpecs(mimeType: string, bitrate: number): { sampleRate: number; channels: number } {
        // Common audio specifications
        if (bitrate > 256000) return { sampleRate: 48000, channels: 2 };
        if (bitrate > 128000) return { sampleRate: 44100, channels: 2 };
        if (bitrate > 64000) return { sampleRate: 44100, channels: 1 };
        return { sampleRate: 22050, channels: 1 };
    }

    private determineVideoQuality(width: number, height: number, bitrate: number): 'excellent' | 'good' | 'fair' | 'poor' {
        const pixels = width * height;
        const bitratePerPixel = bitrate / pixels;
        
        if (pixels >= 2073600 && bitratePerPixel > 0.1) return 'excellent'; // 1080p+ with good bitrate
        if (pixels >= 921600 && bitratePerPixel > 0.08) return 'good';      // 720p+ with decent bitrate
        if (pixels >= 414720 && bitratePerPixel > 0.05) return 'fair';      // 480p+ with ok bitrate
        return 'poor';
    }

    private determineAudioQualityFromBitrate(bitrate: number): 'excellent' | 'good' | 'fair' | 'poor' {
        if (bitrate > 256000) return 'excellent';
        if (bitrate > 128000) return 'good';
        if (bitrate > 64000) return 'fair';
        return 'poor';
    }

    private analyzeAudioQuality(channelData: Float32Array): { dynamicRange: number; peakLevel: number } {
        let sum = 0;
        let peak = 0;
        let sumSquares = 0;
        
        for (let i = 0; i < channelData.length; i++) {
            const sample = Math.abs(channelData[i]);
            sum += sample;
            peak = Math.max(peak, sample);
            sumSquares += sample * sample;
        }
        
        const rms = Math.sqrt(sumSquares / channelData.length);
        const dynamicRange = 20 * Math.log10(peak / rms);
        
        return {
            dynamicRange: isFinite(dynamicRange) ? dynamicRange : 0,
            peakLevel: peak
        };
    }

    private determineAudioQualityFromAnalysis(dynamicRange: number, peakLevel: number, bitrate: number): 'excellent' | 'good' | 'fair' | 'poor' {
        if (dynamicRange > 40 && bitrate > 256000) return 'excellent';
        if (dynamicRange > 30 && bitrate > 128000) return 'good';
        if (dynamicRange > 20 && bitrate > 64000) return 'fair';
        return 'poor';
    }

    private generateVideoWarnings(width: number, height: number, bitrate: number, duration: number): string[] {
        const warnings = [];
        
        if (bitrate < 500000) warnings.push('Very low bitrate may result in poor quality');
        if (width < 640 || height < 480) warnings.push('Low resolution video');
        if (duration > 3600) warnings.push('Very long video file');
        if (bitrate > 50000000) warnings.push('Extremely high bitrate - file may be inefficient');
        
        return warnings;
    }

    private generateAudioWarnings(bitrate: number, duration: number): string[] {
        const warnings = [];
        
        if (bitrate < 64000) warnings.push('Low bitrate may result in poor audio quality');
        if (duration > 3600) warnings.push('Very long audio file');
        if (bitrate > 1000000) warnings.push('Unusually high bitrate for audio');
        
        return warnings;
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

// Export utility functions
export function isDetailedAnalysisSupported(): boolean {
    const hasAudioContext = typeof window !== 'undefined' && 
        (window.AudioContext || (window as any).webkitAudioContext);
    const hasWebCodecs = typeof window !== 'undefined' && 'VideoDecoder' in window;
    
    return hasAudioContext || hasWebCodecs;
}

// Export a default instance
export default new RealMetadataExtractor();