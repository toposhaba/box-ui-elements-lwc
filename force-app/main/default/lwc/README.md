# Box UI Elements - Lightning Web Components

This directory contains the Salesforce Lightning Web Components (LWC) versions of the Box UI Elements, converted from React.

## Converted Components

### 1. boxButton
A customizable button component with support for loading states, icons, and animations.

**Properties:**
- `label` - Button text
- `type` - Button type (button, submit, reset)
- `size` - Button size (small, medium, large)
- `isDisabled` - Disabled state
- `isLoading` - Shows loading indicator
- `isSelected` - Selected state
- `showRadar` - Shows radar animation
- `iconName` - Salesforce icon name (e.g., 'utility:check')
- `className` - Additional CSS classes

**Events:**
- `buttonclick` - Fired when button is clicked

**Example Usage:**
```html
<c-box-button 
    label="Save" 
    type="submit"
    icon-name="utility:save"
    onbuttonclick={handleSave}>
</c-box-button>
```

### 2. boxCheckbox
A checkbox component with custom styling and support for labels, descriptions, and tooltips.

**Properties:**
- `label` - Checkbox label
- `name` - Input name attribute
- `value` - Input value
- `isChecked` - Checked state
- `isDisabled` - Disabled state
- `fieldLabel` - Label above checkbox
- `description` - Description text
- `tooltip` - Tooltip text
- `hideLabel` - Hide the label
- `className` - Additional CSS classes

**Events:**
- `checkboxchange` - Fired when checkbox state changes
- `checkboxfocus` - Fired on focus
- `checkboxblur` - Fired on blur

**Example Usage:**
```html
<c-box-checkbox
    label="I agree to the terms"
    name="agreement"
    value="terms"
    is-checked={isAgreed}
    description="Please read the terms carefully"
    oncheckboxchange={handleCheckboxChange}>
</c-box-checkbox>
```

### 3. boxModal
A modal dialog component with backdrop, loading state, and focus management.

**Properties:**
- `title` - Modal title
- `isOpen` - Open state
- `isLoading` - Loading state
- `size` - Modal size (small, medium, large)
- `className` - Additional CSS classes

**Events:**
- `requestclose` - Fired when modal should close

**Slots:**
- Default slot - Modal body content
- `footer` - Modal footer content

**Example Usage:**
```html
<c-box-modal
    title="Edit Record"
    is-open={isModalOpen}
    size="medium"
    onrequestclose={handleCloseModal}>
    
    <!-- Modal Body -->
    <div class="slds-p-around_medium">
        <p>Modal content goes here</p>
    </div>
    
    <!-- Modal Footer -->
    <div slot="footer">
        <c-box-button label="Cancel" onbuttonclick={handleCancel}></c-box-button>
        <c-box-button label="Save" onbuttonclick={handleSave}></c-box-button>
    </div>
</c-box-modal>
```

### 4. boxLoadingIndicator
An animated loading indicator with different sizes.

**Properties:**
- `size` - Size of the indicator (small, medium, large, default)
- `className` - Additional CSS classes

**Example Usage:**
```html
<c-box-loading-indicator size="large"></c-box-loading-indicator>
```

### 5. boxRadarAnimation
A radar pulse animation wrapper component.

**Properties:**
- `isShown` - Whether to show the radar animation
- `className` - Additional CSS classes

**Example Usage:**
```html
<c-box-radar-animation is-shown={showAnimation}>
    <lightning-button label="Click me"></lightning-button>
</c-box-radar-animation>
```

### 6. boxCheckboxTooltip
A tooltip component specifically for checkbox help text.

**Properties:**
- `tooltip` - Tooltip text to display

## Key Differences from React Version

1. **Event Handling**: React's synthetic events are replaced with LWC's custom events
2. **Props vs Properties**: React props become LWC @api properties
3. **State Management**: React state is replaced with LWC reactive properties
4. **Styling**: SCSS files are converted to standard CSS
5. **Conditional Rendering**: React's conditional rendering is replaced with LWC's template directives
6. **Icons**: Box custom icons are replaced with Salesforce's lightning-icon component

## Installation

1. Deploy these components to your Salesforce org
2. Add them to your Lightning pages, apps, or other LWC components
3. The components use Salesforce Lightning Design System (SLDS) for consistent styling

## Customization

The components maintain their original CSS classes for styling compatibility. You can override styles using CSS in your parent components or by passing custom classes via the `className` property.

### 7. boxContentUploader
A comprehensive file upload component with drag-and-drop support, progress tracking, and full Box API integration.

**Properties:**
- `fileLimit` - Maximum number of files (default: 100)
- `rootFolderId` - Target folder ID for uploads (default: '0' for root)
- `isLarge` - Use large size variant
- `isSmall` - Use small size variant
- `isFolderUploadEnabled` - Enable folder uploads
- `useUploadsManager` - Show uploads manager UI
- `allowedExtensions` - Comma-separated list of allowed file extensions
- `token` - Box API access token (required for Box uploads)
- `apiHost` - Box API host URL (optional)
- `uploadHost` - Box upload host URL (optional)
- `sharedLink` - Box shared link for accessing content
- `sharedLinkPassword` - Password for the shared link
- `overwrite` - Whether to overwrite files with same name (default: true)

**Events:**
- `filesadded` - Fired when files are added to queue
- `uploadprogress` - Fired during upload progress
- `uploadcomplete` - Fired when a file completes upload
- `uploaderror` - Fired on upload error
- `alluploadscomplete` - Fired when all uploads complete
- `itemremoved` - Fired when an item is removed

**Example Usage:**

Basic usage (simulated uploads):
```html
<c-box-content-uploader
    file-limit="50"
    use-uploads-manager={true}
    allowed-extensions="jpg,png,pdf,docx"
    onfilesadded={handleFilesAdded}
    onuploadcomplete={handleUploadComplete}>
</c-box-content-uploader>
```

With Box API integration:
```html
<c-box-content-uploader
    token={boxApiToken}
    root-folder-id="123456789"
    file-limit="50"
    use-uploads-manager={true}
    allowed-extensions="jpg,png,pdf,docx"
    overwrite={false}
    onfilesadded={handleFilesAdded}
    onuploadcomplete={handleUploadComplete}
    onuploaderror={handleUploadError}>
</c-box-content-uploader>
```

### 8. boxUploadState
Shows the current state of the upload area (empty, in progress, success).

**Properties:**
- `view` - Current view state
- `canDrop` - Whether files can be dropped
- `isOver` - Whether dragging over the area
- `isFolderUploadEnabled` - Show folder upload option
- `acceptedFileTypes` - Accepted file types

### 9. boxUploadItemList
Displays a list of files being uploaded with their status.

**Properties:**
- `items` - Array of upload items

### 10. boxUploadItem
Individual upload item showing file info, progress, and actions.

**Properties:**
- `item` - Upload item object with file details

### 11. boxUploadsManager
A fixed-position upload manager that tracks multiple file uploads.

**Properties:**
- `items` - Array of upload items
- `isExpanded` - Whether the manager is expanded
- `isVisible` - Whether the manager is visible
- `totalProgress` - Overall upload progress percentage

## Upload Component Features

The upload components provide:
- **Drag and Drop**: Drag files directly onto the upload area
- **Progress Tracking**: Real-time upload progress for each file
- **Concurrent Uploads**: Upload multiple files simultaneously
- **Error Handling**: Retry failed uploads with automatic retry logic
- **File Validation**: Restrict uploads by file type
- **Upload Manager**: Track all uploads in a collapsible panel
- **Responsive Design**: Works on desktop and mobile
- **Box API Integration**: Full integration with Box APIs for real uploads
- **Conflict Resolution**: Automatic handling of filename conflicts
- **SHA1 Verification**: File integrity checking during uploads

## Box API Integration

The upload components include full Box API integration matching the original Box UI Elements:

### Authentication
Provide a Box API token to enable real uploads:
```javascript
// In your Lightning component
boxApiToken = 'YOUR_BOX_API_TOKEN';
```

### Features Implemented
- **Preflight Requests**: Validates uploads before starting
- **Chunked Uploads**: For large files (future enhancement)
- **Progress Tracking**: Real-time upload progress from Box API
- **Error Handling**: Automatic retry with exponential backoff
- **Conflict Resolution**: Handle duplicate filenames (overwrite or rename)
- **SHA1 Hashing**: File integrity verification
- **Rate Limiting**: Respects Box API rate limits

### API Service Module
The `boxApiService` module provides:
- File upload with progress tracking
- Folder creation
- Folder content listing
- Automatic retry logic
- Error handling

## Notes

- These components are designed to work within the Salesforce platform
- They leverage SLDS for consistent look and feel
- Focus management and accessibility features are maintained from the original React components
- Some advanced features like portals and complex positioning may need adjustment based on your specific use case
- The upload components use simulated uploads by default - integrate with your actual upload API for production use