import { LightningElement, api } from 'lwc';

export default class BoxPreviewModal extends LightningElement {
    @api isOpen = false;
    @api item = null;
    @api token;
    
    get modalClass() {
        return `slds-modal slds-modal_large ${this.isOpen ? 'slds-fade-in-open' : ''}`;
    }
    
    get backdropClass() {
        return `slds-backdrop ${this.isOpen ? 'slds-backdrop_open' : ''}`;
    }
    
    get itemName() {
        return this.item ? this.item.name : '';
    }
    
    get previewMessage() {
        return `Preview functionality would be implemented here for: ${this.itemName}`;
    }
    
    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}