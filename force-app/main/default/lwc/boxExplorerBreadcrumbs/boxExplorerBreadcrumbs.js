import { LightningElement, api } from 'lwc';

export default class BoxExplorerBreadcrumbs extends LightningElement {
    @api breadcrumbs = [];
    
    get breadcrumbItems() {
        return this.breadcrumbs.map((item, index) => ({
            ...item,
            isLast: index === this.breadcrumbs.length - 1
        }));
    }
    
    handleBreadcrumbClick(event) {
        event.preventDefault();
        const folderId = event.currentTarget.dataset.folderId;
        
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { folderId },
            bubbles: true,
            composed: true
        }));
    }
}