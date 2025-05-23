import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import App from "./App";

// Mock axios
jest.mock("axios");

// Mock date-fns to return consistent dates
jest.mock("date-fns", () => ({
  format: jest.fn((date) => date.toISOString().split("T")[0]),
  subDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }),
  isBefore: jest.fn((date1, date2) => date1 < date2)
}));

/**
 * Test suite for the Currency Exchange Tracker component
 * Tests core functionality including:
 * - Component rendering
 * - Currency loading and display
 * - Currency selection and management
 * - Date handling
 * - Exchange rate display
 */
describe("Currency Exchange Tracker", () => {
  /**
   * Mock data for available currencies
   * Used to simulate API responses for currency list
   */
  const mockCurrencies = {
    usd: "United States Dollar",
    eur: "Euro",
    jpy: "Japanese Yen",
    chf: "Swiss Franc",
    cad: "Canadian Dollar",
    aud: "Australian Dollar",
    zar: "South African Rand",
    inr: "Indian Rupee",
  };

  /**
   * Mock exchange rate data
   * Simulates API response for exchange rates
   */
  const mockExchangeData = {
    gbp: {
      usd: 1.2,
      eur: 1.1,
      jpy: 140,
      chf: 1.3,
      cad: 1.5,
      aud: 1.6,
      zar: 22,
      inr: 102,
    },
  };

  /**
   * Test setup before each test
   * Resets mocks and configures API responses
   */
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the currencies API call
    axios.get.mockImplementation((url) => {
      if (url.includes("currencies.json")) {
        return Promise.resolve({ data: mockCurrencies });
      }
      if (url.includes("/currencies/gbp.json")) {
        return Promise.resolve({ data: mockExchangeData });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  /**
   * Test: Component renders with all main elements
   * Verifies that all essential UI components are present
   */
  test("renders main components", async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getByText("Currency Exchange Tracker")).toBeInTheDocument();
    expect(screen.getByLabelText("Base Currency:")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Date:")).toBeInTheDocument();
    expect(screen.getByLabelText("Tracked Currencies:")).toBeInTheDocument();
  });

  /**
   * Test: Currency loading and display
   * Verifies that currencies are loaded from API and displayed correctly
   */
  test("loads and displays currencies", async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for API call to complete
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("currencies.json")
      );
    });

    // Check if default currencies are displayed in currency tags
    const currencyElements = screen.getAllByText(/USD|EUR|JPY/);
    expect(currencyElements.length).toBeGreaterThanOrEqual(3);
    expect(currencyElements.some(el => el.textContent.includes("USD"))).toBeTruthy();
    expect(currencyElements.some(el => el.textContent.includes("EUR"))).toBeTruthy();
    expect(currencyElements.some(el => el.textContent.includes("JPY"))).toBeTruthy();
  });

  /**
   * Test: Base currency selection
   * Verifies that users can change the base currency
   */
  test("allows changing base currency", async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for the select element to be populated
    await waitFor(() => {
      expect(screen.getByLabelText("Base Currency:")).toBeInTheDocument();
    });

    const baseSelect = screen.getByLabelText("Base Currency:");
    
    await act(async () => {
      fireEvent.change(baseSelect, { target: { value: "eur" } });
    });

    await waitFor(() => {
      expect(baseSelect.value).toBe("eur");
    });
  });

  /**
   * Test: Currency management
   * Verifies adding and removing tracked currencies
   * Tests minimum/maximum currency limits
   */
  test("handles adding and removing currencies", async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("Add currency")).toBeInTheDocument();
    });

    // Get initial currency count
    const initialTags = screen.getAllByRole("button").filter(btn => btn.textContent === "X");
    const initialCount = initialTags.length;

    // Try to remove a currency
    await act(async () => {
      fireEvent.click(initialTags[0]);
    });

    // Verify we don't go below minimum
    const remainingTags = screen.getAllByRole("button").filter(btn => btn.textContent === "X");
    expect(remainingTags.length).toBeGreaterThanOrEqual(3);

    // Add a new currency if possible
    if (initialCount < 7) {
      const addSelect = screen.getByLabelText("Tracked Currencies:");
      
      await act(async () => {
        fireEvent.change(addSelect, { target: { value: "gbp" } });
      });
      
      // Wait for the new currency to be added
      await waitFor(() => {
        const updatedTags = screen.getAllByRole("button").filter(btn => btn.textContent === "X");
        expect(updatedTags.length).toBe(Math.min(7, initialCount + 1));
      });
    }
  });

  /**
   * Test: Date selection
   * Verifies that users can change the date
   */
  test("handles date changes", async () => {
    await act(async () => {
      render(<App />);
    });

    const dateInput = screen.getByLabelText("Select Date:");
    expect(dateInput).toBeInTheDocument();

    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 5);
    const dateString = newDate.toISOString().split("T")[0];

    await act(async () => {
      fireEvent.change(dateInput, { target: { value: dateString } });
    });

    expect(dateInput.value).toBe(dateString);
  });

  /**
   * Test: Exchange rate display
   * Verifies that exchange rates are fetched and displayed correctly
   */
  test("displays exchange rate data", async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for exchange rate data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("currencies/gbp.json")
      );
    });

    // Check for table presence
    const table = await screen.findByRole("table");
    expect(table).toBeInTheDocument();

    // Check table headers
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveTextContent("Date");
    
    // Check for currency columns (using case-insensitive regex)
    const headerTexts = headers.map(header => header.textContent);
    expect(headerTexts.some(text => /USD/i.test(text))).toBeTruthy();
    expect(headerTexts.some(text => /EUR/i.test(text))).toBeTruthy();
  });
});
