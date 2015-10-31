var config = {
  publicUrl: process.env.PUBLIC_URL,
  host: process.env.HOST,
  port: process.env.PORT,
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    options: {
      auth_pass:  process.env.REDIS_AUTH_PASS || null
    }
  }
};

module.exports = config;
