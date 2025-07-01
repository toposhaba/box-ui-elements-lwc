import { LightningElement, api } from 'lwc';

export default class BoxLoadingIndicator extends LightningElement {
    @api className = '';
    @api size = 'default'; // small, medium, large, default

    get containerClass() {
        const classes = ['crawler'];
        
        if (this.className) {
            classes.push(this.className);
        }
        
        classes.push(`is-${this.size}`);
        
        return classes.join(' ');
    }
}