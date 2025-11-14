import { CONFIG } from "../config.js";

const PROXY_POOL = [];

for (let i = 0; i < 50; i++) {
  PROXY_POOL.push(
    `http://${CONFIG.BRIGHTDATA_USER}-session-${Date.now()}-${i}:${
      CONFIG.BRIGHTDATA_PASS
    }@brd.superproxy.io:33335`
  );
}

let index = 0;
export function getRotatingProxy() {
  const proxy = PROXY_POOL[index % PROXY_POOL.length];
  index++;
  return proxy;
}
