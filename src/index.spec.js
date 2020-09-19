import { TestScheduler } from "jest";
import { Promise } from "./index"

const promise = new Promise((resolve, reject) => {
  resolve("1231231231231")
})

console.log(promise)