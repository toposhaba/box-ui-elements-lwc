// Speech Recognition Processor for audio/video transcription
// Uses Web Speech API, WebRTC, and fallback techniques

export interface SpeechRecognitionOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    onProgress?: (progress: number, message: string) => void;
    onInterimResult?: (text: string) => void;
    chunkDuration?: number; // For processing long audio files in chunks
}

export interface TranscriptionResult {
    success: boolean;
    transcript?: string;
    confidence?: number;
    segments?: Array<{
        text: string;
        startTime: number;
        endTime: number;
        confidence: number;
    }>;
    language?: string;
    error?: string;
}

export interface SpeechRecognitionCapabilities {
    webSpeechAPI: boolean;
    webRTC: boolean;
    audioContext: boolean;
    mediaRecorder: boolean;
}

/**
 * Speech Recognition Processor class
 */
export class SpeechRecognitionProcessor {
    private recognition: any = null;
    private audioContext: AudioContext | null = null;
    private capabilities: SpeechRecognitionCapabilities;

    constructor() {
        this.capabilities = this.detectCapabilities();
        this.initializeAudioContext();
    }

    /**
     * Detect browser capabilities for speech recognition
     */
    private detectCapabilities(): SpeechRecognitionCapabilities {
        const webSpeechAPI = typeof window !== 'undefined' && 
            ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
        
        const webRTC = typeof window !== 'undefined' && 
            ('MediaRecorder' in window);
        
        const audioContext = typeof window !== 'undefined' && 
            ('AudioContext' in window || 'webkitAudioContext' in window);
        
        const mediaRecorder = typeof window !== 'undefined' && 
            ('MediaRecorder' in window);

        return {
            webSpeechAPI,
            webRTC,
            audioContext,
            mediaRecorder
        };
    }

    /**
     * Initialize Audio Context
     */
    private initializeAudioContext(): void {
        if (this.capabilities.audioContext && typeof window !== 'undefined') {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (error) {
                console.warn('Failed to initialize AudioContext:', error);
            }
        }
    }

    /**
     * Create speech recognition instance
     */
    private createSpeechRecognition(options: SpeechRecognitionOptions): any {
        if (!this.capabilities.webSpeechAPI) {
            throw new Error('Web Speech API not supported');
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = options.continuous !== false;
        recognition.interimResults = options.interimResults !== false;
        recognition.maxAlternatives = options.maxAlternatives || 1;
        recognition.lang = options.language || 'en-US';

        return recognition;
    }

    /**
     * Process audio file for transcription
     */
    async processAudioFile(file: File, options: SpeechRecognitionOptions = {}): Promise<TranscriptionResult> {
        try {
            if (options.onProgress) {
                options.onProgress(0, 'Initializing transcription...');
            }

            // Check if we can use Web Speech API directly
            if (this.capabilities.webSpeechAPI && this.capabilities.audioContext) {
                return await this.transcribeWithWebSpeechAPI(file, options);
            } else {
                // Fallback to alternative methods
                return await this.transcribeWithFallback(file, options);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown transcription error'
            };
        }
    }

    /**
     * Transcribe using Web Speech API
     */
    private async transcribeWithWebSpeechAPI(file: File, options: SpeechRecognitionOptions): Promise<TranscriptionResult> {
        return new Promise(async (resolve, reject) => {
            try {
                if (options.onProgress) {
                    options.onProgress(10, 'Loading audio file...');
                }

                // Convert file to audio for playback
                const audioUrl = URL.createObjectURL(file);
                const audio = new Audio(audioUrl);
                
                if (options.onProgress) {
                    options.onProgress(20, 'Setting up speech recognition...');
                }

                const recognition = this.createSpeechRecognition(options);
                let finalTranscript = '';
                let isProcessing = false;

                recognition.onstart = () => {
                    isProcessing = true;
                    if (options.onProgress) {
                        options.onProgress(30, 'Speech recognition started...');
                    }
                };

                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    if (options.onInterimResult && interimTranscript) {
                        options.onInterimResult(interimTranscript);
                    }

                    if (options.onProgress && finalTranscript) {
                        const progress = Math.min(90, 30 + (finalTranscript.length / 100));
                        options.onProgress(progress, 'Processing speech...');
                    }
                };

                recognition.onend = () => {
                    isProcessing = false;
                    URL.revokeObjectURL(audioUrl);
                    
                    if (options.onProgress) {
                        options.onProgress(100, 'Transcription complete');
                    }

                    resolve({
                        success: true,
                        transcript: finalTranscript.trim(),
                        confidence: 0.8, // Web Speech API doesn't always provide confidence
                        language: options.language || 'en-US'
                    });
                };

                recognition.onerror = (event: any) => {
                    isProcessing = false;
                    URL.revokeObjectURL(audioUrl);
                    
                    reject(new Error(`Speech recognition error: ${event.error}`));
                };

                // Start audio playback and recognition simultaneously
                audio.onloadedmetadata = () => {
                    if (options.onProgress) {
                        options.onProgress(25, 'Starting audio playback...');
                    }
                    
                    // Start recognition first
                    recognition.start();
                    
                    // Then start audio playback
                    audio.play().catch(error => {
                        console.warn('Audio playback failed, using alternative method:', error);
                        // Try alternative transcription method
                        this.transcribeWithFallback(file, options).then(resolve).catch(reject);
                    });
                };

                // Handle audio end
                audio.onended = () => {
                    setTimeout(() => {
                        if (isProcessing) {
                            recognition.stop();
                        }
                    }, 1000); // Give some time for final processing
                };

                audio.onerror = (error) => {
                    console.error('Audio loading error:', error);
                    this.transcribeWithFallback(file, options).then(resolve).catch(reject);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Fallback transcription method when Web Speech API is not available
     */
    private async transcribeWithFallback(file: File, options: SpeechRecognitionOptions): Promise<TranscriptionResult> {
        if (options.onProgress) {
            options.onProgress(0, 'Using fallback transcription method...');
        }

        try {
            // Method 1: Try to extract audio features and provide intelligent feedback
            const audioAnalysis = await this.analyzeAudioFile(file, options);
            
            if (options.onProgress) {
                options.onProgress(50, 'Analyzing audio characteristics...');
            }

            // Method 2: Use audio context to analyze frequency patterns
            const frequencyAnalysis = await this.analyzeAudioFrequencies(file);
            
            if (options.onProgress) {
                options.onProgress(80, 'Generating transcription summary...');
            }

            // Generate intelligent fallback response based on analysis
            const fallbackTranscript = this.generateFallbackTranscript(file, audioAnalysis, frequencyAnalysis);
            
            if (options.onProgress) {
                options.onProgress(100, 'Fallback transcription complete');
            }

            return {
                success: true,
                transcript: fallbackTranscript,
                confidence: 0.3, // Lower confidence for fallback
                segments: audioAnalysis.segments,
                language: options.language || 'en-US'
            };

        } catch (error) {
            return {
                success: false,
                error: 'Fallback transcription failed: ' + (error instanceof Error ? error.message : 'Unknown error')
            };
        }
    }

    /**
     * Analyze audio file properties
     */
    private async analyzeAudioFile(file: File, options: SpeechRecognitionOptions): Promise<any> {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            audio.onloadedmetadata = () => {
                const analysis = {
                    duration: audio.duration,
                    estimatedWords: Math.floor(audio.duration * 2.5), // Rough estimate: 150 words per minute
                    segments: this.generateTimeSegments(audio.duration),
                    hasAudio: true
                };
                
                URL.revokeObjectURL(url);
                resolve(analysis);
            };
            
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to analyze audio file'));
            };
            
            audio.src = url;
        });
    }

    /**
     * Analyze audio frequencies
     */
    private async analyzeAudioFrequencies(file: File): Promise<any> {
        if (!this.audioContext) {
            return { hasVoiceFrequencies: false, speechLikeness: 0 };
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Analyze frequency content
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            
            // Simple voice frequency detection (300-3400 Hz range)
            let voiceFrequencyEnergy = 0;
            let totalEnergy = 0;
            
            // Basic frequency analysis using FFT-like approach
            const windowSize = 1024;
            const hopSize = 512;
            
            for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
                const window = channelData.slice(i, i + windowSize);
                const spectrum = this.simpleFFT(window);
                
                // Check energy in voice frequency range
                const voiceStart = Math.floor(300 * windowSize / sampleRate);
                const voiceEnd = Math.floor(3400 * windowSize / sampleRate);
                
                for (let f = 0; f < spectrum.length; f++) {
                    const energy = spectrum[f] * spectrum[f];
                    totalEnergy += energy;
                    
                    if (f >= voiceStart && f <= voiceEnd) {
                        voiceFrequencyEnergy += energy;
                    }
                }
            }
            
            const speechLikeness = totalEnergy > 0 ? voiceFrequencyEnergy / totalEnergy : 0;
            
            return {
                hasVoiceFrequencies: speechLikeness > 0.1,
                speechLikeness,
                estimatedSpeechQuality: speechLikeness > 0.3 ? 'good' : speechLikeness > 0.1 ? 'fair' : 'poor'
            };
            
        } catch (error) {
            console.warn('Frequency analysis failed:', error);
            return { hasVoiceFrequencies: false, speechLikeness: 0 };
        }
    }

    /**
     * Simple FFT implementation for basic frequency analysis
     */
    private simpleFFT(samples: Float32Array): Float32Array {
        const N = samples.length;
        const spectrum = new Float32Array(N / 2);
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += samples[n] * Math.cos(angle);
                imag += samples[n] * Math.sin(angle);
            }
            
            spectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return spectrum;
    }

    /**
     * Generate time-based segments for audio
     */
    private generateTimeSegments(duration: number): Array<any> {
        const segments = [];
        const segmentLength = 30; // 30-second segments
        
        for (let start = 0; start < duration; start += segmentLength) {
            const end = Math.min(start + segmentLength, duration);
            segments.push({
                text: `[Audio segment ${Math.floor(start / segmentLength) + 1}]`,
                startTime: start,
                endTime: end,
                confidence: 0.5
            });
        }
        
        return segments;
    }

    /**
     * Generate intelligent fallback transcript
     */
    private generateFallbackTranscript(file: File, audioAnalysis: any, frequencyAnalysis: any): string {
        const fileName = file.name;
        const duration = audioAnalysis.duration;
        const estimatedWords = audioAnalysis.estimatedWords;
        const speechQuality = frequencyAnalysis.estimatedSpeechQuality;
        
        let transcript = `Audio file "${fileName}" processed. `;
        transcript += `Duration: ${this.formatDuration(duration)}. `;
        
        if (frequencyAnalysis.hasVoiceFrequencies) {
            transcript += `Speech patterns detected with ${speechQuality} quality. `;
            transcript += `Estimated content: approximately ${estimatedWords} words of spoken audio. `;
            
            if (speechQuality === 'good') {
                transcript += `High-quality audio suitable for transcription. `;
                transcript += `Recommend using dedicated speech recognition service for accurate transcription.`;
            } else if (speechQuality === 'fair') {
                transcript += `Moderate audio quality detected. `;
                transcript += `Consider audio enhancement before transcription for better results.`;
            } else {
                transcript += `Low audio quality or unclear speech detected. `;
                transcript += `Audio preprocessing may be required for transcription.`;
            }
        } else {
            transcript += `No clear speech patterns detected. `;
            transcript += `This audio may contain music, background noise, or non-speech content. `;
            transcript += `If speech is present, consider audio enhancement or noise reduction.`;
        }
        
        transcript += ` Note: This is an automated analysis. For accurate transcription, `;
        transcript += `please use a dedicated speech recognition service or enable Web Speech API in your browser.`;
        
        return transcript;
    }

    /**
     * Format duration in human-readable format
     */
    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Process live audio stream (for real-time transcription)
     */
    async processLiveAudio(options: SpeechRecognitionOptions = {}): Promise<void> {
        if (!this.capabilities.webSpeechAPI) {
            throw new Error('Live transcription requires Web Speech API support');
        }

        const recognition = this.createSpeechRecognition({
            ...options,
            continuous: true,
            interimResults: true
        });

        recognition.onstart = () => {
            console.log('Live transcription started');
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (options.onInterimResult && interimTranscript) {
                options.onInterimResult(interimTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Live transcription error:', event.error);
        };

        recognition.start();
        return recognition;
    }

    /**
     * Get supported languages for speech recognition
     */
    getSupportedLanguages(): string[] {
        return [
            'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
            'es-ES', 'es-MX', 'es-AR', 'es-CO',
            'fr-FR', 'fr-CA',
            'de-DE',
            'it-IT',
            'pt-BR', 'pt-PT',
            'ru-RU',
            'ja-JP',
            'ko-KR',
            'zh-CN', 'zh-TW',
            'ar-SA',
            'hi-IN'
        ];
    }

    /**
     * Check if speech recognition is supported
     */
    isSupported(): boolean {
        return this.capabilities.webSpeechAPI || this.capabilities.audioContext;
    }

    /**
     * Get capability information
     */
    getCapabilities(): SpeechRecognitionCapabilities {
        return this.capabilities;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.recognition) {
            this.recognition.abort();
            this.recognition = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

// Utility functions
export function isSupportedAudioFormat(file: File): boolean {
    const supportedFormats = [
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/m4a',
        'audio/aac',
        'audio/flac',
        'audio/webm',
        'video/mp4', // Can extract audio
        'video/webm',
        'video/ogg'
    ];
    return supportedFormats.includes(file.type.toLowerCase());
}

export function getOptimalLanguageCode(userLanguage?: string): string {
    const languageMap: { [key: string]: string } = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-BR',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'hi': 'hi-IN'
    };
    
    if (!userLanguage) return 'en-US';
    
    const langCode = userLanguage.split('-')[0].toLowerCase();
    return languageMap[langCode] || 'en-US';
}

// Export a default instance
export default new SpeechRecognitionProcessor();