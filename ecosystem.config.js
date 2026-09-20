module.exports = {
  apps: [
    {
      name: 'motoapp',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/motoapp-error.log',
      out_file: './logs/motoapp-out.log',
    },
  ],
};
