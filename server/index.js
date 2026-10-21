import { join } from 'node:path';
import { Store } from './store.js';
import { config } from './config.js';
import { createApp } from './http.js';
const store = new Store(join(config.dataDir, 'trustlens.sqlite'));
const { server, service } = createApp(store, config);
server.listen(config.port, config.host, () => console.log(`TrustLens API listening on ${config.host}:${config.port}`));
function stop() {
  for (const job of store.list('job')) service.queue.cancel(job.id);
  server.close(() => { store.close(); process.exit(0); });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
