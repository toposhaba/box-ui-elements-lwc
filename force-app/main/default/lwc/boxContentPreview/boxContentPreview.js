import { LightningElement, api, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import { createBoxApiService } from 'c/boxApiService';

// Constants
const DEFAULT_PREVIEW_VERSION = '2.89.0';
const DEFAULT_LOCALE = 'en-US';
const PREVIEW_LOAD_EVENT = 'load';
const PREVIEW_ERROR_EVENT = 'error';
const PREVIEW_VIEWER_EVENT = 'viewer';
const PREVIEW_NAVIGATE_EVENT = 'navigate';

export default class BoxContentPreview extends LightningElement {
    @api fileId;
    @api token;
    @api apiHost;
    @api staticHost = 'https://cdn01.boxcdn.net';
    @api previewVersion = DEFAULT_PREVIEW_VERSION;
    @api locale = DEFAULT_LOCALE;
    @api sharedLink;
    @api sharedLinkPassword;
    @api showAnnotations = false;
    @api showAnnotationsControls = false;
    @api canDownload = false;
    @api canPrint = false;
    @api showDownload = false;
    @api showPrint = false;
    @api collection = [];
    @api startAt;
    @api enableThumbnailsSidebar = false;
    @api contentSidebarProps = {};
    @api hotkeys = {};
    @api pauseRequests = false;
    @api header = 'light';
    @api useHotkeys = false;
    @api requestInterceptor;
    @api responseInterceptor;
    
    @track isLoading = true;
    @track error = null;
    @track file = null;
    @track currentViewer = null;
    @track canPrintFile = false;
    @track isThumbnailSidebarOpen = false;
    
    preview = null;
    boxApiService = null;
    previewContainer = null;
    previewLibraryLoaded = false;
    
    get showError() {
        return !!this.error;
    }
    
    get showContent() {
        return !this.isLoading && !this.showError;
    }
    
    get previewOptions() {
        const options = {
            container: this.previewContainer,
            showDownload: this.showDownload && this.canDownload,
            showPrint: this.showPrint && this.canPrint,
            showAnnotations: this.showAnnotations,
            showAnnotationsControls: this.showAnnotationsControls,
            enableThumbnailsSidebar: this.enableThumbnailsSidebar,
            header: this.header,
            useHotkeys: this.useHotkeys,
            pauseRequests: this.pauseRequests,
        };
        
        if (this.sharedLink) {
            options.sharedLink = this.sharedLink;
            if (this.sharedLinkPassword) {
                options.sharedLinkPassword = this.sharedLinkPassword;
            }
        }
        
        if (this.startAt) {
            options.startAt = this.startAt;
        }
        
        if (this.collection && this.collection.length > 0) {
            options.collection = this.collection;
        }
        
        if (this.hotkeys && Object.keys(this.hotkeys).length > 0) {
            options.hotkeys = this.hotkeys;
        }
        
        if (this.requestInterceptor) {
            options.requestInterceptor = this.requestInterceptor;
        }
        
        if (this.responseInterceptor) {
            options.responseInterceptor = this.responseInterceptor;
        }
        
        return options;
    }
    
    connectedCallback() {
        if (this.token) {
            this.initializeBoxApiService();
            this.loadPreviewResources();
        }
    }
    
    disconnectedCallback() {
        this.destroyPreview();
    }
    
    renderedCallback() {
        if (!this.previewContainer) {
            this.previewContainer = this.template.querySelector('.box-preview-container');
        }
        
        if (this.previewLibraryLoaded && this.previewContainer && !this.preview && this.fileId) {
            this.initializePreview();
        }
    }
    
    initializeBoxApiService() {
        this.boxApiService = createBoxApiService({
            token: this.token,
            apiHost: this.apiHost,
            sharedLink: this.sharedLink,
            sharedLinkPassword: this.sharedLinkPassword,
            clientName: 'BoxContentPreview-LWC'
        });
    }
    
    async loadPreviewResources() {
        try {
            const baseUrl = `${this.staticHost}/preview/${this.previewVersion}/${this.locale}`;
            
            // Load Preview CSS
            await loadStyle(this, `${baseUrl}/preview.css`);
            
            // Load Preview JS
            await loadScript(this, `${baseUrl}/preview.js`);
            
            this.previewLibraryLoaded = true;
            
            if (this.previewContainer && this.fileId) {
                this.initializePreview();
            }
        } catch (error) {
            console.error('Failed to load Box Preview resources:', error);
            this.handleError(error);
        }
    }
    
    initializePreview() {
        if (!window.Box || !window.Box.Preview) {
            console.error('Box Preview library not loaded');
            return;
        }
        
        try {
            // Create preview instance
            this.preview = new window.Box.Preview();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Show the preview
            this.showPreview();
            
        } catch (error) {
            console.error('Failed to initialize preview:', error);
            this.handleError(error);
        }
    }
    
    setupEventListeners() {
        if (!this.preview) return;
        
        // Load event
        this.preview.addListener(PREVIEW_LOAD_EVENT, (data) => {
            this.isLoading = false;
            this.error = null;
            
            // Update print capability based on viewer
            const viewer = this.preview.getCurrentViewer();
            this.canPrintFile = viewer && viewer.canPrint();
            
            // Dispatch load event
            this.dispatchEvent(new CustomEvent('load', {
                detail: {
                    file: data.file,
                    viewer: viewer ? viewer.getName() : null,
                    metrics: data.metrics
                },
                bubbles: true,
                composed: true
            }));
        });
        
        // Error event
        this.preview.addListener(PREVIEW_ERROR_EVENT, (error) => {
            console.error('Preview error:', error);
            this.handleError(error);
            
            // Dispatch error event
            this.dispatchEvent(new CustomEvent('error', {
                detail: { error },
                bubbles: true,
                composed: true
            }));
        });
        
        // Viewer event
        this.preview.addListener(PREVIEW_VIEWER_EVENT, (viewer) => {
            this.currentViewer = viewer;
            
            // Dispatch viewer event
            this.dispatchEvent(new CustomEvent('viewer', {
                detail: { viewer: viewer.getName() },
                bubbles: true,
                composed: true
            }));
        });
        
        // Navigate event (for collections)
        this.preview.addListener(PREVIEW_NAVIGATE_EVENT, (fileId) => {
            this.fileId = fileId;
            
            // Dispatch navigate event
            this.dispatchEvent(new CustomEvent('navigate', {
                detail: { fileId },
                bubbles: true,
                composed: true
            }));
        });
    }
    
    showPreview() {
        if (!this.preview || !this.fileId) return;
        
        this.isLoading = true;
        this.error = null;
        
        try {
            this.preview.show(this.fileId, this.token, this.previewOptions);
        } catch (error) {
            console.error('Failed to show preview:', error);
            this.handleError(error);
        }
    }
    
    destroyPreview() {
        if (this.preview) {
            this.preview.destroy();
            this.preview.removeAllListeners();
            this.preview = null;
        }
    }
    
    handleError(error) {
        this.isLoading = false;
        this.error = error.message || 'An error occurred while loading the preview';
    }
    
    // Public methods
    @api
    reload() {
        if (this.preview) {
            this.preview.reload();
        }
    }
    
    @api
    print() {
        if (this.preview && this.canPrintFile) {
            this.preview.print();
        }
    }
    
    @api
    download() {
        if (this.preview && this.canDownload) {
            this.preview.download();
        }
    }
    
    @api
    resize() {
        if (this.preview) {
            this.preview.resize();
        }
    }
    
    @api
    getCurrentViewer() {
        return this.preview ? this.preview.getCurrentViewer() : null;
    }
    
    @api
    navigateToIndex(index) {
        if (this.preview && this.collection.length > 0) {
            this.preview.navigateToIndex(index);
        }
    }
    
    @api
    navigateLeft() {
        if (this.preview && this.collection.length > 0) {
            this.preview.navigateLeft();
        }
    }
    
    @api
    navigateRight() {
        if (this.preview && this.collection.length > 0) {
            this.preview.navigateRight();
        }
    }
    
    @api
    updateToken(newToken) {
        this.token = newToken;
        if (this.preview) {
            this.preview.updateToken(newToken);
        }
    }
    
    @api
    toggleFullscreen() {
        if (this.preview) {
            const viewer = this.preview.getCurrentViewer();
            if (viewer && viewer.toggleFullscreen) {
                viewer.toggleFullscreen();
            }
        }
    }
    
    @api
    toggleThumbnails() {
        if (this.preview && this.enableThumbnailsSidebar) {
            this.isThumbnailSidebarOpen = !this.isThumbnailSidebarOpen;
            // Preview library would handle this internally
        }
    }
}