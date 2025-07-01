import { LightningElement, api } from 'lwc';

export default class BoxExplorerHeader extends LightningElement {
    @api currentFolderName = 'Files';
    @api canCreateNewFolder = true;
    @api canUpload = true;
    @api searchQuery = '';
    @api viewMode = 'list';
    
    get isListView() {
        return this.viewMode === 'list';
    }
    
    get isGridView() {
        return this.viewMode === 'grid';
    }
    
    handleSearch(event) {
        this.dispatchEvent(new CustomEvent('search', {
            detail: { value: event.target.value },
            bubbles: true,
            composed: true
        }));
    }
    
    handleCreateFolder() {
        this.dispatchEvent(new CustomEvent('createfolder', {
            bubbles: true,
            composed: true
        }));
    }
    
    handleUpload() {
        this.dispatchEvent(new CustomEvent('upload', {
            bubbles: true,
            composed: true
        }));
    }
    
    handleViewModeChange(event) {
        const newMode = event.target.dataset.mode;
        this.dispatchEvent(new CustomEvent('viewmodechange', {
            detail: { viewMode: newMode },
            bubbles: true,
            composed: true
        }));
    }
}