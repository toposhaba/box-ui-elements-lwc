// Comprehensive Error Handler for Media Processing
// Provides error boundaries, recovery mechanisms, and detailed error reporting

export interface ErrorDetails {
    code: string;
    message: string;
    category: 'ocr' | 'speech' | 'media' | 'network' | 'browser' | 'user' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
    suggestions: string[];
    timestamp: Date;
    context?: any;
}

export interface ErrorHandlerConfig {
    enableLogging: boolean;
    enableRetry: boolean;
    maxRetries: number;
    retryDelay: number;
    enableFallback: boolean;
    enableReporting: boolean;
}

/**
 * Error Handler class for media processing operations
 */
export class MediaErrorHandler {
    private config: ErrorHandlerConfig;
    private errorLog: ErrorDetails[] = [];

    constructor(config: Partial<ErrorHandlerConfig> = {}) {
        this.config = {
            enableLogging: true,
            enableRetry: true,
            maxRetries: 3,
            retryDelay: 1000,
            enableFallback: true,
            enableReporting: false,
            ...config
        };
    }

    /**
     * Handle and categorize errors
     */
    handleError(error: Error | any, context?: any): ErrorDetails {
        const errorDetails = this.categorizeError(error, context);
        
        if (this.config.enableLogging) {
            this.logError(errorDetails);
        }
        
        if (this.config.enableReporting) {
            this.reportError(errorDetails);
        }
        
        return errorDetails;
    }

    /**
     * Categorize and enrich error information
     */
    private categorizeError(error: Error | any, context?: any): ErrorDetails {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        
        let category: ErrorDetails['category'] = 'system';
        let severity: ErrorDetails['severity'] = 'medium';
        let recoverable = true;
        let suggestions: string[] = [];
        let code = 'UNKNOWN_ERROR';

        // OCR-related errors
        if (this.isOCRError(message, context)) {
            category = 'ocr';
            const ocrDetails = this.analyzeOCRError(message);
            code = ocrDetails.code;
            severity = ocrDetails.severity;
            recoverable = ocrDetails.recoverable;
            suggestions = ocrDetails.suggestions;
        }
        // Speech recognition errors
        else if (this.isSpeechError(message, context)) {
            category = 'speech';
            const speechDetails = this.analyzeSpeechError(message);
            code = speechDetails.code;
            severity = speechDetails.severity;
            recoverable = speechDetails.recoverable;
            suggestions = speechDetails.suggestions;
        }
        // Media processing errors
        else if (this.isMediaError(message, context)) {
            category = 'media';
            const mediaDetails = this.analyzeMediaError(message);
            code = mediaDetails.code;
            severity = mediaDetails.severity;
            recoverable = mediaDetails.recoverable;
            suggestions = mediaDetails.suggestions;
        }
        // Network errors
        else if (this.isNetworkError(message)) {
            category = 'network';
            code = 'NETWORK_ERROR';
            severity = 'high';
            recoverable = true;
            suggestions = [
                'Check your internet connection',
                'Try again in a moment',
                'Verify that the service is available'
            ];
        }
        // Browser compatibility errors
        else if (this.isBrowserError(message)) {
            category = 'browser';
            code = 'BROWSER_COMPATIBILITY';
            severity = 'high';
            recoverable = false;
            suggestions = [
                'Update your browser to the latest version',
                'Try using a different browser',
                'Enable required browser features'
            ];
        }
        // User input errors
        else if (this.isUserError(message, context)) {
            category = 'user';
            code = 'USER_INPUT_ERROR';
            severity = 'low';
            recoverable = true;
            suggestions = [
                'Check the file format is supported',
                'Ensure the file is not corrupted',
                'Try with a different file'
            ];
        }

        return {
            code,
            message,
            category,
            severity,
            recoverable,
            suggestions,
            timestamp: new Date(),
            context: {
                ...context,
                stack,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
            }
        };
    }

    /**
     * Check if error is OCR-related
     */
    private isOCRError(message: string, context?: any): boolean {
        const ocrKeywords = ['tesseract', 'ocr', 'text recognition', 'image processing'];
        return ocrKeywords.some(keyword => message.toLowerCase().includes(keyword)) ||
               context?.type === 'ocr';
    }

    /**
     * Analyze OCR-specific errors
     */
    private analyzeOCRError(message: string): Partial<ErrorDetails> {
        if (message.includes('tesseract') && message.includes('load')) {
            return {
                code: 'TESSERACT_LOAD_FAILED',
                severity: 'high',
                recoverable: true,
                suggestions: [
                    'Check if Tesseract.js is properly included',
                    'Verify network connectivity for CDN resources',
                    'Try using fallback OCR method'
                ]
            };
        }
        
        if (message.includes('image') && message.includes('load')) {
            return {
                code: 'IMAGE_LOAD_FAILED',
                severity: 'medium',
                recoverable: true,
                suggestions: [
                    'Check if the image file is valid',
                    'Verify the image format is supported',
                    'Try with a different image'
                ]
            };
        }
        
        if (message.includes('canvas') || message.includes('context')) {
            return {
                code: 'CANVAS_ERROR',
                severity: 'high',
                recoverable: false,
                suggestions: [
                    'Canvas API not supported in this browser',
                    'Try using a modern browser',
                    'Enable hardware acceleration'
                ]
            };
        }
        
        return {
            code: 'OCR_GENERAL_ERROR',
            severity: 'medium',
            recoverable: true,
            suggestions: ['Try again with OCR processing', 'Check image quality']
        };
    }

    /**
     * Check if error is speech recognition-related
     */
    private isSpeechError(message: string, context?: any): boolean {
        const speechKeywords = ['speech', 'recognition', 'audio', 'transcription', 'microphone'];
        return speechKeywords.some(keyword => message.toLowerCase().includes(keyword)) ||
               context?.type === 'speech' || context?.type === 'transcription';
    }

    /**
     * Analyze speech recognition-specific errors
     */
    private analyzeSpeechError(message: string): Partial<ErrorDetails> {
        if (message.includes('not-allowed') || message.includes('permission')) {
            return {
                code: 'MICROPHONE_PERMISSION_DENIED',
                severity: 'high',
                recoverable: true,
                suggestions: [
                    'Grant microphone permissions',
                    'Check browser security settings',
                    'Try refreshing the page'
                ]
            };
        }
        
        if (message.includes('network') || message.includes('service-not-allowed')) {
            return {
                code: 'SPEECH_SERVICE_UNAVAILABLE',
                severity: 'high',
                recoverable: true,
                suggestions: [
                    'Check internet connection',
                    'Speech recognition service may be down',
                    'Try again later'
                ]
            };
        }
        
        if (message.includes('audio-capture') || message.includes('no-speech')) {
            return {
                code: 'AUDIO_PROCESSING_FAILED',
                severity: 'medium',
                recoverable: true,
                suggestions: [
                    'Check audio file quality',
                    'Ensure audio contains speech',
                    'Try with a different audio file'
                ]
            };
        }
        
        if (message.includes('language-not-supported')) {
            return {
                code: 'LANGUAGE_NOT_SUPPORTED',
                severity: 'medium',
                recoverable: true,
                suggestions: [
                    'Try with a supported language',
                    'Check language code format',
                    'Use fallback language (English)'
                ]
            };
        }
        
        return {
            code: 'SPEECH_GENERAL_ERROR',
            severity: 'medium',
            recoverable: true,
            suggestions: ['Try speech recognition again', 'Check audio quality']
        };
    }

    /**
     * Check if error is media processing-related
     */
    private isMediaError(message: string, context?: any): boolean {
        const mediaKeywords = ['video', 'audio', 'media', 'codec', 'format', 'metadata'];
        return mediaKeywords.some(keyword => message.toLowerCase().includes(keyword)) ||
               context?.type === 'media';
    }

    /**
     * Analyze media processing-specific errors
     */
    private analyzeMediaError(message: string): Partial<ErrorDetails> {
        if (message.includes('format') && (message.includes('not supported') || message.includes('unsupported'))) {
            return {
                code: 'UNSUPPORTED_FORMAT',
                severity: 'medium',
                recoverable: true,
                suggestions: [
                    'Convert file to supported format',
                    'Check supported file formats list',
                    'Try with a different file'
                ]
            };
        }
        
        if (message.includes('codec') || message.includes('decode')) {
            return {
                code: 'CODEC_ERROR',
                severity: 'high',
                recoverable: true,
                suggestions: [
                    'File codec not supported by browser',
                    'Try converting to standard format (MP4, WebM)',
                    'Use different browser with better codec support'
                ]
            };
        }
        
        if (message.includes('corrupted') || message.includes('invalid')) {
            return {
                code: 'CORRUPTED_FILE',
                severity: 'medium',
                recoverable: false,
                suggestions: [
                    'File appears to be corrupted',
                    'Try with a different file',
                    'Re-download or re-create the file'
                ]
            };
        }
        
        if (message.includes('too large') || message.includes('size')) {
            return {
                code: 'FILE_TOO_LARGE',
                severity: 'medium',
                recoverable: true,
                suggestions: [
                    'File size exceeds limits',
                    'Compress the file',
                    'Split into smaller segments'
                ]
            };
        }
        
        return {
            code: 'MEDIA_GENERAL_ERROR',
            severity: 'medium',
            recoverable: true,
            suggestions: ['Try media processing again', 'Check file integrity']
        };
    }

    /**
     * Check if error is network-related
     */
    private isNetworkError(message: string): boolean {
        const networkKeywords = ['network', 'fetch', 'timeout', 'connection', 'offline'];
        return networkKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    /**
     * Check if error is browser-related
     */
    private isBrowserError(message: string): boolean {
        const browserKeywords = ['not supported', 'unsupported', 'api', 'feature'];
        return browserKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    /**
     * Check if error is user input-related
     */
    private isUserError(message: string, context?: any): boolean {
        const userKeywords = ['invalid file', 'file type', 'format'];
        return userKeywords.some(keyword => message.toLowerCase().includes(keyword)) ||
               context?.userInput === true;
    }

    /**
     * Execute operation with error handling and retry logic
     */
    async executeWithErrorHandling<T>(
        operation: () => Promise<T>,
        context?: any,
        customRetries?: number
    ): Promise<{ result?: T; error?: ErrorDetails }> {
        const maxRetries = customRetries ?? this.config.maxRetries;
        let lastError: ErrorDetails | null = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                return { result };
            } catch (error) {
                lastError = this.handleError(error, { ...context, attempt });
                
                // Don't retry if not recoverable or not enabled
                if (!lastError.recoverable || !this.config.enableRetry || attempt === maxRetries) {
                    break;
                }
                
                // Wait before retry
                await this.delay(this.config.retryDelay * Math.pow(2, attempt));
            }
        }
        
        return { error: lastError! };
    }

    /**
     * Execute operation with fallback
     */
    async executeWithFallback<T>(
        primaryOperation: () => Promise<T>,
        fallbackOperation: () => Promise<T>,
        context?: any
    ): Promise<{ result?: T; error?: ErrorDetails; usedFallback?: boolean }> {
        // Try primary operation first
        const primaryResult = await this.executeWithErrorHandling(primaryOperation, context);
        
        if (primaryResult.result !== undefined) {
            return { result: primaryResult.result };
        }
        
        // If primary failed and fallback is enabled, try fallback
        if (this.config.enableFallback && primaryResult.error?.recoverable) {
            const fallbackResult = await this.executeWithErrorHandling(
                fallbackOperation, 
                { ...context, fallback: true }
            );
            
            if (fallbackResult.result !== undefined) {
                return { result: fallbackResult.result, usedFallback: true };
            }
            
            // Both failed, return the more severe error
            const error = fallbackResult.error?.severity === 'critical' ? 
                fallbackResult.error : primaryResult.error;
            return { error };
        }
        
        return { error: primaryResult.error };
    }

    /**
     * Log error details
     */
    private logError(errorDetails: ErrorDetails): void {
        this.errorLog.push(errorDetails);
        
        // Keep log size manageable
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-50);
        }
        
        // Console logging with appropriate level
        const logMethod = this.getLogMethod(errorDetails.severity);
        logMethod(`[${errorDetails.category.toUpperCase()}] ${errorDetails.code}: ${errorDetails.message}`);
        
        if (errorDetails.suggestions.length > 0) {
            console.info('Suggestions:', errorDetails.suggestions);
        }
    }

    /**
     * Get appropriate console log method based on severity
     */
    private getLogMethod(severity: ErrorDetails['severity']): typeof console.log {
        switch (severity) {
            case 'critical': return console.error;
            case 'high': return console.error;
            case 'medium': return console.warn;
            case 'low': return console.info;
            default: return console.log;
        }
    }

    /**
     * Report error to external service (placeholder)
     */
    private reportError(errorDetails: ErrorDetails): void {
        // In a real implementation, this would send to an error tracking service
        if (errorDetails.severity === 'critical' || errorDetails.severity === 'high') {
            console.warn('Error reported to monitoring service:', errorDetails.code);
        }
    }

    /**
     * Get error statistics
     */
    getErrorStatistics(): {
        total: number;
        byCategory: Record<string, number>;
        bySeverity: Record<string, number>;
        recent: ErrorDetails[];
    } {
        const byCategory: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};
        
        this.errorLog.forEach(error => {
            byCategory[error.category] = (byCategory[error.category] || 0) + 1;
            bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
        });
        
        return {
            total: this.errorLog.length,
            byCategory,
            bySeverity,
            recent: this.errorLog.slice(-10)
        };
    }

    /**
     * Clear error log
     */
    clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * Delay utility for retries
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate user-friendly error message
     */
    getUserFriendlyMessage(errorDetails: ErrorDetails): string {
        const baseMessage = `${errorDetails.category} error: ${errorDetails.message}`;
        
        if (errorDetails.suggestions.length > 0) {
            return `${baseMessage}\n\nSuggestions:\n${errorDetails.suggestions.map(s => `• ${s}`).join('\n')}`;
        }
        
        return baseMessage;
    }
}

// Utility functions
export function createErrorBoundary(
    errorHandler: MediaErrorHandler,
    context?: any
) {
    return (error: Error) => {
        const errorDetails = errorHandler.handleError(error, context);
        return errorDetails;
    };
}

export function isRecoverableError(error: ErrorDetails): boolean {
    return error.recoverable && error.severity !== 'critical';
}

export function shouldRetry(error: ErrorDetails, attempt: number, maxRetries: number): boolean {
    return error.recoverable && attempt < maxRetries && error.severity !== 'critical';
}

// Export a default instance
export default new MediaErrorHandler();