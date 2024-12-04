// server.js
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

// Initialize Koa app and router
const app = new Koa();
const router = new Router();

// Middleware to parse request bodies
app.use(bodyParser());

// Define your routes (example)
router.get('/', async (ctx) => {
  ctx.body = { message: 'Welcome to the backend!' };
});

// Example route to handle data from the frontend
router.post('/api/data', async (ctx) => {
  const { pHLevel, ammoniaConcentration, temperature } = ctx.request.body;
  ctx.body = { status: 'Data received', pHLevel, ammoniaConcentration, temperature };
});

// Use the routes defined above
app.use(router.routes()).use(router.allowedMethods());

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
