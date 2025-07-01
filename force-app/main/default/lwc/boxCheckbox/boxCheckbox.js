import { LightningElement, api } from 'lwc';

export default class BoxCheckbox extends LightningElement {
    @api className = '';
    @api description;
    @api fieldLabel;
    @api hideLabel = false;
    @api inputClassName;
    @api isChecked = false;
    @api isDisabled = false;
    @api label;
    @api name;
    @api subsection;
    @api tooltip;
    @api value;
    
    uniqueId = `checkbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    get inputId() {
        return this.uniqueId;
    }
    
    get containerClass() {
        const classes = ['checkbox-container'];
        
        if (this.className) {
            classes.push(this.className);
        }
        
        if (this.isDisabled) {
            classes.push('is-disabled', 'bdl-is-disabled');
        }
        
        return classes.join(' ');
    }
    
    get labelClass() {
        const classes = ['bdl-Checkbox-labelTooltipWrapper'];
        
        if (this.hideLabel) {
            classes.push('accessibility-hidden');
        }
        
        return classes.join(' ');
    }
    
    get descriptionId() {
        return this.description ? `description_${this.inputId}` : '';
    }
    
    get ariaDescribedBy() {
        return this.description ? this.descriptionId : '';
    }
    
    handleChange(event) {
        const changeEvent = new CustomEvent('checkboxchange', {
            detail: {
                checked: event.target.checked,
                value: this.value,
                name: this.name,
                originalEvent: event
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(changeEvent);
    }
    
    handleFocus(event) {
        const focusEvent = new CustomEvent('checkboxfocus', {
            detail: { originalEvent: event },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(focusEvent);
    }
    
    handleBlur(event) {
        const blurEvent = new CustomEvent('checkboxblur', {
            detail: { originalEvent: event },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(blurEvent);
    }
}