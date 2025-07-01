import { LightningElement, api, track } from 'lwc';
import { createBoxApiService } from 'c/boxApiService';

export default class BoxContentSidebar extends LightningElement {
    @api fileId;
    @api token;
    @api apiHost;
    @api sharedLink;
    @api sharedLinkPassword;
    @api showActivityFeed = true;
    @api showDetails = true;
    @api showSkills = true;
    @api showMetadata = true;
    @api showVersions = true;
    @api showAI = true;
    @api defaultPanel = 'details';
    
    @track activeTab = 'details';
    @track file = null;
    @track isLoading = true;
    @track error = null;
    @track fileDetails = {};
    @track fileVersions = [];
    @track fileActivity = [];
    @track fileSkills = {};
    @track fileMetadata = {};
    
    boxApiService = null;
    
    get tabs() {
        const tabs = [];
        
        if (this.showDetails) {
            tabs.push({ id: 'details', label: 'Details', icon: 'utility:info' });
        }
        if (this.showActivityFeed) {
            tabs.push({ id: 'activity', label: 'Activity', icon: 'utility:activity' });
        }
        if (this.showAI) {
            tabs.push({ id: 'ai', label: 'Box AI', icon: 'utility:einstein' });
        }
        if (this.showVersions) {
            tabs.push({ id: 'versions', label: 'Versions', icon: 'utility:layers' });
        }
        if (this.showSkills) {
            tabs.push({ id: 'skills', label: 'Skills', icon: 'utility:knowledge_base' });
        }
        if (this.showMetadata) {
            tabs.push({ id: 'metadata', label: 'Metadata', icon: 'utility:database' });
        }
        
        return tabs;
    }
    
    get showDetailsTab() {
        return this.activeTab === 'details' && this.showDetails;
    }
    
    get showActivityTab() {
        return this.activeTab === 'activity' && this.showActivityFeed;
    }
    
    get showAITab() {
        return this.activeTab === 'ai' && this.showAI;
    }
    
    get showVersionsTab() {
        return this.activeTab === 'versions' && this.showVersions;
    }
    
    get showSkillsTab() {
        return this.activeTab === 'skills' && this.showSkills;
    }
    
    get showMetadataTab() {
        return this.activeTab === 'metadata' && this.showMetadata;
    }
    
    get formattedFileSize() {
        if (!this.file || !this.file.size) return '-';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const bytes = this.file.size;
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    get formattedModifiedDate() {
        if (!this.file || !this.file.modified_at) return '-';
        
        return new Date(this.file.modified_at).toLocaleString();
    }
    
    get formattedCreatedDate() {
        if (!this.file || !this.file.created_at) return '-';
        
        return new Date(this.file.created_at).toLocaleString();
    }
    
    connectedCallback() {
        this.activeTab = this.defaultPanel;
        
        if (this.token && this.fileId) {
            this.initializeBoxApiService();
            this.loadFileInfo();
        }
    }
    
    initializeBoxApiService() {
        this.boxApiService = createBoxApiService({
            token: this.token,
            apiHost: this.apiHost,
            sharedLink: this.sharedLink,
            sharedLinkPassword: this.sharedLinkPassword,
            clientName: 'BoxContentSidebar-LWC'
        });
    }
    
    async loadFileInfo() {
        this.isLoading = true;
        this.error = null;
        
        try {
            // Fetch file information with all fields
            const fields = 'id,type,name,size,created_at,modified_at,description,parent,owned_by,shared_link,permissions,tags,collections,metadata,representations,version_number,comment_count';
            const url = `${this.boxApiService.getBaseApiUrl()}/files/${this.fileId}?fields=${fields}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.boxApiService.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch file information');
            }
            
            this.file = await response.json();
            
            // Load additional data based on active tab
            this.loadTabData();
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async loadTabData() {
        switch (this.activeTab) {
            case 'activity':
                await this.loadActivity();
                break;
            case 'versions':
                await this.loadVersions();
                break;
            case 'skills':
                await this.loadSkills();
                break;
            case 'metadata':
                await this.loadMetadata();
                break;
        }
    }
    
    async loadActivity() {
        try {
            const url = `${this.boxApiService.getBaseApiUrl()}/files/${this.fileId}/activities`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.boxApiService.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.fileActivity = data.entries || [];
            }
        } catch (error) {
            console.error('Failed to load activity:', error);
        }
    }
    
    async loadVersions() {
        try {
            const url = `${this.boxApiService.getBaseApiUrl()}/files/${this.fileId}/versions`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.boxApiService.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.fileVersions = data.entries || [];
            }
        } catch (error) {
            console.error('Failed to load versions:', error);
        }
    }
    
    async loadSkills() {
        try {
            const url = `${this.boxApiService.getBaseApiUrl()}/files/${this.fileId}/metadata/global/boxSkillsCards`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.boxApiService.getHeaders()
            });
            
            if (response.ok) {
                this.fileSkills = await response.json();
            }
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    }
    
    async loadMetadata() {
        try {
            const url = `${this.boxApiService.getBaseApiUrl()}/files/${this.fileId}/metadata`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.boxApiService.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                this.fileMetadata = data.entries || [];
            }
        } catch (error) {
            console.error('Failed to load metadata:', error);
        }
    }
    
    handleTabClick(event) {
        const tabId = event.currentTarget.dataset.tabId;
        if (tabId !== this.activeTab) {
            this.activeTab = tabId;
            this.loadTabData();
        }
    }
    
    handleError(error) {
        console.error('Box Content Sidebar Error:', error);
        this.error = error.message || 'An error occurred';
    }
    
    handleAIResponse(event) {
        console.log('AI Response:', event.detail);
    }
    
    handleDownloadVersion(event) {
        const versionId = event.currentTarget.dataset.versionId;
        // Implement version download
        console.log('Download version:', versionId);
    }
    
    handlePromoteVersion(event) {
        const versionId = event.currentTarget.dataset.versionId;
        // Implement version promotion
        console.log('Promote version:', versionId);
    }
    
    @api
    refresh() {
        this.loadFileInfo();
    }
}