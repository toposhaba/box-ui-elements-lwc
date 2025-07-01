import { LightningElement, api } from 'lwc';

export default class BoxModal extends LightningElement {
    @api className = '';
    @api focusElementSelector;
    @api isLoading = false;
    @api isOpen = false;
    @api title;
    @api size = 'medium'; // small, medium, large
    
    dialogElement;
    
    get modalClass() {
        const classes = ['slds-modal'];
        
        if (this.isOpen) {
            classes.push('slds-fade-in-open');
        }
        
        if (this.size === 'small') {
            classes.push('slds-modal_small');
        } else if (this.size === 'large') {
            classes.push('slds-modal_large');
        } else {
            classes.push('slds-modal_medium');
        }
        
        if (this.className) {
            classes.push(this.className);
        }
        
        return classes.join(' ');
    }
    
    get backdropClass() {
        return this.isOpen ? 'slds-backdrop slds-backdrop_open' : 'slds-backdrop';
    }
    
    get showModal() {
        return this.isOpen;
    }
    
    renderedCallback() {
        if (this.isOpen && !this.isLoading) {
            this.focusFirstElement();
        }
    }
    
    focusFirstElement() {
        // Focus management
        requestAnimationFrame(() => {
            if (this.focusElementSelector) {
                const element = this.template.querySelector(this.focusElementSelector);
                if (element) {
                    element.focus();
                }
            } else {
                // Focus first tabbable element
                const focusableElements = this.template.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length > 1) {
                    focusableElements[1].focus(); // Skip close button
                } else if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }
        });
    }
    
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            this.handleRequestClose(event);
        }
    }
    
    handleBackdropClick(event) {
        // Only close if clicking directly on backdrop
        if (event.target === event.currentTarget) {
            this.handleRequestClose(event);
        }
    }
    
    handleRequestClose(event) {
        const closeEvent = new CustomEvent('requestclose', {
            detail: { originalEvent: event },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(closeEvent);
    }
    
    handleDialogRef(element) {
        this.dialogElement = element;
    }
}