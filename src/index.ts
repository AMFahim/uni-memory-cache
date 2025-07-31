type CacheEntry<T> = {
  value: T;
  expiresAt: number | null;
  accessTime: number;
};

export default class InMemoryCache<T = any> {
  private store: Map<string, CacheEntry<T>>;
  private ttl: number;
  private maxSize: number;

  constructor(ttl: number = 0, maxSize: number = Infinity) {
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.store = new Map();
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  private evictLRU(): void {
    const firstKey = this.store.keys().next().value;
    if (firstKey) {
      this.store.delete(firstKey);
    }
  }

  private moveToEnd(key: string, entry: CacheEntry<T>): void {
    this.store.delete(key);
    entry.accessTime = Date.now();
    this.store.set(key, entry);
  }

  set(key: string, value: T): void {
    const now = Date.now();
    const expiresAt = this.ttl > 0 ? now + this.ttl : null;
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      accessTime: now
    };

    if (this.store.has(key)) {
      this.store.delete(key);
      this.store.set(key, entry);
      return;
    }

    while (this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    this.store.set(key, entry);
  }

  get(key: string): T | null;
  get(key: string, fallbackFn: () => Promise<T>): Promise<T>;
  get(key: string, fallbackFn?: () => Promise<T>): T | null | Promise<T> {
    const entry = this.store.get(key);

    if (entry) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
      } else {
        this.moveToEnd(key, entry);
        return entry.value;
      }
    }

    if (typeof fallbackFn === 'function') {
      return fallbackFn()
        .then((value) => {
          this.set(key, value);
          return value;
        })
        .catch((error) => {
          throw error;
        });
    }

    return null;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return false;
    }
    
    this.moveToEnd(key, entry);
    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    this.cleanup();
    return this.store.size;
  }

  keys(): IterableIterator<string> {
    this.cleanup(); 
    return this.store.keys();
  }

  values(): T[] {
    this.cleanup();
    return Array.from(this.store.values()).map(entry => entry.value);
  }

  entries(): Array<[string, T]> {
    this.cleanup();
    return Array.from(this.store.entries()).map(([key, entry]) => [key, entry.value]);
  }

  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    
    return removed;
  }

  stats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const entry of this.store.values()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      expired,
      active
    };
  }

  touch(key: string, newTtl?: number): boolean {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      return false;
    }

    const ttlToUse = newTtl !== undefined ? newTtl : this.ttl;
    entry.expiresAt = ttlToUse > 0 ? Date.now() + ttlToUse : null;
    
    this.moveToEnd(key, entry);
    return true;
  }
}