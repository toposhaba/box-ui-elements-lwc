// Image file types that support OCR
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

// Audio file types that support transcription
const AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac'];

// Video file types that support transcription (audio will be extracted)
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];

export interface ProcessingResult {
    success: boolean;
    content?: string;
    error?: string;
    type: 'ocr' | 'transcription';
}

export interface ProcessingOptions {
    enableOCR: boolean;
    enableTranscription: boolean;
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
 * Process OCR on an image file
 * Note: This is a placeholder implementation. The actual OCR processing
 * will be implemented when the tesseract.js library is properly loaded.
 */
export function processOCR(file: File, onProgress?: (progress: number, message: string) => void): Promise<ProcessingResult> {
    return new Promise((resolve) => {
        if (!supportsOCR(file)) {
            resolve({
                success: false,
                error: 'File type not supported for OCR',
                type: 'ocr'
            });
            return;
        }

        // Placeholder implementation - will be replaced with actual OCR processing
        if (onProgress) {
            onProgress(0, 'Initializing OCR...');
        }

        setTimeout(() => {
            if (onProgress) {
                onProgress(100, 'OCR complete');
            }
            resolve({
                success: true,
                content: 'OCR processing not yet implemented - placeholder text extracted from ' + file.name,
                type: 'ocr'
            });
        }, 1000);
    });
}

/**
 * Process transcription on an audio file
 * Note: This is a placeholder implementation. The actual transcription processing
 * will be implemented when the speech recognition APIs are properly configured.
 */
export function processTranscription(file: File, onProgress?: (progress: number, message: string) => void): Promise<ProcessingResult> {
    return new Promise((resolve) => {
        if (!supportsTranscription(file)) {
            resolve({
                success: false,
                error: 'File type not supported for transcription',
                type: 'transcription'
            });
            return;
        }

        // Placeholder implementation - will be replaced with actual transcription processing
        if (onProgress) {
            onProgress(0, 'Initializing transcription...');
        }

        setTimeout(() => {
            if (onProgress) {
                onProgress(100, 'Transcription complete');
            }
            resolve({
                success: true,
                content: 'Transcription processing not yet implemented - placeholder transcript for ' + file.name,
                type: 'transcription'
            });
        }, 1500);
    });
}

/**
 * Process a file with OCR or transcription based on its type and options
 */
export function processFile(file: File, options: ProcessingOptions): Promise<ProcessingResult[]> {
    return new Promise((resolve) => {
        const results: ProcessingResult[] = [];
        const promises: Promise<ProcessingResult>[] = [];

        if (options.enableOCR && supportsOCR(file)) {
            promises.push(processOCR(file, options.onProgress));
        }

        if (options.enableTranscription && supportsTranscription(file)) {
            promises.push(processTranscription(file, options.onProgress));
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