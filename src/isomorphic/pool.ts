/**
 * @description one simple pool, can store 10 elements, on 11 element pushed, it will pop the first element
 */
export class SimplePool<T = any> {
  private pool: T[];

  constructor(private _maxSize = 10) {
    this.pool = [];
  }

  get size() {
    return this.pool.length;
  }

  push(element: T) {
    if (this.pool.length >= this._maxSize) {
      this.pop();
    }
    this.pool.push(element);
  }

  pop() {
    this.pool.shift();
  }

  getPool() {
    return [...this.pool];
  }
}
