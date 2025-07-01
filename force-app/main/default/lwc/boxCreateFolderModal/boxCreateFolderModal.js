import { LightningElement, api, track } from 'lwc';

export default class BoxCreateFolderModal extends LightningElement {
    @api isOpen = false;
    @track folderName = '';
    @track error = '';
    
    get modalClass() {
        return `slds-modal ${this.isOpen ? 'slds-fade-in-open' : ''}`;
    }
    
    get backdropClass() {
        return `slds-backdrop ${this.isOpen ? 'slds-backdrop_open' : ''}`;
    }
    
    handleFolderNameChange(event) {
        this.folderName = event.target.value;
        this.error = '';
    }
    
    handleCancel() {
        this.resetModal();
        this.dispatchEvent(new CustomEvent('close'));
    }
    
    handleCreate() {
        if (!this.folderName.trim()) {
            this.error = 'Folder name is required';
            return;
        }
        
        // Validate folder name
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(this.folderName)) {
            this.error = 'Folder name contains invalid characters';
            return;
        }
        
        this.dispatchEvent(new CustomEvent('create', {
            detail: { folderName: this.folderName.trim() },
            bubbles: true,
            composed: true
        }));
        
        this.resetModal();
    }
    
    resetModal() {
        this.folderName = '';
        this.error = '';
    }
}