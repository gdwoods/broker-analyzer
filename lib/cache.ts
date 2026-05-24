"use client";

import type { StatementData } from "@/app/page";

interface CacheEntry {
  data: StatementData;
  timestamp: number;
  fileHash: string;
}

class DataCache {
  private cache = new Map<string, CacheEntry>();
  private maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private maxSize = 50; // Maximum number of cached entries

  private generateFileHash(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const hash = this.simpleHash(buffer);
        resolve(hash);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  private simpleHash(buffer: ArrayBuffer): string {
    let hash = 0;
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
    }
    return hash.toString(36);
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.maxAge;
  }

  private cleanup(): void {
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (this.isExpired(entry.timestamp)) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const sortedEntries = entries
        .filter(([, entry]) => !this.isExpired(entry.timestamp))
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  async get(file: File): Promise<StatementData | null> {
    try {
      const fileHash = await this.generateFileHash(file);
      const cacheKey = `${file.name}_${file.size}_${fileHash}`;
      const entry = this.cache.get(cacheKey);

      if (entry && !this.isExpired(entry.timestamp)) {
        console.log('📦 Cache hit for file:', file.name);
        return entry.data;
      }

      if (entry) {
        console.log('⏰ Cache expired for file:', file.name);
        this.cache.delete(cacheKey);
      }

      return null;
    } catch (error) {
      console.error('Error checking cache:', error);
      return null;
    }
  }

  async set(file: File, data: StatementData): Promise<void> {
    try {
      const fileHash = await this.generateFileHash(file);
      const cacheKey = `${file.name}_${file.size}_${fileHash}`;
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        fileHash
      });

      console.log('💾 Cached data for file:', file.name);
      this.cleanup();
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  getStats(): { size: number; maxSize: number; oldestEntry?: number } {
    const entries = Array.from(this.cache.values());
    const oldestEntry = entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp))
      : undefined;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestEntry
    };
  }

  // Export cache data for persistence
  exportCache(): string {
    const data = Array.from(this.cache.entries());
    return JSON.stringify(data, null, 2);
  }

  // Import cache data from persistence
  importCache(cacheData: string): void {
    try {
      const data = JSON.parse(cacheData);
      this.cache.clear();
      data.forEach(([key, entry]: [string, CacheEntry]) => {
        this.cache.set(key, entry);
      });
      console.log('📥 Cache imported successfully');
    } catch (error) {
      console.error('Error importing cache:', error);
    }
  }
}

// Create singleton instance
export const dataCache = new DataCache();

// Utility function to get cache stats for debugging
export const getCacheStats = () => dataCache.getStats();

// Utility function to clear cache
export const clearCache = () => dataCache.clear();
