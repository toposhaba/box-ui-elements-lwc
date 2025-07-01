import { LightningElement, api } from 'lwc';

export default class BoxExplorerFooter extends LightningElement {
    @api currentOffset = 0;
    @api pageSize = 50;
    @api totalCount = 0;
    @api hasMore = false;
    
    get currentPage() {
        return Math.floor(this.currentOffset / this.pageSize) + 1;
    }
    
    get totalPages() {
        return Math.ceil(this.totalCount / this.pageSize);
    }
    
    get hasPrevious() {
        return this.currentOffset > 0;
    }
    
    get hasNext() {
        return this.hasMore || (this.currentOffset + this.pageSize < this.totalCount);
    }
    
    get startRecord() {
        return this.totalCount === 0 ? 0 : this.currentOffset + 1;
    }
    
    get endRecord() {
        const end = this.currentOffset + this.pageSize;
        return end > this.totalCount ? this.totalCount : end;
    }
    
    handlePrevious() {
        if (this.hasPrevious) {
            const newOffset = Math.max(0, this.currentOffset - this.pageSize);
            this.dispatchPageChange(newOffset);
        }
    }
    
    handleNext() {
        if (this.hasNext) {
            const newOffset = this.currentOffset + this.pageSize;
            this.dispatchPageChange(newOffset);
        }
    }
    
    dispatchPageChange(offset) {
        this.dispatchEvent(new CustomEvent('pagechange', {
            detail: { offset },
            bubbles: true,
            composed: true
        }));
    }
}