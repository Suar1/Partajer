"""Logging configuration with file rotation and console toggle."""
import logging
import logging.handlers
import os
from pathlib import Path


def setup_logger(name: str = 'app', log_dir: str = None) -> logging.Logger:
    """
    Set up a logger with rotating file handler and optional console output.
    
    Args:
        name: Logger name (default: 'app')
        log_dir: Directory for log files (default: ./logs)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Don't add handlers if already configured
    if logger.handlers:
        return logger
    
    # Get configuration from environment
    log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_to_console = os.environ.get('LOG_TO_CONSOLE', 'false').lower() == 'true'
    log_dir = log_dir or os.environ.get('LOG_DIR', './logs')
    log_max_size = int(os.environ.get('LOG_MAX_SIZE', 10 * 1024 * 1024))  # 10MB default
    log_max_files = int(os.environ.get('LOG_MAX_FILES', 5))
    
    # Create log directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Set log level
    logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # File handler with rotation
    log_file = log_path / 'app.log'
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=log_max_size,
        backupCount=log_max_files,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Format for file logs (detailed)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Console handler (optional)
    if log_to_console:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
    
    return logger

