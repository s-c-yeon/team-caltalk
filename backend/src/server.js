const env = require('./config/env');
const app = require('./app');

app.listen(env.port, () => {
  console.log(`team-caltalk backend listening on port ${env.port}`);
});
