// =====================================================
// PM2 Ecosystem Configuration for VocaPro
// =====================================================

module.exports = {
  apps: [
    {
      name: 'vocapro',
      script: './src/server.js',
      instances: 1, // Thay ??i t? 'max' thành 1 ?? tránh EADDRINUSE
      exec_mode: 'fork', // Thay ??i t? 'cluster' thành 'fork'
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false, // Thay ??i thành false
      listen_timeout: 10000,
      // Auto restart strategies
      min_uptime: '10s',
      max_restarts: 10,
      // Cron restart (optional - restart hàng ngày lúc 3 gi? sáng)
      // cron_restart: '0 3 * * *',
      // Source map support
      source_map_support: true,
      // Post deploy commands
      post_update: ['npm install', 'npx prisma generate']
    }
  ],

  // Deploy configuration (optional - for PM2 deploy)
  deploy: {
    production: {
      user: 'root', // Thay ??i username VPS c?a b?n
      host: '165.227.101.102', // Thay ??i IP VPS c?a b?n
      ref: 'origin/main',
      repo: 'https://github.com/PuuGoo/note-vocabulary-v2',
      path: '/root/vocapro', // Thay ??i path trên VPS
      'post-deploy': 'npm install && npx prisma generate && npx prisma db push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y'
    }
  }
};
