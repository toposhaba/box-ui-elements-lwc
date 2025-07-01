import { LightningElement, track } from 'lwc';

export default class BoxUIElementsDemo extends LightningElement {
    @track isModalOpen = false;
    @track isLoading = false;
    @track checkboxValue = false;
    @track showRadarAnimation = false;
    @track showPicker = false;
    @track selectedFiles = [];
    @track boxToken = ''; // Set your Box API token here for testing
    
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
    
    // Content Explorer handlers
    handleNavigate(event) {
        console.log('Navigate:', event.detail);
    }
    
    handleSelect(event) {
        console.log('Select:', event.detail);
    }
    
    handleCreate(event) {
        console.log('Create:', event.detail);
    }
    
    handleDelete(event) {
        console.log('Delete:', event.detail);
    }
    
    handleRename(event) {
        console.log('Rename:', event.detail);
    }
    
    handleDownload(event) {
        console.log('Download:', event.detail);
    }
    
    handleUpload(event) {
        console.log('Upload:', event.detail);
    }
    
    // Content Picker handlers
    openPicker() {
        this.showPicker = true;
    }
    
    closePicker() {
        this.showPicker = false;
    }
    
    handleChoose(event) {
        const items = event.detail.items;
        this.selectedFiles = Array.isArray(items) ? items : [items];
        console.log('Files chosen:', this.selectedFiles);
        this.closePicker();
    }
}