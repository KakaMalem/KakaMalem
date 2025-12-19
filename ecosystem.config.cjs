module.exports = {
  apps: [
    {
      name: 'KakaMalem',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/KakaMalem',
      // 2 instances optimal for 4-core VPS (leaves cores for OS, Nginx, build tasks)
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      // 2GB per instance, 4GB total - leaves 12GB for OS and builds
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/KakaMalem/logs/error.log',
      out_file: '/var/www/KakaMalem/logs/output.log',
      log_file: '/var/www/KakaMalem/logs/combined.log',
      time: true,
      // Graceful restart
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
