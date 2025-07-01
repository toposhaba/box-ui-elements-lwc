import { LightningElement, api } from 'lwc';

export default class BoxUploadState extends LightningElement {
    @api view = 'upload-empty';
    @api canDrop = false;
    @api isOver = false;
    @api isFolderUploadEnabled = false;
    @api acceptedFileTypes = '*';
    
    get isEmptyState() {
        return this.view === 'upload-empty';
    }
    
    get isSuccessState() {
        return this.view === 'upload-success';
    }
    
    get isInProgressState() {
        return this.view === 'upload-inprogress';
    }
    
    get stateClass() {
        const classes = ['bcu-upload-state'];
        
        if (this.isOver && this.canDrop) {
            classes.push('bcu-is-over');
        }
        
        classes.push(`bcu-${this.view}`);
        
        return classes.join(' ');
    }
    
    get iconName() {
        if (this.isSuccessState) {
            return 'utility:success';
        }
        return 'utility:upload';
    }
    
    get iconVariant() {
        if (this.isSuccessState) {
            return 'success';
        }
        return 'default';
    }
    
    get headingText() {
        if (this.isSuccessState) {
            return 'Upload Complete!';
        }
        if (this.isInProgressState) {
            return 'Upload in Progress';
        }
        return 'Drop files here or click to upload';
    }
    
    get subheadingText() {
        if (this.isSuccessState) {
            return 'Your files have been uploaded successfully.';
        }
        if (this.isInProgressState) {
            return 'Please wait while your files are being uploaded.';
        }
        if (this.isFolderUploadEnabled) {
            return 'You can upload files or entire folders';
        }
        return 'Select one or more files to upload';
    }
    
    get showUploadButton() {
        return this.isEmptyState;
    }
    
    get uploadButtonLabel() {
        return this.isFolderUploadEnabled ? 'Select Files or Folders' : 'Select Files';
    }
    
    handleFileSelect() {
        // Trigger file input click
        const fileInput = this.template.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.click();
        }
    }
    
    handleFileChange(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            // Dispatch custom event with selected files
            this.dispatchEvent(new CustomEvent('fileselect', {
                detail: { target: event.target },
                bubbles: true,
                composed: true
            }));
        }
    }
}