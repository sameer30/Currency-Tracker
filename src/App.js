import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { format, subDays, isBefore } from "date-fns";
import './index.css';

/**
 * API Configuration
 */
const CONFIG = {
  API_BASE: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api",
  DEFAULT_BASE: "gbp",
  DEFAULT_CURRENCIES: ["usd", "eur", "jpy", "chf", "cad", "aud", "zar"],
  MIN_CURRENCIES: 3,
  MAX_CURRENCIES: 7,
  MIN_DATE_DAYS: 90, // Minimum days in the past allowed
  RATE_DECIMAL_PLACES: 4
};

/**
 * Header Component - Renders the application title
 */
const Header = () => (
  <h1>Currency Exchange Tracker</h1>
);

/**
 * CurrencySelector Component - Handles base currency selection
 */
const CurrencySelector = ({ value, onChange, currencies }) => (
  <div>
    <label htmlFor="base-currency">Base Currency:</label>
    <select 
      id="base-currency"
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.entries(currencies).map(([code, name]) => (
        <option key={code} value={code}>
          {code.toUpperCase()} - {name}
        </option>
      ))}
    </select>
  </div>
);

/**
 * DateSelector Component - Handles date selection
 */
const DateSelector = ({ value, onChange }) => (
  <div>
    <label htmlFor="date-select">Select Date:</label>
    <input
      id="date-select"
      type="date"
      max={format(new Date(), "yyyy-MM-dd")}
      value={value}
      onChange={onChange}
    />
  </div>
);

/**
 * CurrencyTags Component - Displays and manages tracked currencies
 */
const CurrencyTags = ({ 
  selectedCurrencies, 
  onRemove, 
  onAdd, 
  availableCurrencies,
  showWarning 
}) => (
  <div className="tracked-currencies">
    <label htmlFor="add-currency">Tracked Currencies:</label>
    <div className="currency-tags-container">
      {selectedCurrencies.map((code) => (
        <span key={code} className="currency-tag">
          {code.toUpperCase()}
          <button 
            onClick={() => onRemove(code)}
            aria-label={`Remove ${code.toUpperCase()}`}
          >
            X
          </button>
        </span>
      ))}
    </div>

    {showWarning && (
      <div className="warning-message">
        Maximum limit of {CONFIG.MAX_CURRENCIES} currencies reached
      </div>
    )}

    <div>
      <select 
        id="add-currency"
        className="currStyle" 
        onChange={(e) => {
          if (e.target.value) {
            onAdd(e.target.value);
            e.target.value = "";
          }
        }}
      >
        <option value="">Add currency</option>
        {Object.keys(availableCurrencies)
          .filter((code) => !selectedCurrencies.includes(code))
          .map((code) => (
            <option key={code} value={code}>
              {code.toUpperCase()} - {availableCurrencies[code]}
            </option>
          ))}
      </select>
    </div>
  </div>
);

/**
 * ExchangeTable Component - Displays exchange rate data
 */
const ExchangeTable = ({ data, currencies }) => (
  <div className="table-container">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          {currencies.map((code) => (
            <th key={code}>{code.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.keys(data)
          .sort()
          .reverse()
          .map((dateKey) => (
            <tr key={dateKey}>
              <td>{dateKey}</td>
              {currencies.map((code) => (
                <td key={code}>
                  {data[dateKey]?.[code]?.toFixed(CONFIG.RATE_DECIMAL_PLACES) ?? "N/A"}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

/**
 * Main App Component
 */
export default function App() {
  // State management
  const [baseCurrency, setBaseCurrency] = useState(CONFIG.DEFAULT_BASE);
  const [availableCurrencies, setAvailableCurrencies] = useState({});
  const [selectedCurrencies, setSelectedCurrencies] = useState(CONFIG.DEFAULT_CURRENCIES);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exchangeData, setExchangeData] = useState({});
  const [error, setError] = useState(null);
  const [maxCurrencyWarning, setMaxCurrencyWarning] = useState(false);

  /**
   * Fetches available currencies from the API
   */
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(`${CONFIG.API_BASE}@latest/v1/currencies.json`);
        setAvailableCurrencies(response.data);
      } catch (err) {
        setError("Failed to load currencies. Please try again later.");
        console.error("Currency list fetch failed:", err);
      }
    };

    fetchCurrencies();
  }, []);

  /**
   * Fetches exchange rates when base currency or date changes
   */
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const results = {};
        const promises = [];

        // Create promises for fetching exchange rates for the last 7 days
        for (let i = 0; i < 7; i++) {
          const currentDate = format(subDays(new Date(date), i), "yyyy-MM-dd");
          const url = `${CONFIG.API_BASE}@${currentDate}/v1/currencies/${baseCurrency}.json`;

          promises.push(
            axios
              .get(url)
              .then((res) => {
                results[currentDate] = res.data[baseCurrency];
              })
              .catch(() => {
                results[currentDate] = null;
              })
          );
        }

        await Promise.all(promises);
        setExchangeData(results);
        setError(null);
      } catch (err) {
        setError("Failed to fetch exchange rates. Please try again later.");
      }
    };

    fetchExchangeRates();
  }, [baseCurrency, date]);

  /**
   * Handles date selection changes
   */
  const handleDateChange = useCallback((e) => {
    const newDate = new Date(e.target.value);
    const minDate = subDays(new Date(), CONFIG.MIN_DATE_DAYS);

    if (isBefore(newDate, minDate)) {
      setError(`Date must be within the last ${CONFIG.MIN_DATE_DAYS} days.`);
      return;
    }

    setDate(format(newDate, "yyyy-MM-dd"));
    setError(null);
  }, []);

  /**
   * Handles adding a new currency to track
   */
  const handleAddCurrency = useCallback((code) => {
    if (selectedCurrencies.length >= CONFIG.MAX_CURRENCIES) {
      setMaxCurrencyWarning(true);
      setTimeout(() => setMaxCurrencyWarning(false), 3000);
      return;
    }
    if (selectedCurrencies.includes(code)) return;
    
    setSelectedCurrencies(prev => [...prev, code]);
    setMaxCurrencyWarning(false);
  }, [selectedCurrencies]);

  /**
   * Handles removing a currency from tracking
   */
  const handleRemoveCurrency = useCallback((code) => {
    if (selectedCurrencies.length <= CONFIG.MIN_CURRENCIES) {
      setError(`Minimum ${CONFIG.MIN_CURRENCIES} currencies required`);
      return;
    }
    setSelectedCurrencies(prev => prev.filter(c => c !== code));
    setError(null);
  }, [selectedCurrencies]);

  return (
    <div className="container">
      <Header />
      
      <div className="controls">
        <CurrencySelector 
          value={baseCurrency}
          onChange={setBaseCurrency}
          currencies={availableCurrencies}
        />
        <DateSelector 
          value={date}
          onChange={handleDateChange}
        />
      </div>

      <CurrencyTags 
        selectedCurrencies={selectedCurrencies}
        onRemove={handleRemoveCurrency}
        onAdd={handleAddCurrency}
        availableCurrencies={availableCurrencies}
        showWarning={maxCurrencyWarning}
      />

      <ExchangeTable 
        data={exchangeData}
        currencies={selectedCurrencies}
      />

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
