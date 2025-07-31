import InMemoryCache from '../src/index';

interface BenchmarkResult {
  operation: string;
  opsPerSecond: number;
  avgTimeMs: number;
  totalTime: number;
  iterations: number;
}

class CacheBenchmark {
  private cache: InMemoryCache<string>;
  
  constructor() {
    this.cache = new InMemoryCache<string>(60000, 10000);
  }

  async benchmark(name: string, fn: () => void, iterations: number = 1000000): Promise<BenchmarkResult> {
    for (let i = 0; i < 1000; i++) {
      fn();
    }

    // Actual benchmark
    const startTime = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    const endTime = process.hrtime.bigint();
    const totalTimeNs = Number(endTime - startTime);
    const totalTimeMs = totalTimeNs / 1000000;
    const opsPerSecond = Math.round((iterations / totalTimeMs) * 1000);
    const avgTimeMs = totalTimeMs / iterations;

    return {
      operation: name,
      opsPerSecond,
      avgTimeMs,
      totalTime: totalTimeMs,
      iterations
    };
  }

  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Starting Cache Performance Benchmarks...\n');

    // cache for get tests
    for (let i = 0; i < 1000; i++) {
      this.cache.set(`key${i}`, `value${i}`);
    }

    const results: BenchmarkResult[] = [];

    // SET operations
    let setCounter = 1000;
    const setResult = await this.benchmark('SET', () => {
      this.cache.set(`newkey${setCounter++}`, `newvalue${setCounter}`);
    }, 100000);
    results.push(setResult);

    // GET operations (cache hits)
    let getCounter = 0;
    const getResult = await this.benchmark('GET (hit)', () => {
      this.cache.get(`key${getCounter++ % 1000}`);
    }, 1000000);
    results.push(getResult);

    // GET operations (cache miss)
    let missCounter = 10000;
    const getMissResult = await this.benchmark('GET (miss)', () => {
      this.cache.get(`nonexistent${missCounter++}`);
    }, 100000);
    results.push(getMissResult);

    //  HAS operations
    let hasCounter = 0;
    const hasResult = await this.benchmark('HAS', () => {
      this.cache.has(`key${hasCounter++ % 1000}`);
    }, 1000000);
    results.push(hasResult);

    //  DELETE operations
    let deleteCounter = 0;
    const deleteResult = await this.benchmark('DELETE', () => {
      this.cache.delete(`key${deleteCounter++ % 1000}`);
    }, 100000);
    results.push(deleteResult);

    const expiredCache = new InMemoryCache<string>(1);
    for (let i = 0; i < 1000; i++) {
      expiredCache.set(`expired${i}`, `value${i}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10)); 
    
    const cleanupResult = await this.benchmark('CLEANUP', () => {
      expiredCache.cleanup();
    }, 10000);
    results.push(cleanupResult);

    // Display results
    this.displayResults(results);
    
    // Memory usage analysis
    this.analyzeMemoryUsage();
  }

  private displayResults(results: BenchmarkResult[]): void {
    console.log('📊 Benchmark Results:');
    console.log('=' .repeat(80));
    console.log('| Operation    | Ops/Second  | Avg Time (μs) | Total Time (ms) | Iterations |');
    console.log('|' + '-'.repeat(78) + '|');
    
    results.forEach(result => {
      const avgTimeMicros = (result.avgTimeMs * 1000).toFixed(2);
      console.log(
        `| ${result.operation.padEnd(12)} | ${result.opsPerSecond.toLocaleString().padStart(11)} | ${avgTimeMicros.padStart(13)} | ${result.totalTime.toFixed(2).padStart(15)} | ${result.iterations.toLocaleString().padStart(10)} |`
      );
    });
    console.log('=' .repeat(80));
  }

  private analyzeMemoryUsage(): void {
    console.log('\n💾 Memory Usage Analysis:');
    
    const testSizes = [100, 1000, 10000];
    
    testSizes.forEach(size => {
      const memCache = new InMemoryCache<string>();
      
      const beforeMem = process.memoryUsage();
      
      for (let i = 0; i < size; i++) {
        memCache.set(`key${i}`, `This is a test value for key ${i} with some extra data to make it realistic`);
      }
      
      const afterMem = process.memoryUsage();
      
      const memDiff = afterMem.heapUsed - beforeMem.heapUsed;
      const bytesPerEntry = memDiff / size;
      
      console.log(`${size.toLocaleString()} entries: ${(memDiff / 1024 / 1024).toFixed(2)} MB total, ${bytesPerEntry.toFixed(0)} bytes/entry`);
    });
  }

  async testTTLPerformance(): Promise<void> {
    console.log('\n⏰ TTL Performance Test:');
    
    const ttlCache = new InMemoryCache<string>(100); 
    
    const startAdd = Date.now();
    for (let i = 0; i < 10000; i++) {
      ttlCache.set(`ttl${i}`, `value${i}`);
    }
    const addTime = Date.now() - startAdd;
    
    console.log(`Added 10,000 entries in ${addTime}ms`);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const startCleanup = Date.now();
    const removed = ttlCache.cleanup();
    const cleanupTime = Date.now() - startCleanup;
    
    console.log(`Cleaned up ${removed} expired entries in ${cleanupTime}ms`);
    console.log(`Cleanup rate: ${Math.round(removed / cleanupTime * 1000).toLocaleString()} entries/second`);
  }

  async testLRUPerformance(): Promise<void> {
    console.log('\n🔄 LRU Eviction Performance Test:');
    
    const lruCache = new InMemoryCache<string>(0, 1000);
    
    for (let i = 0; i < 1000; i++) {
      lruCache.set(`lru${i}`, `value${i}`);
    }
    
    const startEviction = Date.now();
    for (let i = 1000; i < 2000; i++) {
      lruCache.set(`lru${i}`, `value${i}`); 
    }
    const evictionTime = Date.now() - startEviction;
    
    console.log(`Added 1,000 entries with LRU eviction in ${evictionTime}ms`);
    console.log(`Eviction rate: ${Math.round(1000 / evictionTime * 1000).toLocaleString()} evictions/second`);
    console.log(`Final cache size: ${lruCache.size()}`);
  }
}

// Run benchmarks
async function main() {
  const benchmark = new CacheBenchmark();
  
  try {
    await benchmark.runAllBenchmarks();
    await benchmark.testTTLPerformance();
    await benchmark.testLRUPerformance();
  } catch (error) {
    console.error('Benchmark failed:', error);
  }
}

export { CacheBenchmark };

if (require.main === module) {
  main();
}