import { LightningElement, api } from 'lwc';

export default class BoxDeleteModal extends LightningElement {
    @api isOpen = false;
    @api item = null;
    
    get modalClass() {
        return `slds-modal ${this.isOpen ? 'slds-fade-in-open' : ''}`;
    }
    
    get backdropClass() {
        return `slds-backdrop ${this.isOpen ? 'slds-backdrop_open' : ''}`;
    }
    
    get itemName() {
        return this.item ? this.item.name : '';
    }
    
    get itemType() {
        return this.item && this.item.type === 'folder' ? 'folder' : 'file';
    }
    
    handleCancel() {
        this.dispatchEvent(new CustomEvent('close'));
    }
    
    handleDelete() {
        this.dispatchEvent(new CustomEvent('delete', {
            bubbles: true,
            composed: true
        }));
    }
}