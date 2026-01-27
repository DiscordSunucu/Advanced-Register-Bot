/**
 * DCSV.ME API Service
 * Handles all API calls with rate limiting and caching
 */
const axios = require('axios');
const config = require('../../config');
const Bottleneck = require('bottleneck');
const NodeCache = require('node-cache');

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: config.api.baseURL,
            timeout: 10000,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'User-Agent': config.api.userAgent,
                'Accept': 'application/json'
            }
        });

        // Rate limiter: 2 requests per second
        this.limiter = new Bottleneck({
            minTime: 500,
            maxConcurrent: 2
        });

        // Cache: 60 seconds TTL
        this.cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
    }

    /**
     * Get user basic info
     */
    async getUserInfo(userId) {
        const cacheKey = `user_${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.limiter.schedule(() =>
                this.client.get(`/user/${userId}`)
            );
            if (response.data?.success) {
                this.cache.set(cacheKey, response.data.data);
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error(`[API] getUserInfo error for ${userId}:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get user trust score and punishment count
     */
    async getUserTrust(userId) {
        const cacheKey = `trust_${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.limiter.schedule(() =>
                this.client.get(`/user/${userId}/trust`)
            );
            if (response.data?.success) {
                this.cache.set(cacheKey, response.data.data);
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error(`[API] getUserTrust error for ${userId}:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get user ban/punishment history (SİCİL)
     */
    async getUserBans(userId) {
        const cacheKey = `bans_${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.limiter.schedule(() =>
                this.client.get(`/user/${userId}/bans`)
            );
            if (response.data?.success) {
                this.cache.set(cacheKey, response.data.data);
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error(`[API] getUserBans error for ${userId}:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get FULL user profile (combines all endpoints)
     */
    async getFullUserProfile(userId) {
        // 1. Get Trust Data (Most critical and lightweight)
        const trustData = await this.getUserTrust(userId);

        // 2. Conditional: Get Bans only if user has punishments
        let banData = null;
        if (trustData && trustData.punishment_count > 0) {
            banData = await this.getUserBans(userId);
        }

        return {
            user: null, // Removed to save API calls
            trust: trustData,
            bans: banData,
            hasData: !!(trustData || banData)
        };
    }
}

module.exports = new ApiService();
