export const IS_DEBUG = process.env.DEBUG === "true";
export const IS_TEST = process.env.NODE_ENV === "test";
export const LOG_TX_SIZE = process.env.LOG_TX_SIZE === "true";

if (IS_DEBUG) {
  // Ref: https://medium.com/front-end-weekly/stack-traces-for-promises-in-node-js-46bf5f490fe4
  global.Promise = require("bluebird");
}
