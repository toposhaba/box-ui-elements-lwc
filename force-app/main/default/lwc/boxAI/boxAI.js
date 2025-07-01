import { LightningElement, api, track } from 'lwc';
import { createBoxApiService } from 'c/boxApiService';

// Box AI API endpoints
const BOX_AI_ASK_ENDPOINT = '/ai/ask';
const BOX_AI_TEXT_GEN_ENDPOINT = '/ai/text_gen';

export default class BoxAI extends LightningElement {
    @api token;
    @api apiHost;
    @api fileId;
    @api folderId;
    @api mode = 'ask'; // 'ask', 'summarize', 'extract'
    @api placeholder = 'Ask a question about this document...';
    
    @track question = '';
    @track response = '';
    @track isLoading = false;
    @track error = null;
    @track conversationHistory = [];
    @track extractedData = {};
    
    boxApiService = null;
    
    get isAskMode() {
        return this.mode === 'ask';
    }
    
    get isSummarizeMode() {
        return this.mode === 'summarize';
    }
    
    get isExtractMode() {
        return this.mode === 'extract';
    }
    
    get hasResponse() {
        return !!this.response;
    }
    
    get hasHistory() {
        return this.conversationHistory.length > 0;
    }
    
    get submitButtonLabel() {
        switch (this.mode) {
            case 'summarize':
                return 'Generate Summary';
            case 'extract':
                return 'Extract Information';
            default:
                return 'Ask';
        }
    }
    
    get modeTitle() {
        switch (this.mode) {
            case 'summarize':
                return 'Document Summary';
            case 'extract':
                return 'Information Extraction';
            default:
                return 'Ask Box AI';
        }
    }
    
    connectedCallback() {
        if (this.token) {
            this.initializeBoxApiService();
            
            // Auto-generate summary if in summarize mode
            if (this.isSummarizeMode && this.fileId) {
                this.generateSummary();
            }
        }
    }
    
    initializeBoxApiService() {
        this.boxApiService = createBoxApiService({
            token: this.token,
            apiHost: this.apiHost,
            clientName: 'BoxAI-LWC'
        });
    }
    
    handleQuestionChange(event) {
        this.question = event.target.value;
    }
    
    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSubmit();
        }
    }
    
    async handleSubmit() {
        if (!this.question.trim() && this.isAskMode) return;
        
        this.isLoading = true;
        this.error = null;
        
        try {
            if (this.isAskMode) {
                await this.askQuestion();
            } else if (this.isExtractMode) {
                await this.extractInformation();
            }
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async askQuestion() {
        if (!this.boxApiService || !this.fileId) return;
        
        const requestBody = {
            mode: 'single_item_qa',
            prompt: this.question,
            items: [{
                id: this.fileId,
                type: 'file'
            }]
        };
        
        try {
            const response = await this.makeBoxAIRequest(BOX_AI_ASK_ENDPOINT, requestBody);
            
            this.response = response.answer;
            
            // Add to conversation history
            this.conversationHistory = [...this.conversationHistory, {
                id: Date.now(),
                question: this.question,
                answer: response.answer,
                timestamp: new Date().toISOString()
            }];
            
            // Clear question input
            this.question = '';
            
            // Dispatch event
            this.dispatchEvent(new CustomEvent('response', {
                detail: {
                    question: this.question,
                    answer: response.answer
                },
                bubbles: true,
                composed: true
            }));
            
        } catch (error) {
            throw error;
        }
    }
    
    async generateSummary() {
        if (!this.boxApiService || !this.fileId) return;
        
        this.isLoading = true;
        this.error = null;
        
        const requestBody = {
            prompt: "Provide a comprehensive summary of this document including key points, main topics, and important conclusions.",
            items: [{
                id: this.fileId,
                type: 'file'
            }]
        };
        
        try {
            const response = await this.makeBoxAIRequest(BOX_AI_TEXT_GEN_ENDPOINT, requestBody);
            
            this.response = response.answer;
            
            // Dispatch event
            this.dispatchEvent(new CustomEvent('summary', {
                detail: {
                    summary: response.answer,
                    fileId: this.fileId
                },
                bubbles: true,
                composed: true
            }));
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    async extractInformation() {
        if (!this.boxApiService || !this.fileId) return;
        
        const extractionPrompt = this.question || "Extract key information including: names, dates, amounts, addresses, and any other important data points.";
        
        const requestBody = {
            prompt: extractionPrompt,
            items: [{
                id: this.fileId,
                type: 'file'
            }]
        };
        
        try {
            const response = await this.makeBoxAIRequest(BOX_AI_TEXT_GEN_ENDPOINT, requestBody);
            
            this.response = response.answer;
            
            // Try to parse structured data if possible
            try {
                this.extractedData = this.parseExtractedData(response.answer);
            } catch (e) {
                // If parsing fails, just use the raw response
                this.extractedData = { raw: response.answer };
            }
            
            // Dispatch event
            this.dispatchEvent(new CustomEvent('extract', {
                detail: {
                    extractedText: response.answer,
                    extractedData: this.extractedData,
                    fileId: this.fileId
                },
                bubbles: true,
                composed: true
            }));
            
        } catch (error) {
            throw error;
        }
    }
    
    parseExtractedData(text) {
        // Simple parsing logic - can be enhanced based on needs
        const data = {};
        
        // Extract dates
        const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
        const dates = text.match(dateRegex);
        if (dates) data.dates = dates;
        
        // Extract amounts/currency
        const amountRegex = /\$[\d,]+\.?\d*/g;
        const amounts = text.match(amountRegex);
        if (amounts) data.amounts = amounts;
        
        // Extract emails
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex);
        if (emails) data.emails = emails;
        
        // Extract phone numbers
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        const phones = text.match(phoneRegex);
        if (phones) data.phones = phones;
        
        return data;
    }
    
    async makeBoxAIRequest(endpoint, body) {
        const url = `${this.boxApiService.getBaseApiUrl()}${endpoint}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...this.boxApiService.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Box AI request failed');
        }
        
        return response.json();
    }
    
    handleError(error) {
        console.error('Box AI Error:', error);
        this.error = error.message || 'An error occurred while processing your request';
        
        // Dispatch error event
        this.dispatchEvent(new CustomEvent('error', {
            detail: { error: this.error },
            bubbles: true,
            composed: true
        }));
    }
    
    clearHistory() {
        this.conversationHistory = [];
        this.response = '';
        this.extractedData = {};
    }
    
    handleClearHistory() {
        this.clearHistory();
    }
    
    handleRetry() {
        this.error = null;
        if (this.isSummarizeMode) {
            this.generateSummary();
        } else if (this.question) {
            this.handleSubmit();
        }
    }
}