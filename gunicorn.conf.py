"""Gunicorn configuration."""
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = (2 * multiprocessing.cpu_count()) + 1
worker_class = "sync"
worker_connections = 1000
timeout = 60
keepalive = 2

# Logging
# Write to files if LOG_DIR is set, otherwise use stdout/stderr
log_dir = os.environ.get("LOG_DIR", "/app/logs")
accesslog = os.path.join(log_dir, "gunicorn_access.log") if log_dir else "-"
errorlog = os.path.join(log_dir, "gunicorn_error.log") if log_dir else "-"
loglevel = os.environ.get("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "investment_calculator"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
# keyfile = None
# certfile = None

