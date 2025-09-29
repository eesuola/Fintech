import { parsePhoneNumberFromString } from "libphonenumber-js";
import { countryCurrencyMap } from "./countryCurrency.js";


export const getCountryAndCurrencyFromPhone = (phoneNumber) => {
  try {
    const parsed = parsePhoneNumberFromString(phoneNumber);

    if (!parsed || !parsed.isValid()) {
      return { country: null, currency: null };
    }

    const country = parsed.country; 
    const currency = countryCurrencyMap[country] || null;

    return { country, currency };
  } catch (error) {
    console.error("Phone parsing error:", error.message);
    return { country: null, currency: null };
  }
};
