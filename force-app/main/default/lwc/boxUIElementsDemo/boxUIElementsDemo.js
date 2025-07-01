import { LightningElement, track } from 'lwc';

export default class BoxUIElementsDemo extends LightningElement {
    @track isModalOpen = false;
    @track isLoading = false;
    @track checkboxValue = false;
    @track showRadarAnimation = false;
    
    // Button handlers
    handleButtonClick(event) {
        console.log('Button clicked:', event.detail);
        this.showRadarAnimation = true;
        setTimeout(() => {
            this.showRadarAnimation = false;
        }, 3000);
    }
    
    handleOpenModal() {
        this.isModalOpen = true;
    }
    
    handleCloseModal() {
        this.isModalOpen = false;
    }
    
    handleLoadingDemo() {
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 3000);
    }
    
    // Checkbox handlers
    handleCheckboxChange(event) {
        this.checkboxValue = event.detail.checked;
        console.log('Checkbox changed:', event.detail);
    }
    
    // Modal action handlers
    handleModalCancel() {
        this.isModalOpen = false;
    }
    
    handleModalSave() {
        console.log('Saving modal data...');
        this.isModalOpen = false;
    }
    
    // Upload handlers
    handleFilesAdded(event) {
        const files = event.detail.files;
        console.log('Files added:', files);
    }
    
    handleUploadComplete(event) {
        const item = event.detail.item;
        console.log('Upload complete:', item);
    }
    
    handleUploadError(event) {
        const { item, error } = event.detail;
        console.error('Upload error:', item, error);
    }
}