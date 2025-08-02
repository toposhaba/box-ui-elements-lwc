// Media Preprocessor Usage Examples
// This file demonstrates how to use the media preprocessors for various tasks

import mediaPreprocessor, { MediaPreprocessorOptions } from './mediaPreprocessor';
import advancedMediaPreprocessor, { AdvancedMediaOptions } from './advancedMediaPreprocessor';
import { processFile, ProcessingOptions } from './contentProcessing';

/**
 * Example 1: Basic video metadata extraction
 */
export async function extractVideoMetadata(videoFile: File) {
    console.log('Extracting metadata from:', videoFile.name);
    
    try {
        const metadata = await mediaPreprocessor.extractMetadata(videoFile);
        console.log('Video metadata:', {
            duration: `${metadata.duration.toFixed(2)}s`,
            resolution: `${metadata.width}x${metadata.height}`,
            size: `${(metadata.size / 1024 / 1024).toFixed(2)}MB`,
            format: metadata.format
        });
        return metadata;
    } catch (error) {
        console.error('Failed to extract metadata:', error);
        throw error;
    }
}

/**
 * Example 2: Extract audio from video with progress tracking
 */
export async function extractAudioFromVideo(videoFile: File) {
    console.log('Extracting audio from video:', videoFile.name);
    
    const options: MediaPreprocessorOptions = {
        extractAudio: true,
        onProgress: (progress, message) => {
            console.log(`Progress: ${progress}% - ${message}`);
        }
    };
    
    try {
        const audioBlob = await mediaPreprocessor.extractAudioFromVideo(videoFile, options);
        console.log('Audio extracted successfully:', {
            size: `${(audioBlob.size / 1024 / 1024).toFixed(2)}MB`,
            type: audioBlob.type
        });
        return audioBlob;
    } catch (error) {
        console.error('Failed to extract audio:', error);
        throw error;
    }
}

/**
 * Example 3: Convert audio format
 */
export async function convertAudioFormat(audioFile: File, targetFormat: string) {
    console.log(`Converting ${audioFile.name} to ${targetFormat}`);
    
    const options: MediaPreprocessorOptions = {
        targetSampleRate: 44100,
        onProgress: (progress, message) => {
            console.log(`Conversion progress: ${progress}% - ${message}`);
        }
    };
    
    try {
        const convertedBlob = await mediaPreprocessor.convertAudioFormat(audioFile, targetFormat, options);
        console.log('Audio converted successfully:', {
            originalSize: `${(audioFile.size / 1024 / 1024).toFixed(2)}MB`,
            convertedSize: `${(convertedBlob.size / 1024 / 1024).toFixed(2)}MB`,
            targetFormat
        });
        return convertedBlob;
    } catch (error) {
        console.error('Failed to convert audio:', error);
        throw error;
    }
}

/**
 * Example 4: Complete media processing workflow
 */
export async function processMediaFile(file: File) {
    console.log('Starting complete media processing for:', file.name);
    
    const options: MediaPreprocessorOptions = {
        extractMetadata: true,
        extractAudio: file.type.startsWith('video/'),
        onProgress: (progress, message) => {
            console.log(`Processing: ${progress}% - ${message}`);
        }
    };
    
    try {
        const result = await mediaPreprocessor.processMediaFile(file, options);
        
        if (result.success) {
            console.log('Media processing completed successfully:', {
                metadata: result.metadata,
                hasProcessedFile: !!result.processedFile,
                hasAudioData: !!result.audioData,
                audioDataLength: result.audioData?.length
            });
        } else {
            console.error('Media processing failed:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to process media file:', error);
        throw error;
    }
}

/**
 * Example 5: Advanced video processing with FFmpeg-like features
 */
export async function advancedVideoProcessing(videoFile: File) {
    console.log('Starting advanced video processing for:', videoFile.name);
    
    const options: AdvancedMediaOptions = {
        extractMetadata: true,
        extractAudio: true,
        outputFormat: 'video/webm',
        videoCodec: 'vp9',
        audioCodec: 'opus',
        resolution: '1280x720',
        enableNoiseReduction: true,
        enableVolumeNormalization: true,
        trimStart: 5, // Start from 5 seconds
        trimEnd: 60,  // End at 60 seconds
        fadeIn: 1,    // 1 second fade in
        fadeOut: 2,   // 2 second fade out
        onProgress: (progress, message) => {
            console.log(`Advanced processing: ${progress}% - ${message}`);
        }
    };
    
    try {
        const result = await advancedMediaPreprocessor.processVideoAdvanced(videoFile, options);
        
        if (result.success) {
            console.log('Advanced video processing completed:', {
                metadata: result.metadata,
                thumbnailCount: result.thumbnails?.length,
                hasProcessedFile: !!result.processedFile,
                processedFileSize: result.processedFile ? 
                    `${(result.processedFile.size / 1024 / 1024).toFixed(2)}MB` : 'N/A'
            });
        } else {
            console.error('Advanced processing failed:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to process video with advanced options:', error);
        throw error;
    }
}

/**
 * Example 6: Generate video thumbnails
 */
export async function generateVideoThumbnails(videoFile: File, count: number = 5) {
    console.log(`Generating ${count} thumbnails for:`, videoFile.name);
    
    try {
        const thumbnails = await advancedMediaPreprocessor.generateThumbnails(videoFile, count);
        console.log(`Generated ${thumbnails.length} thumbnails:`, 
            thumbnails.map((thumb, index) => ({
                index,
                size: `${(thumb.size / 1024).toFixed(2)}KB`,
                type: thumb.type
            }))
        );
        return thumbnails;
    } catch (error) {
        console.error('Failed to generate thumbnails:', error);
        throw error;
    }
}

/**
 * Example 7: Integration with content processing system
 */
export async function integratedProcessing(files: File[]) {
    console.log('Processing multiple files with integrated system');
    
    const results = [];
    
    for (const file of files) {
        console.log(`Processing file: ${file.name} (${file.type})`);
        
        const options: ProcessingOptions = {
            enableOCR: file.type.startsWith('image/'),
            enableTranscription: file.type.startsWith('audio/') || file.type.startsWith('video/'),
            enableMediaPreprocessing: file.type.startsWith('audio/') || file.type.startsWith('video/'),
            mediaOptions: {
                extractMetadata: true,
                extractAudio: file.type.startsWith('video/'),
                convertToFormat: file.type.startsWith('audio/') ? 'wav' : undefined,
            },
            onProgress: (progress, message) => {
                console.log(`${file.name}: ${progress}% - ${message}`);
            }
        };
        
        try {
            const fileResults = await processFile(file, options);
            results.push({
                filename: file.name,
                results: fileResults
            });
            
            console.log(`Completed processing ${file.name}:`, 
                fileResults.map(r => ({ type: r.type, success: r.success }))
            );
        } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
            results.push({
                filename: file.name,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    
    return results;
}

/**
 * Example 8: Batch processing with different options per file type
 */
export async function batchMediaProcessing(files: File[]) {
    console.log(`Starting batch processing of ${files.length} files`);
    
    const videoFiles = files.filter(f => f.type.startsWith('video/'));
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    
    const results = {
        videos: [] as any[],
        audio: [] as any[]
    };
    
    // Process videos with advanced options
    for (const videoFile of videoFiles) {
        try {
            const result = await advancedVideoProcessing(videoFile);
            results.videos.push({ file: videoFile.name, result });
        } catch (error) {
            results.videos.push({ file: videoFile.name, error });
        }
    }
    
    // Process audio files with basic options
    for (const audioFile of audioFiles) {
        try {
            const result = await processMediaFile(audioFile);
            results.audio.push({ file: audioFile.name, result });
        } catch (error) {
            results.audio.push({ file: audioFile.name, error });
        }
    }
    
    console.log('Batch processing completed:', {
        videosProcessed: results.videos.length,
        audioProcessed: results.audio.length,
        totalFiles: files.length
    });
    
    return results;
}

/**
 * Example 9: Error handling and fallback processing
 */
export async function robustMediaProcessing(file: File) {
    console.log('Starting robust processing with fallbacks for:', file.name);
    
    // Try advanced processing first
    try {
        if (file.type.startsWith('video/')) {
            const result = await advancedVideoProcessing(file);
            if (result.success) {
                console.log('Advanced processing succeeded');
                return result;
            }
        }
    } catch (error) {
        console.warn('Advanced processing failed, falling back to basic processing:', error);
    }
    
    // Fallback to basic processing
    try {
        const result = await processMediaFile(file);
        if (result.success) {
            console.log('Basic processing succeeded');
            return result;
        }
    } catch (error) {
        console.warn('Basic processing failed, trying metadata extraction only:', error);
    }
    
    // Final fallback - metadata only
    try {
        const metadata = await mediaPreprocessor.extractMetadata(file);
        console.log('Metadata extraction succeeded');
        return {
            success: true,
            metadata,
            type: 'metadata_only'
        };
    } catch (error) {
        console.error('All processing methods failed:', error);
        return {
            success: false,
            error: 'All processing methods failed',
            type: 'failed'
        };
    }
}

/**
 * Example 10: Performance monitoring and optimization
 */
export async function performanceOptimizedProcessing(files: File[]) {
    console.log('Starting performance-optimized processing');
    
    const startTime = performance.now();
    const results = [];
    
    // Process files in parallel batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
        
        const batchPromises = batch.map(async (file) => {
            const fileStartTime = performance.now();
            try {
                const result = await robustMediaProcessing(file);
                const processingTime = performance.now() - fileStartTime;
                return {
                    filename: file.name,
                    result,
                    processingTime: Math.round(processingTime)
                };
            } catch (error) {
                const processingTime = performance.now() - fileStartTime;
                return {
                    filename: file.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    processingTime: Math.round(processingTime)
                };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches to prevent overwhelming the browser
        if (i + batchSize < files.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const totalTime = performance.now() - startTime;
    
    console.log('Performance-optimized processing completed:', {
        totalFiles: files.length,
        totalTime: Math.round(totalTime),
        averageTimePerFile: Math.round(totalTime / files.length),
        successCount: results.filter(r => !r.error).length,
        errorCount: results.filter(r => r.error).length
    });
    
    return {
        results,
        performance: {
            totalTime: Math.round(totalTime),
            averageTimePerFile: Math.round(totalTime / files.length),
            successRate: (results.filter(r => !r.error).length / results.length) * 100
        }
    };
}

// Export all examples for easy use
export const examples = {
    extractVideoMetadata,
    extractAudioFromVideo,
    convertAudioFormat,
    processMediaFile,
    advancedVideoProcessing,
    generateVideoThumbnails,
    integratedProcessing,
    batchMediaProcessing,
    robustMediaProcessing,
    performanceOptimizedProcessing
};

export default examples;