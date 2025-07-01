import { LightningElement, api } from 'lwc';

export default class BoxExplorerList extends LightningElement {
    @api items = [];
    @api selectedItems = [];
    @api isPickerMode = false;
    @api canPreview = false;
    @api canDownload = false;
    @api canDelete = false;
    @api canRename = false;
    @api canShare = false;
    @api sortBy = 'name';
    @api sortDirection = 'ASC';
    
    get selectedItemIds() {
        return this.selectedItems.map(item => item.id);
    }
    
    get hideCheckboxColumn() {
        return !this.isPickerMode;
    }
    
    get columns() {
        const cols = [];
        
        // Selection column for picker mode
        if (this.isPickerMode) {
            cols.push({
                type: 'selection',
                fieldName: 'id',
                fixedWidth: 50
            });
        }
        
        // Name column
        cols.push({
            label: 'Name',
            fieldName: 'name',
            type: 'button',
            sortable: true,
            typeAttributes: {
                label: { fieldName: 'name' },
                variant: 'base',
                iconName: { fieldName: 'iconName' }
            }
        });
        
        // Size column
        cols.push({
            label: 'Size',
            fieldName: 'formattedSize',
            type: 'text',
            sortable: true,
            cellAttributes: { alignment: 'right' }
        });
        
        // Modified date column
        cols.push({
            label: 'Modified',
            fieldName: 'modified_at',
            type: 'date',
            sortable: true,
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }
        });
        
        // Actions column
        if (!this.isPickerMode) {
            const actions = [];
            if (this.canPreview) actions.push({ label: 'Preview', name: 'preview' });
            if (this.canDownload) actions.push({ label: 'Download', name: 'download' });
            if (this.canRename) actions.push({ label: 'Rename', name: 'rename' });
            if (this.canShare) actions.push({ label: 'Share', name: 'share' });
            if (this.canDelete) actions.push({ label: 'Delete', name: 'delete' });
            
            if (actions.length > 0) {
                cols.push({
                    type: 'action',
                    typeAttributes: { rowActions: actions }
                });
            }
        }
        
        return cols;
    }
    
    get formattedItems() {
        return this.items.map(item => ({
            ...item,
            iconName: this.getIconName(item),
            formattedSize: this.formatFileSize(item.size),
            isSelected: this.selectedItems.some(selected => selected.id === item.id)
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
    
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '-';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        
        this.dispatchEvent(new CustomEvent('itemaction', {
            detail: {
                action: action.name,
                item: this.items.find(item => item.id === row.id)
            },
            bubbles: true,
            composed: true
        }));
    }
    
    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        
        this.dispatchEvent(new CustomEvent('selectionchange', {
            detail: { selectedItems: selectedRows },
            bubbles: true,
            composed: true
        }));
    }
    
    handleSort(event) {
        const fieldName = event.detail.fieldName;
        const sortDirection = event.detail.sortDirection;
        
        this.dispatchEvent(new CustomEvent('sort', {
            detail: {
                sortBy: fieldName,
                sortDirection: sortDirection.toUpperCase()
            },
            bubbles: true,
            composed: true
        }));
    }
    
    handleNameClick(event) {
        const itemId = event.detail.row.id;
        const item = this.items.find(i => i.id === itemId);
        
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