module.exports = {
  apps: [
    {
      name: 'airdrop-scheduler',
      script: 'web3/scripts/airdrop-scheduler.js',
      cwd: '/home/ubuntu/Presale_savitri_node/Presale_savitri_node',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      // Logging
      error_file: './logs/airdrop-scheduler-error.log',
      out_file: './logs/airdrop-scheduler-out.log',
      log_file: './logs/airdrop-scheduler-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 1,
      exec_mode: 'fork',
      
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    }
  ]
};



