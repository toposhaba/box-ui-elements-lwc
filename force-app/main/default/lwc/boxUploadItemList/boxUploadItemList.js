import { LightningElement, api } from 'lwc';

export default class BoxUploadItemList extends LightningElement {
    @api items = [];
    
    get hasItems() {
        return this.items && this.items.length > 0;
    }
    
    handleItemAction(event) {
        // Re-dispatch the event from the child component
        this.dispatchEvent(new CustomEvent('itemaction', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }
}