// Box API Service for Lightning Web Components
// This module provides methods for interacting with Box APIs

const DEFAULT_HOSTNAME_API = 'https://api.box.com';
const DEFAULT_HOSTNAME_UPLOAD = 'https://upload.box.com';
const API_VERSION = '2.0';
const MAX_RETRY = 5;
const DEFAULT_RETRY_DELAY_MS = 1000;
const MS_IN_S = 1000;

class BoxApiService {
    constructor(config = {}) {
        this.apiHost = config.apiHost || DEFAULT_HOSTNAME_API;
        this.uploadHost = config.uploadHost || DEFAULT_HOSTNAME_UPLOAD;
        this.token = config.token;
        this.sharedLink = config.sharedLink;
        this.sharedLinkPassword = config.sharedLinkPassword;
        this.clientName = config.clientName || 'BoxContentUploader';
        this.version = API_VERSION;
    }

    /**
     * Get base API URL
     */
    getBaseApiUrl() {
        return `${this.apiHost}/${this.version}`;
    }

    /**
     * Get base upload URL
     */
    getBaseUploadUrl() {
        return `${this.uploadHost}/api/${this.version}`;
    }

    /**
     * Get common headers for API requests
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Box-Client-Name': this.clientName,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (this.sharedLink) {
            headers['BoxApi'] = `shared_link=${this.sharedLink}`;
            if (this.sharedLinkPassword) {
                headers['BoxApi'] += `&shared_link_password=${this.sharedLinkPassword}`;
            }
        }

        return headers;
    }

    /**
     * Make a preflight request for file upload
     */
    async makePreflightRequest(file, folderId, fileName, fileId = null) {
        let url = `${this.getBaseApiUrl()}/files/content`;
        if (fileId) {
            url = url.replace('content', `${fileId}/content`);
        }

        const attributes = {
            name: fileName || file.name,
            parent: { id: folderId },
            size: file.size
        };

        const response = await fetch(url, {
            method: 'OPTIONS',
            headers: this.getHeaders(),
            body: JSON.stringify(attributes)
        });

        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        return response.json();
    }

    /**
     * Upload a file to Box
     */
    async uploadFile(file, folderId, options = {}) {
        const {
            fileName = file.name,
            fileId = null,
            onProgress = () => {},
            onSuccess = () => {},
            onError = () => {},
            overwrite = true,
            retryCount = 0
        } = options;

        try {
            // Make preflight request
            const preflightData = await this.makePreflightRequest(file, folderId, fileName, fileId);
            
            // Use upload URL from preflight if available
            const uploadUrl = preflightData.upload_url || `${this.getBaseUploadUrl()}/files/content`;
            
            // Prepare form data
            const formData = new FormData();
            const attributes = {
                name: fileName,
                parent: { id: folderId }
            };
            
            formData.append('attributes', JSON.stringify(attributes));
            formData.append('file', file);

            // Calculate SHA1 for file integrity
            const sha1 = await this.computeSHA1(file);
            
            // Make upload request
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percent: percentComplete
                    });
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    onSuccess(response.entries);
                } else {
                    const error = JSON.parse(xhr.responseText);
                    this.handleUploadError(error, file, folderId, options);
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                onError({ message: 'Network error occurred' });
            });

            // Open and send request
            xhr.open('POST', uploadUrl);
            
            // Set headers
            const headers = this.getHeaders();
            delete headers['Content-Type']; // Let browser set this for FormData
            
            if (sha1) {
                headers['Content-MD5'] = sha1;
            }
            
            Object.keys(headers).forEach(key => {
                xhr.setRequestHeader(key, headers[key]);
            });

            xhr.send(formData);
            
            return xhr;

        } catch (error) {
            this.handleUploadError(error, file, folderId, options);
        }
    }

    /**
     * Handle upload errors with retry logic
     */
    async handleUploadError(error, file, folderId, options) {
        const { onError, retryCount = 0, overwrite } = options;

        // Handle name conflicts
        if (error.status === 409) {
            if (overwrite === 'error') {
                onError(error);
                return;
            }
            
            if (overwrite && error.context_info?.conflicts?.id) {
                // Retry with file ID to create new version
                options.fileId = error.context_info.conflicts.id;
                options.retryCount = retryCount + 1;
                return this.uploadFile(file, folderId, options);
            } else {
                // Rename file and retry
                const extension = file.name.split('.').pop();
                const baseName = file.name.replace(`.${extension}`, '');
                options.fileName = `${baseName}-${Date.now()}.${extension}`;
                options.retryCount = retryCount + 1;
                return this.uploadFile(file, folderId, options);
            }
        }

        // Handle rate limiting
        if (error.status === 429 || error.code === 'too_many_requests') {
            if (retryCount < MAX_RETRY) {
                const retryAfter = parseInt(error.headers?.['retry-after'] || '1', 10);
                const delay = retryAfter * MS_IN_S;
                
                await new Promise(resolve => setTimeout(resolve, delay));
                options.retryCount = retryCount + 1;
                return this.uploadFile(file, folderId, options);
            }
        }

        // Handle other errors with exponential backoff
        if (retryCount < MAX_RETRY && !error.status) {
            const delay = Math.pow(2, retryCount) * MS_IN_S;
            await new Promise(resolve => setTimeout(resolve, delay));
            options.retryCount = retryCount + 1;
            return this.uploadFile(file, folderId, options);
        }

        // If all retries failed, call error handler
        onError(error);
    }

    /**
     * Calculate SHA1 hash of a file
     */
    async computeSHA1(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error('Failed to compute SHA1:', e);
            return null;
        }
    }

    /**
     * Create a folder in Box
     */
    async createFolder(name, parentId = '0') {
        const url = `${this.getBaseApiUrl()}/folders`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                name,
                parent: { id: parentId }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        return response.json();
    }

    /**
     * Get folder items
     */
    async getFolderItems(folderId = '0', options = {}) {
        const { limit = 100, offset = 0 } = options;
        const url = `${this.getBaseApiUrl()}/folders/${folderId}/items?limit=${limit}&offset=${offset}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw error;
        }

        return response.json();
    }
}

// Export a factory function for creating service instances
export function createBoxApiService(config) {
    return new BoxApiService(config);
}