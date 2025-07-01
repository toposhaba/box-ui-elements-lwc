import { LightningElement, api, track } from 'lwc';
import { createBoxApiService } from 'c/boxApiService';

// Constants
const VIEW_FOLDER = 'folder';
const VIEW_SEARCH = 'search';
const VIEW_RECENTS = 'recents';
const VIEW_ERROR = 'error';
const VIEW_SELECTED = 'selected';

const VIEW_MODE_LIST = 'list';
const VIEW_MODE_GRID = 'grid';

const SORT_ASC = 'ASC';
const SORT_DESC = 'DESC';

const TYPE_FILE = 'file';
const TYPE_FOLDER = 'folder';
const TYPE_WEBLINK = 'web_link';

const DEFAULT_ROOT = '0';
const DEFAULT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 500;

export default class BoxContentExplorer extends LightningElement {
    @api token;
    @api apiHost;
    @api rootFolderId = DEFAULT_ROOT;
    @api sharedLink;
    @api sharedLinkPassword;
    @api canDownload = true;
    @api canDelete = true;
    @api canRename = true;
    @api canShare = true;
    @api canPreview = true;
    @api canUpload = true;
    @api canCreateNewFolder = true;
    @api canSelectMultiple = false;
    @api defaultView = 'files';
    @api sortBy = 'name';
    @api sortDirection = SORT_ASC;
    @api pageSize = DEFAULT_PAGE_SIZE;
    @api isPickerMode = false;
    @api allowedExtensions = [];
    
    @track currentCollection = {};
    @track currentOffset = 0;
    @track isLoading = false;
    @track view = VIEW_FOLDER;
    @track viewMode = VIEW_MODE_LIST;
    @track searchQuery = '';
    @track errorMessage = '';
    @track selectedItems = [];
    @track focusedItemId = null;
    @track breadcrumbs = [];
    @track isCreateFolderModalOpen = false;
    @track isDeleteModalOpen = false;
    @track isRenameModalOpen = false;
    @track isShareModalOpen = false;
    @track isPreviewModalOpen = false;
    @track isUploadModalOpen = false;
    @track selectedItem = null;
    
    boxApiService = null;
    searchTimeout = null;
    
    get items() {
        return this.currentCollection.entries || [];
    }
    
    get hasItems() {
        return this.items.length > 0;
    }
    
    get totalCount() {
        return this.currentCollection.total_count || 0;
    }
    
    get hasMore() {
        return this.currentOffset + this.pageSize < this.totalCount;
    }
    
    get isListView() {
        return this.viewMode === VIEW_MODE_LIST;
    }
    
    get isGridView() {
        return this.viewMode === VIEW_MODE_GRID;
    }
    
    get showError() {
        return this.view === VIEW_ERROR;
    }
    
    get showContent() {
        return !this.showError && !this.isLoading;
    }
    
    get canNavigateUp() {
        return this.breadcrumbs.length > 1;
    }
    
    get currentFolderName() {
        if (this.breadcrumbs.length > 0) {
            return this.breadcrumbs[this.breadcrumbs.length - 1].name;
        }
        return 'Files';
    }
    
    get hasSelection() {
        return this.selectedItems.length > 0;
    }
    
    get selectionCount() {
        return this.selectedItems.length;
    }
    
    connectedCallback() {
        if (this.token) {
            this.initializeBoxApiService();
            this.loadInitialContent();
        }
    }
    
    initializeBoxApiService() {
        this.boxApiService = createBoxApiService({
            token: this.token,
            apiHost: this.apiHost,
            sharedLink: this.sharedLink,
            sharedLinkPassword: this.sharedLinkPassword,
            clientName: 'BoxContentExplorer-LWC'
        });
    }
    
    loadInitialContent() {
        switch (this.defaultView) {
            case 'recents':
                this.showRecents();
                break;
            case 'search':
                this.view = VIEW_SEARCH;
                break;
            default:
                this.fetchFolder(this.rootFolderId);
        }
    }
    
    async fetchFolder(folderId = DEFAULT_ROOT, resetOffset = true) {
        if (!this.boxApiService) return;
        
        this.isLoading = true;
        this.view = VIEW_FOLDER;
        
        if (resetOffset) {
            this.currentOffset = 0;
            this.selectedItems = [];
        }
        
        try {
            const response = await this.boxApiService.getFolderItems(folderId, {
                limit: this.pageSize,
                offset: this.currentOffset,
                fields: 'id,type,name,size,modified_at,created_at,permissions,shared_link,allowed_shared_link_access_levels'
            });
            
            this.currentCollection = response;
            
            // Update breadcrumbs
            if (resetOffset) {
                await this.updateBreadcrumbs(folderId);
            }
            
            // Dispatch navigation event
            this.dispatchEvent(new CustomEvent('navigate', {
                detail: { 
                    id: folderId,
                    collection: response
                },
                bubbles: true,
                composed: true
            }));
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async updateBreadcrumbs(folderId) {
        if (folderId === DEFAULT_ROOT) {
            this.breadcrumbs = [{
                id: DEFAULT_ROOT,
                name: 'All Files',
                type: TYPE_FOLDER
            }];
            return;
        }
        
        try {
            const folder = await this.boxApiService.getFolderInfo(folderId);
            const pathCollection = folder.path_collection || { entries: [] };
            
            this.breadcrumbs = [
                {
                    id: DEFAULT_ROOT,
                    name: 'All Files',
                    type: TYPE_FOLDER
                },
                ...pathCollection.entries,
                {
                    id: folder.id,
                    name: folder.name,
                    type: TYPE_FOLDER
                }
            ];
        } catch (error) {
            console.error('Failed to update breadcrumbs:', error);
        }
    }
    
    async showRecents() {
        if (!this.boxApiService) return;
        
        this.isLoading = true;
        this.view = VIEW_RECENTS;
        this.breadcrumbs = [{
            id: 'recents',
            name: 'Recent Files',
            type: 'recents'
        }];
        
        try {
            const response = await this.boxApiService.getRecents({
                limit: this.pageSize,
                fields: 'id,type,name,size,modified_at,created_at,permissions,shared_link'
            });
            
            this.currentCollection = response;
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async search(query) {
        if (!this.boxApiService || !query.trim()) return;
        
        this.isLoading = true;
        this.view = VIEW_SEARCH;
        this.searchQuery = query;
        
        try {
            const response = await this.boxApiService.search(query, {
                limit: this.pageSize,
                offset: this.currentOffset,
                fields: 'id,type,name,size,modified_at,created_at,permissions,shared_link'
            });
            
            this.currentCollection = response;
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    handleSearchInput(event) {
        const query = event.target.value;
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            if (query.trim()) {
                this.search(query);
            } else {
                // Return to folder view if search is cleared
                this.fetchFolder(this.getCurrentFolderId());
            }
        }, SEARCH_DEBOUNCE_MS);
    }
    
    getCurrentFolderId() {
        if (this.breadcrumbs.length > 0) {
            return this.breadcrumbs[this.breadcrumbs.length - 1].id;
        }
        return this.rootFolderId;
    }
    
    handleItemClick(event) {
        const { itemId, itemType } = event.detail;
        const item = this.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        if (itemType === TYPE_FOLDER) {
            this.fetchFolder(itemId);
        } else {
            // File or weblink
            if (this.isPickerMode) {
                this.toggleItemSelection(item);
            } else if (this.canPreview) {
                this.previewItem(item);
            }
        }
        
        // Dispatch select event
        this.dispatchEvent(new CustomEvent('select', {
            detail: { item },
            bubbles: true,
            composed: true
        }));
    }
    
    toggleItemSelection(item) {
        const index = this.selectedItems.findIndex(i => i.id === item.id);
        
        if (index >= 0) {
            // Remove from selection
            this.selectedItems = this.selectedItems.filter(i => i.id !== item.id);
        } else {
            // Add to selection
            if (this.canSelectMultiple) {
                this.selectedItems = [...this.selectedItems, item];
            } else {
                this.selectedItems = [item];
            }
        }
    }
    
    handleBreadcrumbClick(event) {
        const { folderId } = event.detail;
        
        if (folderId === 'recents') {
            this.showRecents();
        } else {
            this.fetchFolder(folderId);
        }
    }
    
    handleSort(event) {
        const { sortBy, sortDirection } = event.detail;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
        
        // Re-fetch current view with new sort
        if (this.view === VIEW_FOLDER) {
            this.fetchFolder(this.getCurrentFolderId());
        } else if (this.view === VIEW_SEARCH) {
            this.search(this.searchQuery);
        }
    }
    
    handleViewModeChange(event) {
        this.viewMode = event.detail.viewMode;
    }
    
    handlePageChange(event) {
        const { offset } = event.detail;
        this.currentOffset = offset;
        
        if (this.view === VIEW_FOLDER) {
            this.fetchFolder(this.getCurrentFolderId(), false);
        } else if (this.view === VIEW_SEARCH) {
            this.search(this.searchQuery);
        }
    }
    
    // Modal handlers
    showCreateFolderModal() {
        this.isCreateFolderModalOpen = true;
    }
    
    showUploadModal() {
        this.isUploadModalOpen = true;
    }
    
    hideUploadModal() {
        this.isUploadModalOpen = false;
    }
    
    hideCreateFolderModal() {
        this.isCreateFolderModalOpen = false;
    }
    
    async handleCreateFolder(event) {
        const { folderName } = event.detail;
        
        if (!this.boxApiService || !folderName) return;
        
        try {
            const parentId = this.getCurrentFolderId();
            const newFolder = await this.boxApiService.createFolder(folderName, parentId);
            
            // Refresh current folder
            this.fetchFolder(parentId);
            
            // Dispatch create event
            this.dispatchEvent(new CustomEvent('create', {
                detail: { item: newFolder },
                bubbles: true,
                composed: true
            }));
            
            this.hideCreateFolderModal();
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    showDeleteModal(item) {
        this.selectedItem = item;
        this.isDeleteModalOpen = true;
    }
    
    hideDeleteModal() {
        this.isDeleteModalOpen = false;
        this.selectedItem = null;
    }
    
    async handleDelete() {
        if (!this.boxApiService || !this.selectedItem) return;
        
        try {
            await this.boxApiService.deleteItem(this.selectedItem.id, this.selectedItem.type);
            
            // Refresh current folder
            this.fetchFolder(this.getCurrentFolderId());
            
            // Dispatch delete event
            this.dispatchEvent(new CustomEvent('delete', {
                detail: { item: this.selectedItem },
                bubbles: true,
                composed: true
            }));
            
            this.hideDeleteModal();
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    showRenameModal(item) {
        this.selectedItem = item;
        this.isRenameModalOpen = true;
    }
    
    hideRenameModal() {
        this.isRenameModalOpen = false;
        this.selectedItem = null;
    }
    
    async handleRename(event) {
        const { newName } = event.detail;
        
        if (!this.boxApiService || !this.selectedItem || !newName) return;
        
        try {
            const updatedItem = await this.boxApiService.renameItem(
                this.selectedItem.id,
                this.selectedItem.type,
                newName
            );
            
            // Update item in collection
            this.updateItemInCollection(updatedItem);
            
            // Dispatch rename event
            this.dispatchEvent(new CustomEvent('rename', {
                detail: { item: updatedItem },
                bubbles: true,
                composed: true
            }));
            
            this.hideRenameModal();
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    updateItemInCollection(updatedItem) {
        const items = [...this.items];
        const index = items.findIndex(item => item.id === updatedItem.id);
        
        if (index >= 0) {
            items[index] = updatedItem;
            this.currentCollection = {
                ...this.currentCollection,
                entries: items
            };
        }
    }
    
    previewItem(item) {
        this.selectedItem = item;
        this.isPreviewModalOpen = true;
        
        // Dispatch preview event
        this.dispatchEvent(new CustomEvent('preview', {
            detail: { item },
            bubbles: true,
            composed: true
        }));
    }
    
    hidePreviewModal() {
        this.isPreviewModalOpen = false;
        this.selectedItem = null;
    }
    
    async downloadItem(item) {
        if (!this.boxApiService) return;
        
        try {
            const downloadUrl = await this.boxApiService.getDownloadUrl(item.id);
            
            // Open download URL
            window.open(downloadUrl, '_blank');
            
            // Dispatch download event
            this.dispatchEvent(new CustomEvent('download', {
                detail: { item },
                bubbles: true,
                composed: true
            }));
            
        } catch (error) {
            this.handleError(error);
        }
    }
    
    handleError(error) {
        console.error('Box Content Explorer Error:', error);
        this.view = VIEW_ERROR;
        this.errorMessage = error.message || 'An error occurred';
        this.isLoading = false;
    }
    
    // Picker mode methods
    handleChoose() {
        if (!this.hasSelection) return;
        
        this.dispatchEvent(new CustomEvent('choose', {
            detail: { 
                items: this.canSelectMultiple ? this.selectedItems : this.selectedItems[0]
            },
            bubbles: true,
            composed: true
        }));
    }
    
    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel', {
            bubbles: true,
            composed: true
        }));
    }
    
    handleItemAction(event) {
        const { action, item } = event.detail;
        
        switch (action) {
            case 'preview':
                this.previewItem(item);
                break;
            case 'download':
                this.downloadItem(item);
                break;
            case 'rename':
                this.showRenameModal(item);
                break;
            case 'share':
                this.showShareModal(item);
                break;
            case 'delete':
                this.showDeleteModal(item);
                break;
        }
    }
    
    showShareModal(item) {
        this.selectedItem = item;
        this.isShareModalOpen = true;
    }
    
    hideShareModal() {
        this.isShareModalOpen = false;
        this.selectedItem = null;
    }
    
    async handleUploadSuccess(event) {
        const { files } = event.detail;
        
        // Refresh current folder
        this.fetchFolder(this.getCurrentFolderId());
        
        // Dispatch upload event
        this.dispatchEvent(new CustomEvent('upload', {
            detail: { files },
            bubbles: true,
            composed: true
        }));
        
        this.hideUploadModal();
    }
}