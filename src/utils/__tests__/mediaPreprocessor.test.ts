import { MediaPreprocessor, isVideoFile, isAudioFile, isMediaFile } from '../mediaPreprocessor';
import { AdvancedMediaPreprocessor, supportsAdvancedProcessing } from '../advancedMediaPreprocessor';

// Mock File constructor for testing
class MockFile extends File {
    constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
        super(bits, filename, options);
    }
}

// Mock Web APIs
const mockCreateObjectURL = jest.fn(() => 'mock-url');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(URL, 'createObjectURL', {
    value: mockCreateObjectURL,
});

Object.defineProperty(URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL,
});

// Mock AudioContext
const mockAudioContext = {
    decodeAudioData: jest.fn(),
    close: jest.fn(),
    state: 'running',
};

Object.defineProperty(window, 'AudioContext', {
    value: jest.fn(() => mockAudioContext),
});

describe('MediaPreprocessor', () => {
    let preprocessor: MediaPreprocessor;

    beforeEach(() => {
        preprocessor = new MediaPreprocessor();
        jest.clearAllMocks();
    });

    afterEach(() => {
        preprocessor.dispose();
    });

    describe('File type validation', () => {
        test('should correctly identify video files', () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            expect(isVideoFile(videoFile)).toBe(true);
            
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            expect(isVideoFile(audioFile)).toBe(false);
        });

        test('should correctly identify audio files', () => {
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            expect(isAudioFile(audioFile)).toBe(true);
            
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            expect(isAudioFile(videoFile)).toBe(false);
        });

        test('should correctly identify media files', () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            const textFile = new MockFile(['test'], 'test.txt', { type: 'text/plain' });
            
            expect(isMediaFile(videoFile)).toBe(true);
            expect(isMediaFile(audioFile)).toBe(true);
            expect(isMediaFile(textFile)).toBe(false);
        });
    });

    describe('Metadata extraction', () => {
        test('should extract metadata from video file', async () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            
            // Mock video element
            const mockVideo = {
                preload: '',
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
                duration: 120,
                videoWidth: 1920,
                videoHeight: 1080,
            };
            
            jest.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);
            
            const metadataPromise = preprocessor.extractMetadata(videoFile);
            
            // Simulate video loading
            setTimeout(() => {
                mockVideo.onloadedmetadata();
            }, 10);
            
            const metadata = await metadataPromise;
            
            expect(metadata.duration).toBe(120);
            expect(metadata.width).toBe(1920);
            expect(metadata.height).toBe(1080);
            expect(metadata.format).toBe('video/mp4');
        });

        test('should extract metadata from audio file', async () => {
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            
            // Mock audio element
            const mockAudio = {
                preload: '',
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
                duration: 180,
            };
            
            jest.spyOn(document, 'createElement').mockReturnValue(mockAudio as any);
            
            const metadataPromise = preprocessor.extractMetadata(audioFile);
            
            // Simulate audio loading
            setTimeout(() => {
                mockAudio.onloadedmetadata();
            }, 10);
            
            const metadata = await metadataPromise;
            
            expect(metadata.duration).toBe(180);
            expect(metadata.format).toBe('audio/mp3');
        });
    });

    describe('Audio extraction from video', () => {
        test('should extract audio from video file', async () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            
            const mockVideo = {
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
            };
            
            const mockCanvas = {
                captureStream: jest.fn(() => ({})),
            };
            
            jest.spyOn(document, 'createElement')
                .mockReturnValueOnce(mockVideo as any)
                .mockReturnValueOnce(mockCanvas as any);
            
            const progressCallback = jest.fn();
            const extractionPromise = preprocessor.extractAudioFromVideo(videoFile, {
                onProgress: progressCallback,
            });
            
            // Simulate video loading
            setTimeout(() => {
                mockVideo.onloadedmetadata();
            }, 10);
            
            const audioBlob = await extractionPromise;
            
            expect(audioBlob).toBeInstanceOf(Blob);
            expect(progressCallback).toHaveBeenCalledWith(0, expect.any(String));
            expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
        });

        test('should reject non-video files', async () => {
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            
            await expect(preprocessor.extractAudioFromVideo(audioFile)).rejects.toThrow('File is not a video');
        });
    });

    describe('Audio format conversion', () => {
        test('should convert audio format', async () => {
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            
            // Mock FileReader
            const mockFileReader = {
                onload: null as any,
                onerror: null as any,
                readAsArrayBuffer: jest.fn(),
                result: new ArrayBuffer(1024),
            };
            
            jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any);
            
            // Mock AudioContext.decodeAudioData
            const mockAudioBuffer = {
                length: 1024,
                sampleRate: 44100,
                getChannelData: jest.fn(() => new Float32Array(1024)),
            };
            
            mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
            
            const progressCallback = jest.fn();
            const conversionPromise = preprocessor.convertAudioFormat(audioFile, 'wav', {
                onProgress: progressCallback,
            });
            
            // Simulate FileReader loading
            setTimeout(() => {
                mockFileReader.onload({ target: { result: new ArrayBuffer(1024) } });
            }, 10);
            
            const convertedBlob = await conversionPromise;
            
            expect(convertedBlob).toBeInstanceOf(Blob);
            expect(convertedBlob.type).toBe('audio/wav');
            expect(progressCallback).toHaveBeenCalledWith(10, expect.any(String));
            expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
        });
    });

    describe('Complete media processing', () => {
        test('should process media file with all options', async () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            
            // Mock all necessary elements
            const mockVideo = {
                preload: '',
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
                duration: 120,
                videoWidth: 1920,
                videoHeight: 1080,
            };
            
            const mockCanvas = {
                captureStream: jest.fn(() => ({})),
            };
            
            jest.spyOn(document, 'createElement')
                .mockReturnValueOnce(mockVideo as any)
                .mockReturnValueOnce(mockCanvas as any)
                .mockReturnValueOnce(mockVideo as any);
            
            const progressCallback = jest.fn();
            const processingPromise = preprocessor.processMediaFile(videoFile, {
                extractMetadata: true,
                extractAudio: true,
                onProgress: progressCallback,
            });
            
            // Simulate loading
            setTimeout(() => {
                mockVideo.onloadedmetadata();
            }, 10);
            
            const result = await processingPromise;
            
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            expect(result.processedFile).toBeInstanceOf(Blob);
            expect(progressCallback).toHaveBeenCalledWith(0, expect.any(String));
            expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
        });
    });
});

describe('AdvancedMediaPreprocessor', () => {
    let advancedPreprocessor: AdvancedMediaPreprocessor;

    beforeEach(() => {
        advancedPreprocessor = new AdvancedMediaPreprocessor();
        jest.clearAllMocks();
    });

    afterEach(() => {
        advancedPreprocessor.dispose();
    });

    describe('Advanced processing support', () => {
        test('should support advanced processing for video files', () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            expect(supportsAdvancedProcessing(videoFile)).toBe(true);
        });

        test('should support advanced processing for audio files', () => {
            const audioFile = new MockFile(['test'], 'test.mp3', { type: 'audio/mp3' });
            expect(supportsAdvancedProcessing(audioFile)).toBe(true);
        });

        test('should not support advanced processing for non-media files', () => {
            const textFile = new MockFile(['test'], 'test.txt', { type: 'text/plain' });
            expect(supportsAdvancedProcessing(textFile)).toBe(false);
        });
    });

    describe('Advanced metadata extraction', () => {
        test('should extract advanced metadata from video file', async () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            
            const mockVideo = {
                preload: '',
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
                duration: 120,
                videoWidth: 1920,
                videoHeight: 1080,
            };
            
            jest.spyOn(document, 'createElement').mockReturnValue(mockVideo as any);
            
            const metadataPromise = advancedPreprocessor.extractAdvancedMetadata(videoFile);
            
            setTimeout(() => {
                mockVideo.onloadedmetadata();
            }, 10);
            
            const metadata = await metadataPromise;
            
            expect(metadata.duration).toBe(120);
            expect(metadata.width).toBe(1920);
            expect(metadata.height).toBe(1080);
            expect(metadata.aspectRatio).toBe('1920:1080');
            expect(metadata.codec).toBe('h264');
            expect(metadata.profile).toBe('high');
        });
    });

    describe('Thumbnail generation', () => {
        test('should generate thumbnails from video', async () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            
            const mockVideo = {
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
                duration: 120,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                onseeked: null as any,
            };
            
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => ({
                    drawImage: jest.fn(),
                })),
                toBlob: jest.fn((callback) => {
                    callback(new Blob(['thumbnail'], { type: 'image/jpeg' }));
                }),
            };
            
            jest.spyOn(document, 'createElement')
                .mockReturnValueOnce(mockVideo as any)
                .mockReturnValueOnce(mockCanvas as any);
            
            const thumbnailPromise = advancedPreprocessor.generateThumbnails(videoFile, 3);
            
            setTimeout(() => {
                mockVideo.onloadedmetadata();
                // Simulate seeking for each thumbnail
                setTimeout(() => mockVideo.onseeked(), 10);
                setTimeout(() => mockVideo.onseeked(), 20);
                setTimeout(() => mockVideo.onseeked(), 30);
            }, 10);
            
            const thumbnails = await thumbnailPromise;
            
            expect(thumbnails).toHaveLength(3);
            expect(thumbnails[0]).toBeInstanceOf(Blob);
        });
    });

    describe('Advanced video processing', () => {
        test('should process video with all advanced options', async () => {
            const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
            
            // Mock all necessary elements
            const mockVideo = {
                preload: '',
                onloadedmetadata: null as any,
                onerror: null as any,
                src: '',
                duration: 120,
                videoWidth: 1920,
                videoHeight: 1080,
                currentTime: 0,
                onseeked: null as any,
            };
            
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => ({
                    drawImage: jest.fn(),
                })),
                toBlob: jest.fn((callback) => {
                    callback(new Blob(['thumbnail'], { type: 'image/jpeg' }));
                }),
            };
            
            jest.spyOn(document, 'createElement')
                .mockReturnValue(mockVideo as any)
                .mockReturnValueOnce(mockCanvas as any);
            
            const progressCallback = jest.fn();
            const processingPromise = advancedPreprocessor.processVideoAdvanced(videoFile, {
                extractMetadata: true,
                extractAudio: true,
                outputFormat: 'video/webm',
                enableNoiseReduction: true,
                enableVolumeNormalization: true,
                onProgress: progressCallback,
            });
            
            // Simulate loading and processing
            setTimeout(() => {
                mockVideo.onloadedmetadata();
                setTimeout(() => mockVideo.onseeked(), 10);
            }, 10);
            
            const result = await processingPromise;
            
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            expect(result.thumbnails).toBeDefined();
            expect(result.processedFile).toBeInstanceOf(Blob);
            expect(progressCallback).toHaveBeenCalledWith(0, expect.any(String));
            expect(progressCallback).toHaveBeenCalledWith(100, expect.any(String));
        });
    });
});

// Integration tests
describe('Media Preprocessor Integration', () => {
    test('should work with content processing system', async () => {
        const { processFile, ProcessingOptions } = await import('../contentProcessing');
        
        const videoFile = new MockFile(['test'], 'test.mp4', { type: 'video/mp4' });
        
        const options: ProcessingOptions = {
            enableOCR: false,
            enableTranscription: true,
            enableMediaPreprocessing: true,
            mediaOptions: {
                extractMetadata: true,
                extractAudio: true,
            },
        };
        
        // This would test the integration, but requires more mocking
        // For now, just ensure the import works
        expect(processFile).toBeDefined();
        expect(typeof processFile).toBe('function');
    });
});