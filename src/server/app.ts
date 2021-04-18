import Koa from 'koa';
import middlewares from '../middlewares';

const app = new Koa();
middlewares(app);

export default app;