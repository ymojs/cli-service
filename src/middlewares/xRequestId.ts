import Koa from 'koa';
import koaXRequestId from 'koa-x-request-id';

export default function (app: Koa) {
  return koaXRequestId({
    inject: true
  }, app);
}