import { LightningElement, api } from 'lwc';

export default class BoxCheckboxTooltip extends LightningElement {
    @api tooltip;
    
    get iconTitle() {
        return 'Info'; // In a real implementation, this would come from custom labels
    }
}