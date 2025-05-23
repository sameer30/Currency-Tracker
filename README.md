# Currency Exchange Tracker

A React-based application for tracking and comparing currency exchange rates over time. Monitor multiple currencies simultaneously and view historical exchange rate data for the past week.

## Features

- Track up to 7 different currencies simultaneously
- View exchange rates for the past 7 days
- Change base currency for comparisons
- Select custom dates (within 90 days)
- Real-time currency rate updates
- Responsive table view of exchange rates

## Technology Stack

- React 19.1.0
- Axios for API calls
- date-fns for date manipulation
- Jest and React Testing Library for testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd currency-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Running Tests

Run the test suite with:
```bash
npm test
```

## Usage

1. **Select Base Currency**: Choose your reference currency from the dropdown menu
2. **Add Currencies**: Select up to 7 currencies to track from the "Add currency" dropdown
3. **View Historical Data**: The table shows exchange rates for the past 7 days
4. **Change Date**: Use the date picker to view rates for different dates (within 90 days)
5. **Remove Currencies**: Click the 'X' button next to a currency tag to stop tracking it

## API

This project uses the [Currency API](https://github.com/fawazahmed0/currency-api) for exchange rate data. The API is free and doesn't require authentication.

## Project Structure

```
currency-tracker/
├── src/
│   ├── App.js           # Main application component
│   ├── App.test.js      # Component tests
│   ├── index.js         # Application entry point
│   └── index.css        # Global styles
├── public/
│   └── index.html       # HTML template
└── package.json         # Project dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Currency API](https://github.com/fawazahmed0/currency-api) for providing free exchange rate data
- React Testing Library for testing utilities
- date-fns for date manipulation utilities
