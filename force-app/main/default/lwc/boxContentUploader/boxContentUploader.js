import { LightningElement, api, track } from 'lwc';
import { createBoxApiService } from 'c/boxApiService';

// Constants
const VIEW_UPLOAD_EMPTY = 'upload-empty';
const VIEW_UPLOAD_IN_PROGRESS = 'upload-inprogress';
const VIEW_UPLOAD_SUCCESS = 'upload-success';
const VIEW_ERROR = 'error';

const STATUS_PENDING = 'pending';
const STATUS_IN_PROGRESS = 'inprogress';
const STATUS_COMPLETE = 'complete';
const STATUS_ERROR = 'error';

const FILE_LIMIT_DEFAULT = 100;
const CHUNKED_UPLOAD_MIN_SIZE_BYTES = 104857600; // 100MB
const UPLOAD_CONCURRENCY = 6;

export default class BoxContentUploader extends LightningElement {
    @api className = '';
    @api fileLimit = FILE_LIMIT_DEFAULT;
    @api rootFolderId = '0';
    @api isLarge = false;
    @api isSmall = false;
    @api isFolderUploadEnabled = false;
    @api useUploadsManager = false;
    @api allowedExtensions = [];
    @api token;
    @api apiHost;
    @api uploadHost;
    @api sharedLink;
    @api sharedLinkPassword;
    @api overwrite = false;
    
    @track view = VIEW_UPLOAD_EMPTY;
    @track items = [];
    @track errorCode = '';
    @track isUploadsManagerExpanded = false;
    @track isDragging = false;
    @track isOver = false;
    
    itemIds = {};
    uploadQueue = [];
    activeUploads = 0;
    boxApiService = null;
    activeXhrs = new Map();
    
    get showContent() {
        return this.view !== VIEW_ERROR;
    }
    
    get hasItems() {
        return this.items.length > 0;
    }
    
    get containerClass() {
        const classes = ['box-content-uploader'];
        
        if (this.className) {
            classes.push(this.className);
        }
        
        if (this.isLarge) {
            classes.push('bcu-is-large');
        }
        
        if (this.isSmall) {
            classes.push('bcu-is-small');
        }
        
        return classes.join(' ');
    }
    
    get droppableClass() {
        const classes = ['bcu-droppable-content'];
        
        if (this.isOver && this.canDrop) {
            classes.push('bcu-is-over');
        }
        
        if (this.isDragging) {
            classes.push('bcu-is-dragging');
        }
        
        return classes.join(' ');
    }
    
    get canDrop() {
        return !this.isDisabled && this.isDragging;
    }
    
    get isDisabled() {
        return false; // Can be extended to disable uploads
    }
    
    get acceptedFileTypes() {
        if (this.allowedExtensions && this.allowedExtensions.length > 0) {
            return this.allowedExtensions.map(ext => `.${ext}`).join(',');
        }
        return '*';
    }
    
    get totalProgress() {
        if (this.items.length === 0) return 0;
        
        let totalSize = 0;
        let totalUploaded = 0;
        
        this.items.forEach(item => {
            if (item.status !== STATUS_ERROR && !item.isFolder) {
                totalSize += item.size;
                totalUploaded += (item.size * item.progress) / 100;
            }
        });
        
        return totalSize > 0 ? (totalUploaded / totalSize) * 100 : 0;
    }
    
    connectedCallback() {
        // Initialize Box API service if token is provided
        if (this.token) {
            this.initializeBoxApiService();
        }
    }
    
    initializeBoxApiService() {
        this.boxApiService = createBoxApiService({
            token: this.token,
            apiHost: this.apiHost,
            uploadHost: this.uploadHost,
            sharedLink: this.sharedLink,
            sharedLinkPassword: this.sharedLinkPassword,
            clientName: 'BoxContentUploader-LWC'
        });
        
        // Update view to show upload area if service is initialized
        if (this.view === VIEW_ERROR) {
            this.view = VIEW_UPLOAD_EMPTY;
        }
    }
    
    handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }
    
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.canDrop) {
            event.dataTransfer.dropEffect = 'copy';
            this.isOver = true;
        }
    }
    
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Check if we're leaving the container entirely
        const rect = this.template.querySelector('.bcu-droppable-content').getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            this.isOver = false;
            this.isDragging = false;
        }
    }
    
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.isDragging = false;
        this.isOver = false;
        
        if (!this.canDrop) return;
        
        const files = Array.from(event.dataTransfer.files);
        this.addFilesToQueue(files);
    }
    
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFilesToQueue(files);
        
        // Reset input to allow selecting the same file again
        event.target.value = '';
    }
    
    addFilesToQueue(files) {
        if (!files || files.length === 0) return;
        
        // Check file limit
        const currentCount = this.items.length;
        const newCount = files.length;
        
        if (currentCount + newCount > this.fileLimit) {
            this.showError('FILE_LIMIT_EXCEEDED', `Maximum ${this.fileLimit} files allowed`);
            return;
        }
        
        // Filter and process files
        const validFiles = files.filter(file => this.isValidFile(file));
        
        if (validFiles.length === 0) {
            this.showError('NO_VALID_FILES', 'No valid files to upload');
            return;
        }
        
        // Create upload items
        const newItems = validFiles.map(file => this.createUploadItem(file));
        
        // Add to items array
        this.items = [...this.items, ...newItems];
        
        // Update view
        if (this.view === VIEW_UPLOAD_EMPTY) {
            this.view = VIEW_UPLOAD_IN_PROGRESS;
        }
        
        // Start upload process
        this.processUploadQueue();
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('filesadded', {
            detail: { files: validFiles },
            bubbles: true,
            composed: true
        }));
    }
    
    isValidFile(file) {
        // Check file extension if restrictions are set
        if (this.allowedExtensions && this.allowedExtensions.length > 0) {
            const extension = file.name.split('.').pop().toLowerCase();
            if (!this.allowedExtensions.includes(extension)) {
                return false;
            }
        }
        
        // Add more validation as needed (file size, etc.)
        return true;
    }
    
    createUploadItem(file) {
        const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            id,
            file,
            name: file.name,
            size: file.size,
            extension: file.name.split('.').pop().toLowerCase(),
            progress: 0,
            status: STATUS_PENDING,
            error: null,
            isFolder: false,
            uploadedSize: 0,
            startTime: null,
            speed: 0
        };
    }
    
    processUploadQueue() {
        // Process items in queue up to concurrency limit
        while (this.activeUploads < UPLOAD_CONCURRENCY) {
            const pendingItem = this.items.find(item => item.status === STATUS_PENDING);
            
            if (!pendingItem) break;
            
            this.uploadFile(pendingItem);
        }
    }
    
    async uploadFile(item) {
        try {
            this.activeUploads++;
            
            // Update item status
            this.updateItem(item.id, {
                status: STATUS_IN_PROGRESS,
                startTime: Date.now()
            });
            
            // Use Box API service if available, otherwise simulate
            if (this.boxApiService && this.token) {
                await this.uploadFileToBox(item);
            } else {
                await this.simulateUpload(item);
            }
            
            // Update item status to complete
            this.updateItem(item.id, {
                status: STATUS_COMPLETE,
                progress: 100
            });
            
            // Dispatch success event
            this.dispatchEvent(new CustomEvent('uploadcomplete', {
                detail: { item },
                bubbles: true,
                composed: true
            }));
            
        } catch (error) {
            // Handle upload error
            this.updateItem(item.id, {
                status: STATUS_ERROR,
                error: error.message || 'Upload failed'
            });
            
            // Dispatch error event
            this.dispatchEvent(new CustomEvent('uploaderror', {
                detail: { item, error },
                bubbles: true,
                composed: true
            }));
            
        } finally {
            this.activeUploads--;
            this.activeXhrs.delete(item.id);
            this.processUploadQueue();
            this.checkAllUploadsComplete();
        }
    }
    
    // Upload file to Box using Box API
    async uploadFileToBox(item) {
        return new Promise((resolve, reject) => {
            const xhr = this.boxApiService.uploadFile(item.file, this.rootFolderId, {
                fileName: item.name,
                overwrite: this.overwrite,
                onProgress: (progressData) => {
                    const progress = progressData.percent;
                    const elapsedTime = Date.now() - item.startTime;
                    const speed = progressData.loaded / (elapsedTime / 1000);
                    
                    this.updateItem(item.id, {
                        progress,
                        uploadedSize: progressData.loaded,
                        speed
                    });
                    
                    // Dispatch progress event
                    this.dispatchEvent(new CustomEvent('uploadprogress', {
                        detail: { item, progress },
                        bubbles: true,
                        composed: true
                    }));
                },
                onSuccess: (entries) => {
                    // Store the Box file info
                    this.updateItem(item.id, {
                        boxFile: entries[0]
                    });
                    resolve(entries);
                },
                onError: (error) => {
                    reject(error);
                }
            });
            
            // Store XHR reference for cancellation
            if (xhr) {
                this.activeXhrs.set(item.id, xhr);
            }
        });
    }
    
    // Simulate upload with progress updates (fallback when Box API is not configured)
    async simulateUpload(item) {
        const totalSteps = 10;
        const stepDelay = 200; // ms
        
        for (let i = 1; i <= totalSteps; i++) {
            await new Promise(resolve => setTimeout(resolve, stepDelay));
            
            const progress = (i / totalSteps) * 100;
            const uploadedSize = (item.size * progress) / 100;
            const elapsedTime = Date.now() - item.startTime;
            const speed = uploadedSize / (elapsedTime / 1000); // bytes per second
            
            this.updateItem(item.id, {
                progress,
                uploadedSize,
                speed
            });
            
            // Dispatch progress event
            this.dispatchEvent(new CustomEvent('uploadprogress', {
                detail: { item, progress },
                bubbles: true,
                composed: true
            }));
        }
    }
    
    updateItem(itemId, updates) {
        this.items = this.items.map(item => {
            if (item.id === itemId) {
                return { ...item, ...updates };
            }
            return item;
        });
    }
    
    removeItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        
        if (item && item.status === STATUS_IN_PROGRESS) {
            // Cancel upload if in progress
            const xhr = this.activeXhrs.get(itemId);
            if (xhr) {
                xhr.abort();
                this.activeXhrs.delete(itemId);
                this.activeUploads--;
            }
        }
        
        // Remove from item IDs tracking
        delete this.itemIds[itemId];
        
        this.items = this.items.filter(item => item.id !== itemId);
        
        if (this.items.length === 0) {
            this.view = VIEW_UPLOAD_EMPTY;
        }
        
        // Dispatch remove event
        this.dispatchEvent(new CustomEvent('itemremoved', {
            detail: { itemId },
            bubbles: true,
            composed: true
        }));
    }
    
    retryItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        
        if (item && item.status === STATUS_ERROR) {
            this.updateItem(itemId, {
                status: STATUS_PENDING,
                progress: 0,
                error: null
            });
            
            this.processUploadQueue();
        }
    }
    
    checkAllUploadsComplete() {
        const allComplete = this.items.every(item => 
            item.status === STATUS_COMPLETE || item.status === STATUS_ERROR
        );
        
        if (allComplete && this.items.length > 0) {
            const hasErrors = this.items.some(item => item.status === STATUS_ERROR);
            
            if (!hasErrors) {
                this.view = VIEW_UPLOAD_SUCCESS;
                
                // Auto-clear after delay
                setTimeout(() => {
                    if (this.view === VIEW_UPLOAD_SUCCESS) {
                        this.clearCompletedItems();
                    }
                }, 5000);
            }
            
            // Dispatch all complete event
            this.dispatchEvent(new CustomEvent('alluploadscomplete', {
                detail: { items: this.items },
                bubbles: true,
                composed: true
            }));
        }
    }
    
    clearCompletedItems() {
        this.items = this.items.filter(item => 
            item.status !== STATUS_COMPLETE
        );
        
        if (this.items.length === 0) {
            this.view = VIEW_UPLOAD_EMPTY;
        }
    }
    
    showError(code, message) {
        this.errorCode = code;
        this.view = VIEW_ERROR;
        
        // Dispatch error event
        this.dispatchEvent(new CustomEvent('error', {
            detail: { code, message },
            bubbles: true,
            composed: true
        }));
    }
    
    handleItemAction(event) {
        const { itemId, action } = event.detail;
        
        switch (action) {
            case 'remove':
                this.removeItem(itemId);
                break;
            case 'retry':
                this.retryItem(itemId);
                break;
        }
    }
    
    toggleUploadsManager() {
        this.isUploadsManagerExpanded = !this.isUploadsManagerExpanded;
    }
}