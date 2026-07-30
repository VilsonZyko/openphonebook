module.exports = {
  apps: [{
    name: "openphonebook",
    script: "./server.js",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    watch: false,
    max_memory_restart: '1G',
    log_date_format: "YYYY-MM-DD HH:mm Z"
  }]
}
