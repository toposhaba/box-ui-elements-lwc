import { LightningElement, api } from 'lwc';

export default class BoxExplorerGrid extends LightningElement {
    @api items = [];
    @api selectedItems = [];
    @api isPickerMode = false;
    
    get formattedItems() {
        return this.items.map(item => ({
            ...item,
            iconName: this.getIconName(item),
            isSelected: this.selectedItems.some(selected => selected.id === item.id),
            thumbnailUrl: this.getThumbnailUrl(item)
        }));
    }
    
    getIconName(item) {
        if (item.type === 'folder') {
            return 'utility:folder';
        }
        
        const extension = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            pdf: 'utility:pdf_ext',
            doc: 'utility:word_ext',
            docx: 'utility:word_ext',
            xls: 'utility:excel_ext',
            xlsx: 'utility:excel_ext',
            ppt: 'utility:ppt_ext',
            pptx: 'utility:ppt_ext',
            jpg: 'utility:image',
            jpeg: 'utility:image',
            png: 'utility:image',
            gif: 'utility:image',
            mp4: 'utility:video',
            mov: 'utility:video',
            mp3: 'utility:volume_high',
            zip: 'utility:zip',
            csv: 'utility:csv'
        };
        
        return iconMap[extension] || 'utility:file';
    }
    
    getThumbnailUrl(item) {
        // Placeholder for thumbnail URL
        // In real implementation, this would use Box's thumbnail API
        return null;
    }
    
    handleItemClick(event) {
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.items.find(i => i.id === itemId);
        
        if (item) {
            this.dispatchEvent(new CustomEvent('itemclick', {
                detail: {
                    itemId: item.id,
                    itemType: item.type
                },
                bubbles: true,
                composed: true
            }));
        }
    }
    
    handleItemAction(event) {
        event.stopPropagation();
        const action = event.currentTarget.dataset.action;
        const itemId = event.currentTarget.dataset.itemId;
        const item = this.items.find(i => i.id === itemId);
        
        if (item) {
            this.dispatchEvent(new CustomEvent('itemaction', {
                detail: {
                    action: action,
                    item: item
                },
                bubbles: true,
                composed: true
            }));
        }
    }
}