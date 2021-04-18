import { createDatabase } from './database';
import Console from '@ymo/console';
import app from './server/app';
import * as http from 'http';
import createSocket from './socket';
import config from './config';

console.log('cli-service... index');

async function start() {
  await createDatabase();
  Console.init({
    env: config.env
  });
  const server = http.createServer(app.callback());
  createSocket(server);
  server.listen(config.port, () => {
    console.log(`koa listen at ${config.port}`);
    process.send && process.send({
      type: 'cli-service: start success',
      data: {}
    });
    process.on('message', packet => {
      console.log(packet);
      console.log(packet.topic);
    });
  });
}

start();