import { LightningElement, api } from 'lwc';

const STATUS_ERROR = 'error';

export default class BoxUploadsManager extends LightningElement {
    @api items = [];
    @api isExpanded = false;
    @api isVisible = false;
    @api totalProgress = 0;
    @api view = 'upload-empty';
    
    get containerClass() {
        const classes = ['bcu-uploads-manager-container'];
        
        if (this.isExpanded) {
            classes.push('bcu-is-expanded');
        }
        
        if (this.isVisible) {
            classes.push('bcu-is-visible');
        }
        
        return classes.join(' ');
    }
    
    get numFailedUploads() {
        return this.items.filter(item => item.status === STATUS_ERROR).length;
    }
    
    get hasFailedUploads() {
        return this.numFailedUploads > 0;
    }
    
    get hasMultipleFailedUploads() {
        return this.numFailedUploads > 1;
    }
    
    get progressPercent() {
        return Math.round(this.totalProgress || 0);
    }
    
    get progressBarTitle() {
        if (this.hasFailedUploads) {
            return `${this.numFailedUploads} upload${this.hasMultipleFailedUploads ? 's' : ''} failed`;
        }
        return `${this.progressPercent}% complete`;
    }
    
    get toggleIconName() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronup';
    }
    
    get progressStyle() {
        return `width: ${this.progressPercent}%`;
    }
    
    handleToggle() {
        this.dispatchEvent(new CustomEvent('toggle', {
            bubbles: true,
            composed: true
        }));
    }
    
    handleRetryAll() {
        // Dispatch retry action for all failed items
        const failedItems = this.items.filter(item => item.status === STATUS_ERROR);
        
        failedItems.forEach(item => {
            this.dispatchEvent(new CustomEvent('itemaction', {
                detail: {
                    itemId: item.id,
                    action: 'retry'
                },
                bubbles: true,
                composed: true
            }));
        });
    }
    
    handleItemAction(event) {
        // Re-dispatch the event
        this.dispatchEvent(new CustomEvent('itemaction', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }
}