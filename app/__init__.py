"""Flask application factory."""
import logging
from flask import Flask

from app.config import config


def create_app(config_name='default'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Reduce logging to WARNING to avoid logging request bodies
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.WARNING)
    app.logger.setLevel(logging.WARNING)
    
    # Add security headers to prevent caching and data storage
    @app.after_request
    def add_security_headers(resp):
        """Add headers to prevent caching and data storage."""
        resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, private"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "no-referrer"
        return resp
    
    # Initialize extensions (optional - will be added in section 6)
    try:
        from flask_talisman import Talisman
        Talisman(
            app,
            content_security_policy={
                'default-src': "'self'",
                'script-src': "'self'",
                'style-src': "'self'",
            },
            force_https=False  # Allow HTTP in development
        )
    except ImportError:
        pass  # Will be added in section 6
    
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=["200 per day", "50 per hour"],
            storage_uri="memory://"
        )
    except ImportError:
        pass  # Will be added in section 6
    
    # Register blueprints
    from app.routes import bp
    app.register_blueprint(bp)
    
    from app.routes_api import api as api_bp
    app.register_blueprint(api_bp)
    
    return app

