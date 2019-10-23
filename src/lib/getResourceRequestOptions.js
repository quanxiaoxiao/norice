module.exports = (config) => {
  const { deploy: deployConfig } = config;
  if (!deployConfig) {
    throw new Error('deploy config is not set');
  }
  return {
    hostname: deployConfig.hostname,
    port: deployConfig.port,
    headers: deployConfig.headers,
  };
};
