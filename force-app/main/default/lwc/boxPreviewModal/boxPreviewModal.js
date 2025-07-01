import { LightningElement, api, track } from 'lwc';

export default class BoxPreviewModal extends LightningElement {
    @api isOpen = false;
    @api item = null;
    @api token;
    @api apiHost;
    @api sharedLink;
    @api sharedLinkPassword;
    @api showAnnotations = false;
    @api canDownload = true;
    @api canPrint = true;
    
    @track previewError = null;
    
    get modalClass() {
        return `slds-modal slds-modal_large ${this.isOpen ? 'slds-fade-in-open' : ''}`;
    }
    
    get backdropClass() {
        return `slds-backdrop ${this.isOpen ? 'slds-backdrop_open' : ''}`;
    }
    
    get itemName() {
        return this.item ? this.item.name : '';
    }
    
    get fileId() {
        return this.item ? this.item.id : null;
    }
    
    get showPreview() {
        return this.isOpen && this.fileId && this.token;
    }
    
    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
    
    handlePreviewLoad(event) {
        console.log('Preview loaded:', event.detail);
        this.previewError = null;
    }
    
    handlePreviewError(event) {
        console.error('Preview error:', event.detail);
        this.previewError = event.detail.error;
    }
    
    handleDownload() {
        const preview = this.template.querySelector('c-box-content-preview');
        if (preview) {
            preview.download();
        }
    }
    
    handlePrint() {
        const preview = this.template.querySelector('c-box-content-preview');
        if (preview) {
            preview.print();
        }
    }
    
    handleFullscreen() {
        const preview = this.template.querySelector('c-box-content-preview');
        if (preview) {
            preview.toggleFullscreen();
        }
    }
}