import Koa from 'koa';
import xRequestId from './xRequestId';

export default function(app: Koa) {
  app.use(xRequestId(app));
}