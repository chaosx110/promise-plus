const PENDING = "PENDING",
  FULFILLED = "FULFILLED",
  FAILED = "FAILED";

const noop = () => {};

export class Promise {
  constructor(excutor) {
    this.state = PENDING;
    this.value = undefined;
    this.reason = undefined;

    const onResolve = (data) => {
      this.state = FULFILLED;
      this.value = data;
    };

    const onRejected = (data) => {
      this.state = FAILED;
      this.reason = data;
    };

    excutor(onResolve, onRejected);
  }

  // then(onFulfilled, onRejected) {
  //   if (typeof onFulfilled === "function") {
  //     // 忽略
  //     onFulfilled(this.value)
  //   }

  //   if (typeof onRejected === "function") {
  //     // 忽略
  //     onRejected(this.reason)
  //   }
  // }

  then(onFulfilled, onRejected) {
    if(this.state === FULFILLED) {
      if(typeof onFulfilled !== 'function') {
        return;
      }
      onFulfilled(this.value);
    }
    if(this.state === REJECTED) {
      if(typeof onRejected !== 'function') {
        return;
      }
      onRejected(this.reason);
    }
  }
}
