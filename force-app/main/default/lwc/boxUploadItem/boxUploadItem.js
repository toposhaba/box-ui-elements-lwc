import { LightningElement, api } from 'lwc';

const STATUS_PENDING = 'pending';
const STATUS_IN_PROGRESS = 'inprogress';
const STATUS_COMPLETE = 'complete';
const STATUS_ERROR = 'error';

export default class BoxUploadItem extends LightningElement {
    @api item;
    
    get itemClass() {
        const classes = ['bcu-upload-item'];
        
        if (this.item && this.item.status) {
            classes.push(`bcu-status-${this.item.status}`);
        }
        
        return classes.join(' ');
    }
    
    get isPending() {
        return this.item && this.item.status === STATUS_PENDING;
    }
    
    get isInProgress() {
        return this.item && this.item.status === STATUS_IN_PROGRESS;
    }
    
    get isComplete() {
        return this.item && this.item.status === STATUS_COMPLETE;
    }
    
    get isError() {
        return this.item && this.item.status === STATUS_ERROR;
    }
    
    get showProgress() {
        return this.isInProgress || (this.item && this.item.progress > 0 && this.item.progress < 100);
    }
    
    get progressPercent() {
        return this.item ? Math.round(this.item.progress || 0) : 0;
    }
    
    get progressStyle() {
        return `width: ${this.progressPercent}%`;
    }
    
    get statusIcon() {
        if (this.isComplete) {
            return 'utility:success';
        }
        if (this.isError) {
            return 'utility:error';
        }
        if (this.isInProgress) {
            return 'utility:spinner';
        }
        return 'utility:file';
    }
    
    get statusIconVariant() {
        if (this.isComplete) {
            return 'success';
        }
        if (this.isError) {
            return 'error';
        }
        return 'default';
    }
    
    get fileSize() {
        if (!this.item || !this.item.size) return '';
        
        const size = this.item.size;
        if (size < 1024) return `${size} B`;
        if (size < 1048576) return `${Math.round(size / 1024)} KB`;
        return `${(size / 1048576).toFixed(1)} MB`;
    }
    
    get uploadSpeed() {
        if (!this.item || !this.item.speed || !this.isInProgress) return '';
        
        const speed = this.item.speed;
        if (speed < 1024) return `${Math.round(speed)} B/s`;
        if (speed < 1048576) return `${Math.round(speed / 1024)} KB/s`;
        return `${(speed / 1048576).toFixed(1)} MB/s`;
    }
    
    get statusText() {
        if (this.isComplete) return 'Complete';
        if (this.isError) return this.item.error || 'Upload failed';
        if (this.isInProgress) return `${this.progressPercent}% - ${this.uploadSpeed}`;
        if (this.isPending) return 'Waiting...';
        return '';
    }
    
    get showRetryButton() {
        return this.isError;
    }
    
    get showRemoveButton() {
        return !this.isInProgress;
    }
    
    handleRetry() {
        this.dispatchEvent(new CustomEvent('itemaction', {
            detail: {
                itemId: this.item.id,
                action: 'retry'
            },
            bubbles: true,
            composed: true
        }));
    }
    
    handleRemove() {
        this.dispatchEvent(new CustomEvent('itemaction', {
            detail: {
                itemId: this.item.id,
                action: 'remove'
            },
            bubbles: true,
            composed: true
        }));
    }
}