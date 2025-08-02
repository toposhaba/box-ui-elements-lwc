// Image file types that support OCR
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

// Audio file types that support transcription
const AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac'];

// Video file types that support transcription (audio will be extracted)
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];

// Import the media preprocessor
import mediaPreprocessor, { MediaPreprocessorOptions, MediaPreprocessorResult } from './mediaPreprocessor';
// Import the real processors
import ocrProcessor, { OCROptions } from './ocrProcessor';
import speechProcessor, { SpeechRecognitionOptions } from './speechRecognitionProcessor';

export interface ProcessingResult {
    success: boolean;
    content?: string;
    error?: string;
    type: 'ocr' | 'transcription' | 'media_preprocessing';
    metadata?: any;
    processedFile?: Blob;
    audioData?: Float32Array;
}

export interface ProcessingOptions {
    enableOCR: boolean;
    enableTranscription: boolean;
    enableMediaPreprocessing?: boolean;
    mediaOptions?: MediaPreprocessorOptions;
    ocrOptions?: OCROptions;
    speechOptions?: SpeechRecognitionOptions;
    onProgress?: (progress: number, message: string) => void;
}

/**
 * Check if a file supports OCR processing
 */
export function supportsOCR(file: File): boolean {
    return IMAGE_TYPES.indexOf(file.type.toLowerCase()) !== -1;
}

/**
 * Check if a file supports transcription processing
 */
export function supportsTranscription(file: File): boolean {
    return AUDIO_TYPES.indexOf(file.type.toLowerCase()) !== -1 || VIDEO_TYPES.indexOf(file.type.toLowerCase()) !== -1;
}

/**
 * Check if a file supports media preprocessing
 */
export function supportsMediaPreprocessing(file: File): boolean {
    return AUDIO_TYPES.indexOf(file.type.toLowerCase()) !== -1 || VIDEO_TYPES.indexOf(file.type.toLowerCase()) !== -1;
}

/**
 * Process OCR on an image file using real OCR processor
 */
export function processOCR(file: File, options?: OCROptions, onProgress?: (progress: number, message: string) => void): Promise<ProcessingResult> {
    return new Promise(async (resolve) => {
        if (!supportsOCR(file)) {
            resolve({
                success: false,
                error: 'File type not supported for OCR',
                type: 'ocr'
            });
            return;
        }

        try {
            const ocrOptions: OCROptions = {
                ...options,
                onProgress
            };

            const result = await ocrProcessor.processOCR(file, ocrOptions);
            
            resolve({
                success: result.success,
                content: result.text,
                error: result.error,
                type: 'ocr',
                metadata: {
                    confidence: result.confidence,
                    words: result.words
                }
            });
        } catch (error) {
            resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown OCR error',
                type: 'ocr'
            });
        }
    });
}

/**
 * Process transcription on an audio/video file using media preprocessor
 */
export function processTranscription(file: File, onProgress?: (progress: number, message: string) => void): Promise<ProcessingResult> {
    return new Promise(async (resolve) => {
        if (!supportsTranscription(file)) {
            resolve({
                success: false,
                error: 'File type not supported for transcription',
                type: 'transcription'
            });
            return;
        }

        try {
            if (onProgress) {
                onProgress(0, 'Initializing transcription...');
            }

            // Use media preprocessor to extract audio data first
            const mediaOptions: MediaPreprocessorOptions = {
                extractMetadata: true,
                extractAudio: file.type.startsWith('video/'),
                onProgress: (progress, message) => {
                    if (onProgress) {
                        onProgress(progress * 0.5, `Preprocessing: ${message}`);
                    }
                }
            };

            const preprocessResult = await mediaPreprocessor.processMediaFile(file, mediaOptions);
            
            if (!preprocessResult.success) {
                resolve({
                    success: false,
                    error: preprocessResult.error || 'Media preprocessing failed',
                    type: 'transcription'
                });
                return;
            }

            if (onProgress) {
                onProgress(50, 'Media preprocessing complete, starting transcription...');
            }

            // Use real speech recognition processor
            try {
                const audioFile = preprocessResult.processedFile ? 
                    new File([preprocessResult.processedFile], file.name.replace(/\.[^/.]+$/, '.wav'), { type: 'audio/wav' }) : 
                    file;

                const speechOptions: SpeechRecognitionOptions = {
                    language: 'en-US',
                    onProgress: (progress, message) => {
                        if (onProgress) {
                            onProgress(50 + (progress * 0.5), `Transcription: ${message}`);
                        }
                    }
                };

                const transcriptionResult = await speechProcessor.processAudioFile(audioFile, speechOptions);
                
                if (onProgress) {
                    onProgress(100, 'Transcription complete');
                }

                resolve({
                    success: transcriptionResult.success,
                    content: transcriptionResult.transcript || `Transcription failed for ${file.name}`,
                    type: 'transcription',
                    metadata: {
                        ...preprocessResult.metadata,
                        confidence: transcriptionResult.confidence,
                        segments: transcriptionResult.segments,
                        language: transcriptionResult.language
                    },
                    processedFile: preprocessResult.processedFile,
                    audioData: preprocessResult.audioData
                });
            } catch (transcriptionError) {
                // Fallback to metadata-only result
                if (onProgress) {
                    onProgress(100, 'Transcription failed, returning metadata');
                }
                resolve({
                    success: true,
                    content: `Audio processed: ${file.name}. Duration: ${preprocessResult.metadata?.duration?.toFixed(2)}s. Transcription failed: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`,
                    type: 'transcription',
                    metadata: preprocessResult.metadata,
                    processedFile: preprocessResult.processedFile,
                    audioData: preprocessResult.audioData
                });
            }

        } catch (error) {
            resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown transcription error',
                type: 'transcription'
            });
        }
    });
}

/**
 * Process media file with preprocessing
 */
export function processMediaPreprocessing(file: File, options: MediaPreprocessorOptions, onProgress?: (progress: number, message: string) => void): Promise<ProcessingResult> {
    return new Promise(async (resolve) => {
        if (!supportsMediaPreprocessing(file)) {
            resolve({
                success: false,
                error: 'File type not supported for media preprocessing',
                type: 'media_preprocessing'
            });
            return;
        }

        try {
            const mediaOptions: MediaPreprocessorOptions = {
                ...options,
                onProgress
            };

            const result = await mediaPreprocessor.processMediaFile(file, mediaOptions);
            
            resolve({
                success: result.success,
                content: result.success ? `Media preprocessing completed for ${file.name}` : undefined,
                error: result.error,
                type: 'media_preprocessing',
                metadata: result.metadata,
                processedFile: result.processedFile,
                audioData: result.audioData
            });

        } catch (error) {
            resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown media preprocessing error',
                type: 'media_preprocessing'
            });
        }
    });
}

/**
 * Process a file with OCR, transcription, or media preprocessing based on its type and options
 */
export function processFile(file: File, options: ProcessingOptions): Promise<ProcessingResult[]> {
    return new Promise((resolve) => {
        const results: ProcessingResult[] = [];
        const promises: Promise<ProcessingResult>[] = [];

        if (options.enableOCR && supportsOCR(file)) {
            promises.push(processOCR(file, options.ocrOptions, options.onProgress));
        }

        if (options.enableTranscription && supportsTranscription(file)) {
            promises.push(processTranscription(file, options.onProgress));
        }

        if (options.enableMediaPreprocessing && supportsMediaPreprocessing(file) && options.mediaOptions) {
            promises.push(processMediaPreprocessing(file, options.mediaOptions, options.onProgress));
        }

        if (promises.length === 0) {
            resolve(results);
            return;
        }

        Promise.all(promises).then((processingResults) => {
            resolve(processingResults);
        }).catch((error) => {
            resolve([{
                success: false,
                error: error instanceof Error ? error.message : 'Unknown processing error',
                type: 'ocr'
            }]);
        });
    });
}

/**
 * Process multiple files with OCR or transcription
 */
export function processFiles(files: File[], options: ProcessingOptions): Promise<Map<string, ProcessingResult[]>> {
    return new Promise((resolve) => {
        const results = new Map<string, ProcessingResult[]>();
        const promises: Promise<void>[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const promise = processFile(file, options).then((fileResults) => {
                if (fileResults.length > 0) {
                    results.set(file.name, fileResults);
                }
            });
            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            resolve(results);
        }).catch(() => {
            resolve(results);
        });
    });
}