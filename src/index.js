const PENDING = "PENDING",
  FULFILLED = "FULFILLED",
  FAILED = "FAILED";

function resolvePromise(promise, x, onFulfilled, onRejected) {
  /**
   * Promises/A+ [2.3.1]
   * 如果promise和x指向同一个对象，就应该使用TypeError作为错误原由reject promise对象
   */
  if (promise === x) {
    return onRejected('[TypeError: Chaining cycle detected for promise #<Promise>]');
  }
  /**
   * 2.3.3
   */
  let called = false;
  if (typeof x === "funtion" || (x !== null && typeof x === "object")) {
    /**
     * 2.3.3.2
     */
    try {
      /**
       * 2.3.3.1
       */
      const then = x.then;
      if (typeof then === "function") {
        then.call(
          this,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise, y, onFulfilled, onRejected);
          },
          (r) => {
            if (called) return;
            called = true;
            onRejected(r);
          }
        );
      } else {
        if (called) return;
        called = true;
        onFulfilled(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      onRejected(e);
    }
  } else {
    onFulfilled(x);
  }
}

export class Promise {
  constructor(excutor) {
    this.state = PENDING;
    this.value = undefined;
    this.reason = undefined;

    this.onFulfilledCbs = [];
    this.onRejectedCbs = [];

    const onResolve = (data) => {
      if (this.state === PENDING) {
        this.state = FULFILLED;
        this.value = data;
        this.onFulfilledCbs.forEach((fn) => fn());
      }
    };

    const onRejected = (data) => {
      if (this.state === PENDING) {
        this.state = FAILED;
        this.reason = data;
        this.onRejectedCbs.forEach((fn) => fn());
      }
    };

    try {
      excutor(onResolve, onRejected);
    } catch (e) {
      onRejected(e);
    }
  }

  then(onFulfilled, onRejected) {
    /**
     * 源于Promises/A+[2.2.7.2]的定义，
     * 如果变量onFulfilled不是函数而promise1已经获取有效值，promise2也应该有获取promise1的值
     */
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value;
    /**
     * 同上
     */
    onRejected =
      typeof onRejected === "function" ? onRejected : (reason) => reason;
    const self = this;
    let promise = new Promise((resolve, reject) => {
      if (self.state === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(self.value);
            resovle(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      } else if (self.state === REJECTED) {
        x = onRejected(self.reason);
        setTimeout(() => {
          try {
            let x = onRejected(self.value);
            resovle(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      } else if (this.state === PENDING) {
        self.onFulfilledCbs.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(self.value);
              resolvePromise(promise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
        self.onRejectedCbs.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(self.value);
              resolvePromise(promise, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });
    return promise;
  }

  static resolve(value) {
    return new Promise((resolve, reject) => {
      resolve(value);
    });
  }

  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(cb) {
    return this.then(
      () => {
        cb();
      },
      () => {
        cb();
      }
    );
  }

  static all(args) {
    return new Promise((resolve, reject) => {
      let result = [];
      if(args.length === 0) {
        resolve(result)
      } else {
        for(let i = 0; i< args.length; i++) {
          Promise.resolve(args[i]).then(data => {
            result[i]=data;
            if(++i === args.length) {
              resolve(result);
            }
          }, err => {
            reject(err);
          })
        }
      }
    })
  }

  static race(args) {
    return new Promise((resolve, reject) => {
      if(args.length === 0) {
        return;
      } else {
        for(let i = 0; i < args.length; i++) {
          Promise.resolve(args[i]).then(data => {
            resolve(data);
          }, err => {
            reject(err)
          })
        }
      }
    })
  }

  /**
   * 一旦所指定的 promises 集合中每一个 promise 已经完成，
   * 无论是成功的达成或被拒绝，未决议的 Promise将被异步完成。
   * @param {Array} args promises 
   * 
   */
  static allSettle(args) {
    // 对于每个结果对象，都有一个 status 字符串。value（或 reason ）反映了每个 promise 决议（或拒绝）的值。
    let result = [];
    return new Promise((resolve, reject) => {
      if(args.length === 0) {
        resolve();
      } else {
        for(let i = 0; i < args.length; i++) {
          Promise.resolve(args[i]).then(data => {
            // 如果它的值为 fulfilled，则结果对象上存在一个 value 。
            result[i] = data;
          }, reason => {
            // 如果值为 rejected，则存在一个 reason 。
            result[i] = reason;
          })
        }
        // 完成Promise
        resolve(result);
      }
    })
  }

  /**
   * 用于返回第一个成功的 promise 。只要有一个 promise 成功此方法就会终止，它不会等待其他的 promise 全部完成。
   * @param {Array} args promises
   */
  static any(args) {
    // 一个处理中（pending） 的 Promise
    return new Promise((resolve, reject) => {
      if(args.length === 0) {
        // 如果传入的参数是一个空的可迭代对象，则返回一个 已完成（already resolve)状态的Promise
        resolve()
      } else {
        for(let i = 0; i < args.length; i++) {
          // 如果传入的参数不包含任何 promise，则返回一个 异步完成 （asynchronously resolved）的 Promise。
          // Promise.resolve(args[i])处理可以使上述情况忽略
          Promise.resolve(args[i]).then(data => {
            resolve(data)
            // 只要传入的迭代对象中的任何一个 promise 变成成功（resolve）状态, 则返回
            return;
          }, err => {
            if(++i === args.length) {
              // 其中的所有的 promises 都失败，那么返回的 promise 就会 异步地（当调用栈为空时） 变成成功/失败（resolved/reject）状态
              reject(err)
            }
          })
        }
      }
    })
  }
}
