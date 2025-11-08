# Investment Share Calculator

A web application built with Flask that calculates investment shares and profit distribution among different types of contributors in a project.

## Features

- Calculate investment shares for multiple types of contributors:
  - Developers
  - Constructors
  - Investors
  - Property Owners
- Dynamic role bonus distribution
- Property value contribution with profit sharing
- Real-time share calculations
- PDF export with signature fields
- Multiple calculation comparison
- Automatic profit distribution calculations
- Comprehensive validation and error handling
- Production-ready with Docker support

## Calculation Model

The calculator uses a precise Decimal-based calculation model to avoid floating-point errors:

### Base Share Calculation
- **Base Share** = (Individual Payment / Total Investment) × 100
- Base shares are calculated proportionally based on each investor's payment relative to the total investment
- If total investment is zero, base shares are set to 0%

### Role Bonus Pools
- Each role (Developer, Constructor, Investor) has a total bonus percentage pool
- The pool is divided **equally** among all members with that role
- Example: If Developer bonus pool is 40% and there are 2 developers, each gets 20%

### Property Owner Shares
- **Base Share**: Fixed percentage based on property value contribution (configurable)
- **Profit Share**: Additional percentage that only applies if `sale_price > project_cost`
- Profit share is added on top of base share and role bonus

### Total Share Calculation
For each participant:
```
Total Share = Base Share + Role Bonus + Profit Share (if applicable)
```

### Validation Rules
- Sum of all total shares must not exceed 100%
- If total shares are between 95% and 100%, a warning is shown
- If total shares exceed 100%, calculation is blocked with an error
- Profit-based bonuses are zero if sale price ≤ project cost

## Setup

### Development Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set environment variables (optional):
```bash
export SECRET_KEY="your-secret-key-here"
export FLASK_DEBUG="true"  # For development
```

5. Run the application:
```bash
# Development mode
make dev
# or
flask run

# Production mode
gunicorn -c gunicorn.conf.py wsgi:app
```

6. Open your browser and navigate to:
```
http://127.0.0.1:5001
```

### Docker Setup

#### Using Docker Compose (Recommended)

1. Create a `.env` file (optional) with your configuration:
```bash
SECRET_KEY=your-secret-key-here
LOG_LEVEL=info
LOG_TO_CONSOLE=false
```

2. Build and run with Docker Compose (builds automatically if image doesn't exist):
```bash
docker-compose up -d
```

Or to force a rebuild:
```bash
docker-compose up -d --build
```

3. Access the application at `http://localhost:5001`

4. View logs:
```bash
# View logs in terminal
docker-compose logs -f

# View logs from file (Docker logs are also saved to files)
# Docker container logs: ~/.docker/containers/<container-id>/<container-id>-json.log
# Application logs: ./logs/app.log
# Gunicorn access logs: ./logs/gunicorn_access.log
# Gunicorn error logs: ./logs/gunicorn_error.log

# View application logs
tail -f logs/app.log

# View gunicorn access logs
tail -f logs/gunicorn_access.log

# View gunicorn error logs
tail -f logs/gunicorn_error.log
```

5. Stop the container:
```bash
docker-compose down
```

**Note:** The first time you run `docker-compose up`, it will automatically build the image. Subsequent runs will use the cached image unless you use `--build` flag.

#### Using Docker directly

1. Build the Docker image:
```bash
docker build -t investment-calculator .
```

2. Run the container:
```bash
docker run -d -p 5001:5000 \
  -e SECRET_KEY="your-secret-key" \
  -e FLASK_ENV=production \
  -e LOG_LEVEL=info \
  -v $(pwd)/logs:/app/logs \
  --name investment-calculator \
  investment-calculator
```

3. Check container status:
```bash
docker ps
docker logs investment-calculator
```

4. Stop the container:
```bash
docker stop investment-calculator
docker rm investment-calculator
```

### Environment Variables

- `SECRET_KEY`: Flask secret key for session management (required in production)
- `FLASK_DEBUG`: Set to `"true"` for development, `"false"` for production
- `FLASK_ENV`: Set to `production` for production deployment
- `LOG_LEVEL`: Logging level (default: `info`)
- `LOG_TO_CONSOLE`: Enable console logging (default: `false`)
- `LOG_DIR`: Directory for log files (default: `/app/logs` in container)

## Usage

1. Set the role bonus percentages for each type of contributor
2. Enter the project cost and sale price
3. Add property owner details if applicable (optional)
4. Add investors with their roles and payments
5. Click Calculate to see the results
6. Use "New Calculation" to compare different scenarios
7. Export results to PDF with signature fields

## Development

### Running Tests

```bash
make test
# or
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Code Quality

```bash
# Format code
make format

# Lint code
make lint
```

### Makefile Commands

- `make install` - Install dependencies
- `make run` - Run Flask development server
- `make dev` - Run with auto-reload
- `make test` - Run tests with coverage
- `make lint` - Run linters
- `make format` - Format code
- `make clean` - Clean cache files

## Project Structure

```
calc/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py             # Configuration
│   ├── logger.py             # Logging setup with file rotation
│   ├── routes.py             # Route handlers
│   ├── routes_api.py         # JSON API routes
│   ├── forms.py              # Flask-WTF forms
│   ├── services/
│   │   ├── calculator.py    # Core calculation logic
│   │   ├── validators.py     # Validation functions
│   │   └── models.py         # Pydantic models
│   ├── templates/
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── results.html
│   │   └── _banners.html
│   └── static/
│       ├── css/style.css
│       └── js/app.js
├── tests/
│   ├── test_calculator.py
│   └── test_validators.py
├── debug/                    # Debug artifacts and legacy code
│   ├── app_legacy.py         # Old monolithic app (reference only)
│   └── README.md
├── logs/                     # Application logs (gitignored)
│   └── app.log               # Rotating log file
├── scripts/                  # Build/test/release scripts
├── requirements.txt
├── Dockerfile
├── gunicorn.conf.py
├── wsgi.py                   # Production WSGI entry point
├── run.py                    # Development entry point
├── Makefile
└── README.md
```

### Logging

The application uses Python's `logging` module with rotating file handlers. Logs are written to `logs/app.log` and automatically rotated when they reach the configured size limit.

- **File logging**: Always enabled, writes to `logs/app.log`
- **Console logging**: Disabled by default, enable with `LOG_TO_CONSOLE=true`
- **Log rotation**: Automatic based on `LOG_MAX_SIZE` and `LOG_MAX_FILES`

Example usage:
```bash
# Enable console output for development
LOG_TO_CONSOLE=true LOG_LEVEL=DEBUG python run.py

# Production: logs only to file
LOG_LEVEL=INFO python run.py
```

## License

MIT License 