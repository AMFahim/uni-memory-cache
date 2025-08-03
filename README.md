# uni-memory-cache (Universal in memory cache)

A high-performance, lightweight TTL (Time-To-Live) and LRU (Least Recently Used) based in-memory cache for both Node.js and browser environments. Built with TypeScript for type safety and excellent developer experience.

[![npm version](https://badge.fury.io/js/uni-memory-cache.svg)](https://badge.fury.io/js/uni-memory-cache)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Use Cases](#use-cases)
- [Technology Compatibility](#technology-compatibility)
- [Examples](#examples)
- [Performance](#performance)
- [License](#license)

## Features

✅ **TTL (Time-To-Live) Support** - Automatic expiration of cache entries  
✅ **LRU (Least Recently Used) Eviction** - Intelligent memory management  
✅ **TypeScript Support** - Full type safety and IntelliSense  
✅ **Universal Compatibility** - Works in Node.js and browsers  
✅ **Async Fallback Functions** - Built-in support for cache-miss handling  
✅ **Memory Efficient** - Configurable size limits  
✅ **Zero Dependencies** - Lightweight and fast  
✅ **Comprehensive API** - Rich set of cache operations  
✅ **Cleanup & Stats** - Built-in maintenance and monitoring  

## Installation

```bash
# Using npm
npm install uni-memory-cache

# Using yarn
yarn add uni-memory-cache

# Using pnpm
pnpm add uni-memory-cache
```

## Quick Start

```typescript
import InMemoryCache from 'uni-memory-cache';

// Create a cache with 5-minute TTL and max 1000 items
const cache = new InMemoryCache<string>(5 * 60 * 1000, 1000);

// Basic operations
cache.set('user:123', 'John Doe');
const user = cache.get('user:123'); // 'John Doe'

// With async fallback
const userData = await cache.get('user:456', async () => {
  const response = await fetch('/api/users/456');
  return response.json();
});
```

## API Reference

### Constructor

```typescript
new InMemoryCache<T>(ttl?: number, maxSize?: number)
```

- `ttl` (optional): Time-to-live in milliseconds. Default: `0` (no expiration)
- `maxSize` (optional): Maximum number of entries. Default: `Infinity`

### Methods

#### `set(key: string, value: T): void`
Stores a value in the cache.

```typescript
cache.set('product:123', { id: 123, name: 'Laptop', price: 999 });
```

#### `get(key: string): T | null`
#### `get(key: string, fallbackFn: () => Promise<T>): Promise<T>`
Retrieves a value from the cache. If not found and fallback is provided, executes the fallback function.

```typescript
// Simple get
const product = cache.get('product:123');

// With async fallback
const product = await cache.get('product:456', async () => {
  return await fetchProductFromAPI(456);
});
```

#### `has(key: string): boolean`
Checks if a key exists and is not expired.

```typescript
if (cache.has('user:123')) {
  console.log('User exists in cache');
}
```

#### `delete(key: string): boolean`
Removes a specific entry from the cache.

```typescript
const wasDeleted = cache.delete('user:123');
```

#### `clear(): void`
Removes all entries from the cache.

```typescript
cache.clear();
```

#### `size(): number`
Returns the current number of entries (after cleanup).

```typescript
console.log(`Cache contains ${cache.size()} items`);
```

#### `keys(): IterableIterator<string>`
Returns an iterator of all keys (after cleanup).

```typescript
for (const key of cache.keys()) {
  console.log(key);
}
```

#### `values(): T[]`
Returns an array of all values (after cleanup).

```typescript
const allValues = cache.values();
```

#### `entries(): Array<[string, T]>`
Returns an array of all key-value pairs (after cleanup).

```typescript
const allEntries = cache.entries();
```

#### `cleanup(): number`
Manually removes expired entries and returns the number of removed items.

```typescript
const removedItems = cache.cleanup();
console.log(`Cleaned up ${removedItems} expired items`);
```

#### `stats()`
Returns cache statistics.

```typescript
const stats = cache.stats();
console.log(stats);
// Output: { size: 150, maxSize: 1000, ttl: 300000, expired: 5, active: 145 }
```

#### `touch(key: string, newTtl?: number): boolean`
Updates the TTL of an existing entry and marks it as recently used.

```typescript
// Extend with default TTL
cache.touch('user:123');

// Extend with custom TTL (1 hour)
cache.touch('user:123', 60 * 60 * 1000);
```

## Use Cases

### 1. **API Response Caching**
Reduce API calls by caching responses temporarily.

```typescript
const apiCache = new InMemoryCache<any>(10 * 60 * 1000); // 10 minutes

async function fetchUserData(userId: string) {
  return await apiCache.get(`user:${userId}`, async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  });
}
```

### 2. **Database Query Caching**
Cache expensive database queries to improve performance.

```typescript
const dbCache = new InMemoryCache<any>(5 * 60 * 1000, 500); // 5 min, max 500 items

async function getProductsByCategory(category: string) {
  return await dbCache.get(`products:${category}`, async () => {
    return await db.products.findMany({ where: { category } });
  });
}
```

### 3. **Session Management**
Store user sessions with automatic expiration.

```typescript
const sessionCache = new InMemoryCache<UserSession>(30 * 60 * 1000); // 30 minutes

function createSession(userId: string, sessionData: UserSession) {
  const sessionId = generateSessionId();
  sessionCache.set(sessionId, sessionData);
  return sessionId;
}

function getSession(sessionId: string): UserSession | null {
  return sessionCache.get(sessionId);
}
```

### 4. **Computed Results Caching**
Cache expensive calculations or data processing results.

```typescript
const computeCache = new InMemoryCache<number>(60 * 60 * 1000); // 1 hour

function expensiveCalculation(input: string): number {
  const cacheKey = `calc:${hashInput(input)}`;
  
  let result = computeCache.get(cacheKey);
  if (result === null) {
    result = performHeavyComputation(input);
    computeCache.set(cacheKey, result);
  }
  
  return result;
}
```

## Technology Compatibility

### Node.js Environments
- ✅ **Express.js** - Perfect for API response caching
- ✅ **NestJS** - Excellent for service-level caching
- ✅ **Fastify** - High-performance route caching
- ✅ **Next.js API Routes** - Server-side data caching
- ✅ **GraphQL Resolvers** - Field-level caching
- ✅ **Microservices** - Inter-service data caching

### Browser Environments
- ✅ **React** - Component data caching
- ✅ **Vue.js** - Vuex/Pinia integration
- ✅ **Angular** - Service-level caching
- ✅ **Svelte** - Store caching
- ✅ **Vanilla JavaScript** - Universal browser support

### Database ORMs
- ✅ **Prisma** - Query result caching
- ✅ **TypeORM** - Entity caching
- ✅ **Sequelize** - Model result caching
- ✅ **Mongoose** - Document caching

## Examples

### Express.js Integration

```typescript
import express from 'express';
import InMemoryCache from 'uni-memory-cache';

const app = express();
const cache = new InMemoryCache<any>(15 * 60 * 1000); // 15 minutes

app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const user = await cache.get(`user:${userId}`, async () => {
      const userData = await database.users.findById(userId);
      return userData;
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'User not found' });
  }
});
```

### NestJS Service

```typescript
import { Injectable } from '@nestjs/common';
import InMemoryCache from 'uni-memory-cache';

@Injectable()
export class UserService {
  private cache = new InMemoryCache<User>(10 * 60 * 1000, 1000);

  async getUser(id: string): Promise<User> {
    return await this.cache.get(`user:${id}`, async () => {
      return await this.userRepository.findOne(id);
    });
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.userRepository.update(id, userData);
    
    // Update cache with fresh data
    this.cache.set(`user:${id}`, user);
    
    return user;
  }

  invalidateUser(id: string): void {
    this.cache.delete(`user:${id}`);
  }
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';
import InMemoryCache from 'uni-memory-cache';

const cache = new InMemoryCache<any>(5 * 60 * 1000); // 5 minutes

function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await cache.get(url, async () => {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch');
          return response.json();
        });
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useApiData<User>(`/api/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return <div>Hello, {user.name}!</div>;
}
```

### GraphQL Resolver Caching

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import InMemoryCache from 'uni-memory-cache';

@Resolver()
export class ProductResolver {
  private cache = new InMemoryCache<Product[]>(5 * 60 * 1000);

  @Query(() => [Product])
  async products(@Args('category') category: string): Promise<Product[]> {
    return await this.cache.get(`products:${category}`, async () => {
      return await this.productService.findByCategory(category);
    });
  }
}
```

## Performance

### Benchmarks
- **Set Operation**: ~1-2 million ops/sec
- **Get Operation**: ~10-15 million ops/sec  
- **Memory Usage**: ~40-60 bytes per entry overhead
- **TTL Cleanup**: ~5-10 million checks/sec

### Best Practices

1. **Choose Appropriate TTL**: Balance between data freshness and performance
2. **Set Size Limits**: Prevent memory leaks with `maxSize` parameter
3. **Regular Cleanup**: Use `cleanup()` method for long-running applications
4. **Monitor Stats**: Use `stats()` method to monitor cache performance
5. **Key Naming**: Use consistent, descriptive key patterns

```typescript
// Good key naming
cache.set('user:profile:123', userData);
cache.set('product:details:456', productData);
cache.set('api:response:/users/123', apiResponse);

// Monitor performance
setInterval(() => {
  const stats = cache.stats();
  console.log(`Cache efficiency: ${stats.active}/${stats.size} active entries`);
  
  if (stats.expired > stats.active * 0.1) {
    cache.cleanup(); // Clean if more than 10% expired
  }
}, 60000);
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/AMFahim/uni-memory-cache/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/AMFahim/uni-memory-cache/issues)
- 📖 **Documentation**: [GitHub Repository](https://github.com/AMFahim/uni-memory-cache)

---
