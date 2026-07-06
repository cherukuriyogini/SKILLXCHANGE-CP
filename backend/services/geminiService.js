const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-pro";
const MAX_RETRIES = 3;
const REQUEST_DELAY_MS = 2000; // Increased responsiveness, staying safe for free tier (30 RPM/s)

class GeminiService {
  constructor() {
    this.genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
    this.fileManager = process.env.GEMINI_API_KEY ? new GoogleAIFileManager(process.env.GEMINI_API_KEY) : null;
    this.queue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
  }

  isConfigured() {
    return !!this.genAI;
  }

  // Internal delay function
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Process the queue sequentially to respect rate limits
  async _processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < REQUEST_DELAY_MS) {
        await this._delay(REQUEST_DELAY_MS - timeSinceLastRequest);
      }

      const { parts, options, resolve, reject, retryCount, useFallback } = this.queue.shift();
      
      this.lastRequestTime = Date.now();
      
      const modelName = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
      console.log(`[GeminiService] Processing request. Model: ${modelName}. Queue remaining: ${this.queue.length}`);

      try {
        const model = this.genAI.getGenerativeModel({ model: modelName, ...options });
        const result = await model.generateContent(parts);
        resolve(result);
      } catch (err) {
        // Handle 429 Too Many Requests or 503 Service Unavailable
        if ((err.status === 429 || err.status === 503 || err.message.includes('429')) && retryCount < MAX_RETRIES) {
          const backoffDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
          console.warn(`[GeminiService] API Quota/Rate Limit hit. Retrying in ${backoffDelay}ms (Attempt ${retryCount + 1}/${MAX_RETRIES}).`);
          
          // Re-queue at the front with incremented retry count
          // If we are at the last retry, switch to the fallback model
          this.queue.unshift({
            parts,
            options,
            resolve,
            reject,
            retryCount: retryCount + 1,
            useFallback: retryCount + 1 === MAX_RETRIES
          });
          
          await this._delay(backoffDelay); // Wait before continuing the queue
        } else {
          console.error(`[GeminiService] Request failed after ${retryCount} retries. Error: ${err.message}`);
          reject(err);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Enqueues a content generation request.
   * @param {Array|String} parts - The prompt text or array of parts (text + inlineData/fileData)
   * @param {Object} options - Additional model config (e.g. generationConfig)
   * @returns {Promise<any>} The Gemini result object
   */
  generateContent(parts, options = {}) {
    if (!this.isConfigured()) {
      return Promise.reject(new Error("Gemini AI is not configured. Missing API Key."));
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        parts,
        options,
        resolve,
        reject,
        retryCount: 0,
        useFallback: false
      });
      console.log(`[GeminiService] Request enqueued. Queue length: ${this.queue.length}`);
      this._processQueue();
    });
  }
}

module.exports = new GeminiService();
