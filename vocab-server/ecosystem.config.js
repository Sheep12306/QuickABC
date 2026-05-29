module.exports = {
  apps: [{
    name: 'vocab-server',
    script: 'src/server.js',
    cwd: '/opt/vocab-server',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/vocab-server/error.log',
    out_file: '/var/log/vocab-server/out.log',
  }],
};
