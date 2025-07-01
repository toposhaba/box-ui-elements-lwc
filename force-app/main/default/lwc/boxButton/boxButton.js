import { LightningElement, api } from 'lwc';

export default class BoxButton extends LightningElement {
    @api className = '';
    @api isDisabled = false;
    @api isLoading = false;
    @api isSelected = false;
    @api showRadar = false;
    @api type = 'submit';
    @api size;
    @api iconName;
    @api iconSize = 20;
    @api label;

    get buttonClass() {
        const classes = ['btn'];
        
        if (this.isDisabled) {
            classes.push('is-disabled', 'bdl-is-disabled');
        }
        if (this.isLoading) {
            classes.push('is-loading');
        }
        if (this.isSelected) {
            classes.push('is-selected');
        }
        if (this.size === 'large') {
            classes.push('bdl-btn--large');
        }
        if (this.iconName) {
            classes.push('bdl-has-icon');
        }
        if (this.className) {
            classes.push(this.className);
        }
        
        return classes.join(' ');
    }

    get computedIconSize() {
        return this.iconName && this.label ? 16 : 20;
    }

    get showContent() {
        return !!this.label;
    }

    get showIcon() {
        return !!this.iconName;
    }

    get ariaDisabled() {
        return this.isDisabled ? 'true' : 'false';
    }

    handleClick(event) {
        if (this.isDisabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // Dispatch custom event for parent components to handle
        const clickEvent = new CustomEvent('buttonclick', {
            detail: { originalEvent: event },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(clickEvent);
    }
}