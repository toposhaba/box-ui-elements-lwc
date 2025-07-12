# OCR and Transcription Implementation for Box UI Elements Uploader

This document describes the implementation of OCR (Optical Character Recognition) and transcription functionality added to the Box UI Elements content uploader.

## Overview

The implementation adds the ability to:
1. **OCR Processing**: Extract text from image files using Tesseract.js
2. **Transcription**: Convert audio/video files to text using Web Speech API and FFmpeg for audio extraction
3. **UI Controls**: Checkboxes to enable/disable OCR and transcription features
4. **File Type Support**: Automatic detection of supported file types

## Files Modified

### 1. `package.json`
Added new dependencies:
- `tesseract.js`: ^5.1.0 (OCR processing)
- `@ffmpeg/ffmpeg`: ^0.12.8 (Video processing)
- `@ffmpeg/core`: ^0.12.4 (FFmpeg core)
- `@ffmpeg/util`: ^0.12.1 (FFmpeg utilities)

### 2. `src/elements/common/messages.js`
Added internationalization messages:
- `enableOCR`: "Enable OCR for images"
- `enableTranscription`: "Enable transcription for audio/video"
- `processingOCR`: "Processing OCR..."
- `processingTranscription`: "Processing transcription..."
- `ocrComplete`: "OCR processing complete"
- `transcriptionComplete`: "Transcription processing complete"
- `ocrError`: "OCR processing failed"
- `transcriptionError`: "Transcription processing failed"

### 3. `src/utils/contentProcessing.ts`
New utility module with:
- File type detection functions
- OCR processing using Tesseract.js
- Transcription processing using Web Speech API
- Audio extraction from video files using FFmpeg
- Processing orchestration functions

### 4. `src/elements/content-uploader/ProcessingOptions.scss`
New CSS styles for the processing options UI:
- Checkbox styling
- Processing status indicators
- Options container styling

### 5. `src/elements/content-uploader/UploadStateContent.tsx`
Updated to include:
- OCR and transcription checkbox controls
- Props for enabling/disabling features
- Event handlers for checkbox changes

### 6. `src/elements/content-uploader/UploadState.tsx`
Updated to pass through OCR/transcription props to child components.

### 7. `src/elements/content-uploader/DroppableContent.tsx`
Updated to pass through OCR/transcription props from parent to child components.

### 8. `src/elements/content-uploader/ContentUploader.tsx`
Main component updates:
- Added OCR/transcription props to interface
- Added state management for OCR/transcription settings
- Added processing hooks before file upload
- Added event handlers for checkbox changes

## Supported File Types

### OCR (Images)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

### Transcription (Audio/Video)
- **Audio**: MP3, WAV, OGG, M4A, AAC, FLAC
- **Video**: MP4, WebM, OGG, AVI, MOV, WMV (audio extracted first)

## Usage

### Basic Usage

```tsx
import { ContentUploader } from '@box/ui-elements';

<ContentUploader
  // ... other props
  enableOCR={true}
  enableTranscription={true}
  onOCRChange={(enabled) => console.log('OCR enabled:', enabled)}
  onTranscriptionChange={(enabled) => console.log('Transcription enabled:', enabled)}
/>
```

### Advanced Usage with Processing Results

```tsx
import { ContentUploader } from '@box/ui-elements';
import { processFile } from '@box/ui-elements/utils/contentProcessing';

const handleFileProcessing = async (files) => {
  const results = await processFile(files[0], {
    enableOCR: true,
    enableTranscription: true,
    onProgress: (progress, message) => {
      console.log(`${progress}%: ${message}`);
    }
  });
  
  results.forEach(result => {
    if (result.success) {
      console.log(`${result.type} result:`, result.content);
    } else {
      console.error(`${result.type} error:`, result.error);
    }
  });
};

<ContentUploader
  // ... other props
  enableOCR={true}
  enableTranscription={true}
  onBeforeUpload={handleFileProcessing}
/>
```

## API Reference

### Props

#### ContentUploader Props
- `enableOCR?: boolean` - Enable OCR processing for images
- `enableTranscription?: boolean` - Enable transcription for audio/video
- `onOCRChange?: (enabled: boolean) => void` - Callback when OCR setting changes
- `onTranscriptionChange?: (enabled: boolean) => void` - Callback when transcription setting changes

#### Processing Functions
- `supportsOCR(file: File): boolean` - Check if file supports OCR
- `supportsTranscription(file: File): boolean` - Check if file supports transcription
- `processOCR(file: File, onProgress?: Function): Promise<ProcessingResult>` - Process OCR
- `processTranscription(file: File, onProgress?: Function): Promise<ProcessingResult>` - Process transcription
- `processFile(file: File, options: ProcessingOptions): Promise<ProcessingResult[]>` - Process single file
- `processFiles(files: File[], options: ProcessingOptions): Promise<Map<string, ProcessingResult[]>>` - Process multiple files

### Types

```typescript
interface ProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
  type: 'ocr' | 'transcription';
}

interface ProcessingOptions {
  enableOCR: boolean;
  enableTranscription: boolean;
  onProgress?: (progress: number, message: string) => void;
}
```

## Implementation Notes

### Current Status
- **UI Integration**: ✅ Complete
- **Basic Structure**: ✅ Complete
- **OCR Processing**: ⚠️ Placeholder implementation (needs actual Tesseract.js integration)
- **Transcription**: ⚠️ Placeholder implementation (needs actual Web Speech API integration)
- **Audio Extraction**: ⚠️ Placeholder implementation (needs actual FFmpeg integration)

### Next Steps
1. **Install Dependencies**: Run `yarn install` to install the required packages
2. **Implement OCR**: Replace placeholder OCR implementation with actual Tesseract.js integration
3. **Implement Transcription**: Replace placeholder transcription with actual Web Speech API integration
4. **Implement Audio Extraction**: Replace placeholder audio extraction with actual FFmpeg integration
5. **Error Handling**: Add comprehensive error handling and user feedback
6. **Testing**: Add unit tests for all new functionality
7. **Performance**: Add optimization for large files and batch processing

### Browser Compatibility
- **OCR**: Works in all modern browsers (via Tesseract.js)
- **Transcription**: Requires Web Speech API support (Chrome, Edge, Safari)
- **Audio Extraction**: Works in all modern browsers with WebAssembly support

## Troubleshooting

### Common Issues
1. **Dependency Installation**: If yarn install fails, try using npm instead
2. **TypeScript Errors**: Some libraries may need additional type definitions
3. **Performance**: Large files may need chunked processing
4. **Browser Support**: Fallback implementations may be needed for older browsers

### Performance Considerations
- OCR processing can be CPU-intensive for large images
- Audio extraction from video files can be memory-intensive
- Consider implementing background processing for large files
- Add progress indicators for long-running operations

## Security Considerations
- All processing is done client-side (no data sent to external servers)
- OCR and transcription results should be validated before use
- Consider adding content filtering for sensitive information
- Implement rate limiting for processing operations

## Future Enhancements
- Support for additional image formats (TIFF, etc.)
- Support for additional audio/video formats
- Language detection and multi-language OCR
- Batch processing optimization
- Cloud-based processing options
- Integration with Box AI services