module.exports = {
  apps: [
    {
      name: "salepay-backend",
      cwd: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/backend",
      script: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/backend/venv/bin/uvicorn",
      args: "main:app --host 127.0.0.1 --port 4000 --workers 4",
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PYTHONPATH: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/backend",
        APP_ENV: "prod",
        PORT: 4000
      }
    },
    {
      name: "salepay-pos-frontend",
      cwd: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "salepay-ecommerce",
      cwd: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/ecommerce-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "salepay-website",
      cwd: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/website-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    },
    {
      name: "salepay-ollama",
      script: "ollama",
      args: "serve",
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        OLLAMA_HOST: "127.0.0.1:11434"
      }
    }
  ]
};
