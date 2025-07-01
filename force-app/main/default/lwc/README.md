# Box UI Elements for Lightning Web Components (LWC)

This repository contains Box UI Elements converted from React to Salesforce's Lightning Web Components (LWC) framework. These components provide Box's file management capabilities within Salesforce applications.

## Components Overview

### Core UI Components

1. **boxButton** - Customizable button with loading states, icons, and various sizes
2. **boxCheckbox** - Checkbox with custom labels, descriptions, and tooltips
3. **boxModal** - Modal dialog with customizable header, body, and footer
4. **boxLoadingIndicator** - Animated loading spinner with multiple sizes
5. **boxRadarAnimation** - Radar pulse animation effect
6. **boxCheckboxTooltip** - Tooltip component for checkbox help text

### Upload Components

7. **boxContentUploader** - Main upload component with:
   - Drag-and-drop file upload
   - File validation by extension
   - Progress tracking
   - Box API integration
   - Concurrent uploads (up to 6 files)
   
8. **boxUploadState** - Upload area state display (empty, in-progress, success)
9. **boxUploadItemList** - Container for upload items
10. **boxUploadItem** - Individual file with progress and status
11. **boxUploadsManager** - Fixed-position upload manager with overall progress

### File Management Components

12. **boxContentExplorer** - Full-featured file manager with:
    - Folder navigation
    - Search functionality
    - List/Grid view toggle
    - File operations (rename, delete, download)
    - Create folders
    - File preview
    - Pagination
    - Box API integration

13. **boxContentPicker** - File picker for selecting files from Box
    - Single/Multiple selection
    - File type filtering
    - Integrated with Content Explorer

### Supporting Components

14. **boxExplorerList** - List view for files and folders
15. **boxExplorerHeader** - Header with search and view controls
16. **boxExplorerBreadcrumbs** - Breadcrumb navigation
17. **boxExplorerFooter** - Pagination controls
18. **boxCreateFolderModal** - Create new folders
19. **boxDeleteModal** - Delete confirmation
20. **boxRenameModal** - Rename files/folders
21. **boxPreviewModal** - File preview (placeholder)

### Services

22. **boxApiService** - Box API integration module providing:
    - Authentication (token, shared link)
    - File operations (upload, download, delete, rename)
    - Folder operations (list, create, navigate)
    - Search functionality
    - SHA1 integrity checking
    - Automatic retry with exponential backoff

### Demo

23. **boxUIElementsDemo** - Comprehensive demo showcasing all components

## Installation

1. Deploy to your Salesforce org:
```bash
sfdx force:source:deploy -p force-app
```

2. Add to your Lightning App Builder pages or use in custom components

## Usage Examples

### Content Explorer (File Manager)
```html
<c-box-content-explorer
    token={boxApiToken}
    root-folder-id="0"
    can-download={true}
    can-delete={true}
    can-rename={true}
    can-upload={true}
    can-create-new-folder={true}
    onnavigate={handleNavigate}
    onselect={handleSelect}>
</c-box-content-explorer>
```

### Content Picker
```html
<c-box-content-picker
    token={boxApiToken}
    can-select-multiple={true}
    onchoose={handleFileSelection}
    oncancel={handleCancel}>
</c-box-content-picker>
```

### File Upload with Box API
```html
<c-box-content-uploader
    token={boxApiToken}
    folder-id="12345"
    file-limit="10"
    allowed-extensions="pdf,docx,xlsx"
    onuploadcomplete={handleUploadComplete}>
</c-box-content-uploader>
```

### Basic Button
```html
<c-box-button 
    label="Save" 
    type="button"
    icon-name="utility:save"
    is-loading={isSaving}
    onbuttonclick={handleSave}>
</c-box-button>
```

## Box API Integration

The components support full Box API integration when provided with an authentication token:

```javascript
// In your component
boxApiToken = 'YOUR_BOX_API_TOKEN';

// The components will automatically:
// - Upload files to Box
// - List folder contents
// - Search files
// - Download files
// - Create folders
// - Delete/Rename items
```

Without a token, upload components will simulate uploads for testing.

## Configuration

### Authentication Options
- **Token**: Direct Box API access token
- **Shared Link**: Access via Box shared link
- **Shared Link Password**: For password-protected shared links

### Component Properties

Most components support extensive customization through properties:
- Permission controls (can-download, can-delete, etc.)
- UI options (view modes, pagination size)
- File restrictions (extensions, size limits)
- Styling and theming

## Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile Chrome and Safari

## Development

### Project Structure
```
force-app/main/default/lwc/
├── boxApiService/          # API integration
├── boxButton/              # UI components
├── boxCheckbox/
├── boxContentExplorer/     # File manager
├── boxContentPicker/       # File picker
├── boxContentUploader/     # Upload component
├── boxUIElementsDemo/      # Demo component
└── ...                     # Other components
```

### Testing
Create a scratch org and deploy:
```bash
sfdx force:org:create -f config/project-scratch-def.json -a box-ui-test
sfdx force:source:push -u box-ui-test
sfdx force:org:open -u box-ui-test
```

## Notes

- Components use Salesforce Lightning Design System (SLDS) for styling
- File preview requires additional Box Preview SDK integration
- Some features may require additional Box API permissions
- Rate limiting is handled automatically with retry logic

## License

This is a conversion of Box UI Elements for use in Salesforce. Please refer to Box's original licensing terms for the Box UI Elements.