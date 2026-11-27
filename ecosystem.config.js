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
      args: "start -p 3050",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3050
      }
    },
    {
      name: "salepay-ecommerce",
      cwd: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/ecommerce-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3051",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3051
      }
    },
    {
      name: "salepay-website",
      cwd: "/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/website-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3007",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3007
      }
    }
  ]
};
