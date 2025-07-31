import InMemoryCache from '../src/index';

class TestSuite {
  private testCount = 0;
  private passedTests = 0;
  private failedTests = 0;

  async test(name: string, testFn: () => void | Promise<void>) {
    this.testCount++;
    console.log(`\n🧪 Running: ${name}`);
    
    try {
      const result = testFn();
      if (result instanceof Promise) {
        await result;
      }
      this.passedTests++;
      console.log(`✅ PASSED: ${name}`);
    } catch (error: any) {
      this.failedTests++;
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  async run() {
    console.log('🚀 Starting InMemoryCache Test Suite\n');
    
    // Basic functionality tests
    await this.basicTests();
    
    // TTL tests
    await this.ttlTests();
    
    // LRU tests
    await this.lruTests();
    
    // Async fallback tests
    await this.asyncTests();
    
    // Edge cases and error handling
    await this.edgeCaseTests();
    
    // Performance tests
    await this.performanceTests();

    this.summary();
  }

  private async basicTests() {
    console.log('\n📦 BASIC FUNCTIONALITY TESTS');
    console.log('=' .repeat(40));

    await this.test('Cache initialization', () => {
      const cache = new InMemoryCache();
      assert(cache.size() === 0, 'Cache should be empty initially');
    });

    await this.test('Set and get operations', () => {
      const cache = new InMemoryCache<string>();
      cache.set('key1', 'value1');
      assert(cache.get('key1') === 'value1', 'Should retrieve correct value');
      assert(cache.size() === 1, 'Cache size should be 1');
    });

    await this.test('Has operation', () => {
      const cache = new InMemoryCache<string>();
      cache.set('exists', 'value');
      assert(cache.has('exists') === true, 'Should return true for existing key');
      assert(cache.has('notexists') === false, 'Should return false for non-existing key');
    });

    await this.test('Delete operation', () => {
      const cache = new InMemoryCache<string>();
      cache.set('delete-me', 'value');
      assert(cache.delete('delete-me') === true, 'Should return true when deleting existing key');
      assert(cache.delete('not-exists') === false, 'Should return false when deleting non-existing key');
      assert(cache.has('delete-me') === false, 'Key should not exist after deletion');
    });

    await this.test('Clear operation', () => {
      const cache = new InMemoryCache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      assert(cache.size() === 0, 'Cache should be empty after clear');
      assert(cache.get('key1') === null, 'All keys should be removed');
    });

    await this.test('Keys, values, and entries', () => {
      const cache = new InMemoryCache<string>();
      cache.set('a', 'valueA');
      cache.set('b', 'valueB');
      
      const keys = Array.from(cache.keys());
      const values = cache.values();
      const entries = cache.entries();
      
      assert(keys.length === 2, 'Should have 2 keys');
      assert(values.length === 2, 'Should have 2 values');
      assert(entries.length === 2, 'Should have 2 entries');
      assert(keys.includes('a') && keys.includes('b'), 'Keys should include a and b');
      assert(values.includes('valueA') && values.includes('valueB'), 'Values should include both values');
    });
  }

  private async ttlTests() {
    console.log('\n⏰ TTL (TIME TO LIVE) TESTS');
    console.log('=' .repeat(40));

    await this.test('TTL expiration', async () => {
      const cache = new InMemoryCache<string>(100); // 100ms TTL
      cache.set('expire-me', 'value');
      
      assert(cache.get('expire-me') === 'value', 'Should get value immediately');
      
      await sleep(150); // Wait for expiration
      
      assert(cache.get('expire-me') === null, 'Should return null after TTL expiration');
      assert(cache.has('expire-me') === false, 'Has should return false after expiration');
    });

    await this.test('TTL with zero (no expiration)', () => {
      const cache = new InMemoryCache<string>(0); // No TTL
      cache.set('never-expire', 'value');
      
      assert(cache.get('never-expire') === 'value', 'Should never expire with TTL 0');
    });

    await this.test('Touch method to refresh TTL', async () => {
      const cache = new InMemoryCache<string>(100); // 100ms TTL
      cache.set('touch-me', 'value');
      
      await sleep(80); // Wait almost to expiration
      
      assert(cache.touch('touch-me') === true, 'Touch should succeed');
      
      await sleep(50); // Wait past original expiration time
      
      assert(cache.get('touch-me') === 'value', 'Should still exist after touch');
    });

    await this.test('Touch with custom TTL', async () => {
      const cache = new InMemoryCache<string>(50); // 50ms default TTL
      cache.set('custom-ttl', 'value');
      
      assert(cache.touch('custom-ttl', 200) === true, 'Touch with custom TTL should succeed');
      
      await sleep(100); // Wait past default TTL
      
      assert(cache.get('custom-ttl') === 'value', 'Should exist with extended TTL');
    });

    await this.test('Cleanup expired entries', async () => {
      const cache = new InMemoryCache<string>(50); // 50ms TTL
      cache.set('expire1', 'value1');
      cache.set('expire2', 'value2');
      cache.set('keep', 'value3');
      
      await sleep(70); // Wait for first two to expire
      
      cache.set('keep', 'new-value'); // Refresh one entry
      
      const removedCount = cache.cleanup();
      assert(removedCount === 2, 'Should remove 2 expired entries');
      assert(cache.size() === 1, 'Should have 1 entry remaining');
    });
  }

  private async lruTests() {
    console.log('\n🔄 LRU (LEAST RECENTLY USED) TESTS');
    console.log('=' .repeat(40));

    await this.test('LRU eviction on size limit', () => {
      const cache = new InMemoryCache<string>(0, 3); // No TTL, max 3 items
      
      cache.set('first', 'value1');
      cache.set('second', 'value2');
      cache.set('third', 'value3');
      
      assert(cache.size() === 3, 'Should have 3 items');
      
      cache.set('fourth', 'value4');
      
      assert(cache.size() === 3, 'Should still have 3 items');
      assert(cache.get('first') === null, 'First item should be evicted');
      assert(cache.get('second') === 'value2', 'Second item should exist');
      assert(cache.get('third') === 'value3', 'Third item should exist');
      assert(cache.get('fourth') === 'value4', 'Fourth item should exist');
    });

    await this.test('LRU with access pattern', () => {
      const cache = new InMemoryCache<string>(0, 3); 
      
      cache.set('a', 'valueA');
      cache.set('b', 'valueB');
      cache.set('c', 'valueC');
      
      cache.get('a');
      
      cache.set('d', 'valueD'); 
      
      assert(cache.get('a') === 'valueA', 'A should still exist (recently accessed)');
      assert(cache.get('b') === null, 'B should be evicted');
      assert(cache.get('c') === 'valueC', 'C should exist');
      assert(cache.get('d') === 'valueD', 'D should exist');
    });

    await this.test('LRU with has() calls', () => {
      const cache = new InMemoryCache<string>(0, 2); 
      
      cache.set('first', 'value1');
      cache.set('second', 'value2');
      
      cache.has('first');
      
      cache.set('third', 'value3'); 
      
      assert(cache.get('first') === 'value1', 'First should exist (accessed via has)');
      assert(cache.get('second') === null, 'Second should be evicted');
      assert(cache.get('third') === 'value3', 'Third should exist');
    });
  }

  private async asyncTests() {
    console.log('\n🔄 ASYNC FALLBACK TESTS');
    console.log('=' .repeat(40));

    await this.test('Async fallback on cache miss', async () => {
      const cache = new InMemoryCache<string>();
      
      const result = await cache.get('missing', async () => {
        await sleep(10);
        return 'fallback-value';
      });
      
      assert(result === 'fallback-value', 'Should return fallback value');
      assert(cache.get('missing') === 'fallback-value', 'Should cache the fallback value');
    });

    await this.test('Async fallback on expired entry', async () => {
      const cache = new InMemoryCache<string>(50); // 50ms TTL
      cache.set('expire-async', 'original');
      
      await sleep(70); 
      
      const result = await cache.get('expire-async', async () => {
        return 'refreshed-value';
      });
      
      assert(result === 'refreshed-value', 'Should return refreshed value');
      assert(cache.get('expire-async') === 'refreshed-value', 'Should cache the new value');
    });

    await this.test('Async fallback error handling', async () => {
      const cache = new InMemoryCache<string>();
      
      try {
        await cache.get('error-key', async () => {
          throw new Error('Fallback failed');
        });
        assert(false, 'Should have thrown an error');
      } catch (error: any) {
        assert(error.message === 'Fallback failed', 'Should propagate fallback error');
      }
      
      assert(cache.get('error-key') === null, 'Failed fallback should not cache anything');
    });
  }

  private async edgeCaseTests() {
    console.log('\n⚠️  EDGE CASES AND ERROR HANDLING');
    console.log('=' .repeat(40));

    await this.test('Different data types', () => {
      const cache = new InMemoryCache<any>();
      
      cache.set('string', 'text');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { key: 'value' });
      cache.set('array', [1, 2, 3]);
      cache.set('null', null);
      cache.set('undefined', undefined);
      
      assert(cache.get('string') === 'text', 'String should work');
      assert(cache.get('number') === 42, 'Number should work');
      assert(cache.get('boolean') === true, 'Boolean should work');
      assert(JSON.stringify(cache.get('object')) === '{"key":"value"}', 'Object should work');
      assert(JSON.stringify(cache.get('array')) === '[1,2,3]', 'Array should work');
      assert(cache.get('null') === null, 'Null should work');
      assert(cache.get('undefined') === undefined, 'Undefined should work');
    });

    await this.test('Overwriting existing keys', () => {
      const cache = new InMemoryCache<string>();
      cache.set('overwrite', 'original');
      cache.set('overwrite', 'updated');
      
      assert(cache.get('overwrite') === 'updated', 'Should have updated value');
      assert(cache.size() === 1, 'Size should remain 1');
    });

    await this.test('Large cache operations', () => {
      const cache = new InMemoryCache<number>(0, 1000);
      
      for (let i = 0; i < 500; i++) {
        cache.set(`key${i}`, i);
      }
      
      assert(cache.size() === 500, 'Should have 500 items');
      
      for (let i = 0; i < 100; i++) {
        cache.get(`key${i}`);
      }
      
      for (let i = 500; i < 1100; i++) {
        cache.set(`key${i}`, i);
      }
      
      assert(cache.size() === 1000, 'Should be capped at 1000 items');
    });

    await this.test('Cache statistics', async () => {
      const cache = new InMemoryCache<string>(100);
      
      cache.set('expire1', 'value1');
      cache.set('expire2', 'value2');
      
      await sleep(120); 
      
      cache.set('active1', 'value3');
      cache.set('active2', 'value4');
      
      const stats = cache.stats();
      
      assert(stats.size === 4, 'Should report total size including expired');
      assert(stats.maxSize === Infinity, 'Should report correct maxSize');
      assert(stats.ttl === 100, 'Should report correct TTL');
      assert(stats.expired === 2, 'Should detect 2 expired entries');
      assert(stats.active === 2, 'Should count 2 active entries');
      assert(stats.expired + stats.active === stats.size, 'Expired + active should equal total size');
    });
  }

  private async performanceTests() {
    console.log('\n🚀 PERFORMANCE TESTS');
    console.log('=' .repeat(40));

    await this.test('High volume operations', () => {
      const cache = new InMemoryCache<number>();
      const iterations = 10000;
      
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        cache.set(`perf-key-${i}`, i);
      }
      
      const writeTime = Date.now() - startTime;
      
      const readStartTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        cache.get(`perf-key-${i}`);
      }
      
      const readTime = Date.now() - readStartTime;
      
      console.log(`   📊 Performance Results:`);
      console.log(`      Write: ${iterations} ops in ${writeTime}ms (${(iterations/writeTime).toFixed(2)} ops/ms)`);
      console.log(`      Read:  ${iterations} ops in ${readTime}ms (${(iterations/readTime).toFixed(2)} ops/ms)`);
      
      assert(cache.size() === iterations, `Should have ${iterations} items`);
      assert(writeTime < 1000, 'Write operations should complete in reasonable time');
      assert(readTime < 1000, 'Read operations should complete in reasonable time');
    });

    await this.test('Memory cleanup efficiency', async () => {
      const cache = new InMemoryCache<string>(10);
      
      for (let i = 0; i < 1000; i++) {
        cache.set(`temp-${i}`, `value-${i}`);
      }
      
      assert(cache.size() === 1000, 'Should have 1000 items initially');
      
      await sleep(20);
      
      const cleanupStart = Date.now();
      const removedCount = cache.cleanup();
      const cleanupTime = Date.now() - cleanupStart;
      
      console.log(`   🧹 Cleanup: Removed ${removedCount} items in ${cleanupTime}ms`);
      
      assert(removedCount === 1000, 'Should remove all expired items');
      assert(cache.size() === 0, 'Cache should be empty after cleanup');
      assert(cleanupTime < 100, 'Cleanup should be fast');
    });
  }

  private summary() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.testCount}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.testCount) * 100).toFixed(1)}%`);
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All tests passed! Your cache implementation is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
      process.exit(1);
    }
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const testSuite = new TestSuite();
testSuite.run().catch(console.error);