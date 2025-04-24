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

## Setup

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
pip install flask
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://127.0.0.1:5000
```

## Usage

1. Set the role bonus percentages for each type of contributor
2. Enter the project cost and sale price
3. Add property owner details if applicable
4. Add investors with their roles and payments
5. Click Calculate to see the results
6. Use "New Calculation" to compare different scenarios
7. Export results to PDF with signature fields

## License

MIT License 