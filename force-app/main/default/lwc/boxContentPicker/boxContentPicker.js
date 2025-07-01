import { LightningElement, api } from 'lwc';

export default class BoxContentPicker extends LightningElement {
    @api token;
    @api apiHost;
    @api rootFolderId = '0';
    @api sharedLink;
    @api sharedLinkPassword;
    @api canSelectMultiple = false;
    @api maxSelectable = 100;
    @api extensions = [];
    @api defaultView = 'files';
    @api chooseButtonLabel = 'Choose';
    @api cancelButtonLabel = 'Cancel';
    
    handleChoose(event) {
        // Re-dispatch the choose event from the content explorer
        this.dispatchEvent(new CustomEvent('choose', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }
    
    handleCancel(event) {
        // Re-dispatch the cancel event from the content explorer
        this.dispatchEvent(new CustomEvent('cancel', {
            bubbles: true,
            composed: true
        }));
    }
    
    handleNavigate(event) {
        // Re-dispatch navigation events
        this.dispatchEvent(new CustomEvent('navigate', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }
    
    handleSelect(event) {
        // Re-dispatch selection events
        this.dispatchEvent(new CustomEvent('select', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }
}