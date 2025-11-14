export const CONFIG = {
  TARGET_LISTINGS: 125000,
  CONCURRENCY: 8,
  DELAY_MIN: 3000,
  DELAY_MAX: 7000,
  MAX_RETRIES: 3,
  OUTPUT_FILE: "data/cars.csv",
  LOG_FILE: "logs/scraper.log",
  PROXY_PROVIDER: "brightdata",
  BRIGHTDATA_ZONE:
    "http://brd-customer-hl_678855f7-zone-residential_proxy1-country-au:nik36orpeb3h@brd.superproxy.io:33335",
  BRIGHTDATA_USER: "brd-customer-hl_678855f7-zone-residential_proxy1",
  BRIGHTDATA_PASS: "nik36orpeb3h",
  CAPTCHA_KEY: "",
  // Filter combos for ~125K coverage
  MAKES: [
    "Toyota",
    "Ford",
    "Honda",
    "Mazda",
    "Hyundai",
    "Volkswagen",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Nissan",
  ],
  YEARS_START: [2010, 2015, 2020], // Chunk years into ranges for efficiency
  YEARS_END: [2014, 2019, 2025], // Open-ended: 2025 means "to now"
};

// Helper to build Lucene query
export function buildQuery(make, yearStart, yearEnd = null) {
  const yearPart = yearEnd
    ? `YearRange.range(${yearStart}..${yearEnd})`
    : `YearRange.range(${yearStart}..)`;
  return `(And.Make.${make}._.${yearPart}.)`;
}
