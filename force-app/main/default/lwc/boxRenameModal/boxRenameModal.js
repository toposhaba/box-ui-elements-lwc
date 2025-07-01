import { LightningElement, api, track } from 'lwc';

export default class BoxRenameModal extends LightningElement {
    @api isOpen = false;
    @api item = null;
    @track newName = '';
    @track error = '';
    
    get modalClass() {
        return `slds-modal ${this.isOpen ? 'slds-fade-in-open' : ''}`;
    }
    
    get backdropClass() {
        return `slds-backdrop ${this.isOpen ? 'slds-backdrop_open' : ''}`;
    }
    
    get itemType() {
        return this.item && this.item.type === 'folder' ? 'folder' : 'file';
    }
    
    connectedCallback() {
        if (this.item) {
            this.newName = this.item.name;
        }
    }
    
    renderedCallback() {
        if (this.isOpen && this.item && !this.newName) {
            this.newName = this.item.name;
        }
    }
    
    handleNameChange(event) {
        this.newName = event.target.value;
        this.error = '';
    }
    
    handleCancel() {
        this.resetModal();
        this.dispatchEvent(new CustomEvent('close'));
    }
    
    handleRename() {
        if (!this.newName.trim()) {
            this.error = 'Name is required';
            return;
        }
        
        if (this.newName === this.item.name) {
            this.error = 'Please enter a different name';
            return;
        }
        
        // Validate name
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(this.newName)) {
            this.error = 'Name contains invalid characters';
            return;
        }
        
        this.dispatchEvent(new CustomEvent('rename', {
            detail: { newName: this.newName.trim() },
            bubbles: true,
            composed: true
        }));
        
        this.resetModal();
    }
    
    resetModal() {
        this.newName = '';
        this.error = '';
    }
}