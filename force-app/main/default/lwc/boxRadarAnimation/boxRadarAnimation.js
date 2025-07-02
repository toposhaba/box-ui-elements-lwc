import { LightningElement, api } from 'lwc';

export default class BoxRadarAnimation extends LightningElement {
    @api className = '';
    @api isShown = false;
    
    radarAnimationId = `radarAnimation_${Date.now()}`;
    
    get radarClass() {
        const classes = ['radar'];
        if (this.className) {
            classes.push(this.className);
        }
        return classes.join(' ');
    }
    
    get showRadar() {
        return this.isShown;
    }
}