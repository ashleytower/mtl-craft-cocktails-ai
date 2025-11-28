
import { EventData } from '../types';
import { GOOGLE_SHEETS_CONFIG, INITIAL_EVENT } from '../constants';

export const fetchEventsFromSheet = async (): Promise<EventData[]> => {
  if (!process.env.API_KEY || !GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID) {
      console.warn("Missing API Config, returning mock initial event.");
      return [INITIAL_EVENT];
  }

  try {
    const apiKey = process.env.API_KEY;
    const range = `${GOOGLE_SHEETS_CONFIG.EVENTS_TAB_NAME}!A2:Q`; // Fetch Columns A through Q
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${range}?key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        console.warn("Failed to fetch events from sheet");
        return [INITIAL_EVENT];
    }

    const data = await response.json();
    const rows = data.values;

    if (!rows || rows.length === 0) return [INITIAL_EVENT];

    return rows.map((row: string[], index: number) => {
        /**
         * MAPPING
         * A: Client Name
         * B: Phone
         * C: Email
         * D: Date
         * E: Time
         * F: Location
         * G: Headcount
         * H: Cocktails
         * I: Type
         * J: Paid
         * K: Lead Bartender
         * L: Bartender Email
         * M: Bar Rental (Yes/No/Details)
         * N: Bar Size
         * O: Bar Color
         * P: Glass Rental (Yes/No)
         * Q: Glass Types
         */
        
        // Date/Time Parsing
        const dateStr = row[3] || new Date().toISOString().split('T')[0];
        const timeStr = row[4] || "18:00";
        let startIso = `${dateStr}T18:00:00`;
        let endIso = `${dateStr}T23:00:00`;

        if (!dateStr.includes('T')) {
            const times = timeStr.split('-').map(t => t.trim());
            const startH = times[0] ? times[0] : "18:00";
            const endH = times[1] ? times[1] : "23:00";
            // Ensure simple ISO format
            startIso = `${dateStr}T${startH.includes(':') ? startH : startH + ':00'}`;
            endIso = `${dateStr}T${endH.includes(':') ? endH : endH + ':00'}`;
        }

        // Rental Parsing
        const barStr = (row[12] || "").toLowerCase();
        const barRequired = barStr.includes('yes') || barStr.length > 3;
        const glassStr = (row[15] || "").toLowerCase();
        const glassRequired = glassStr.includes('yes');

        // Parse Glass Items if provided
        let glassItems = [];
        if (row[16]) {
            glassItems = row[16].split(',').map(g => ({ type: g.trim(), quantity: 0 })); // Qty calc'd later
        } else if (glassRequired) {
            glassItems = [{ type: "Standard Mix", quantity: 0 }];
        }

        return {
            id: `evt-sheet-${index}`,
            clientName: row[0] || "Unknown Client",
            clientPhone: row[1] || "",
            // Email (C) skipped in current EventData model or mapped to desc
            eventDate: startIso,
            endTime: endIso,
            location: row[5] || "TBD",
            headcount: parseInt(row[6]) || 0,
            cocktailSelections: row[7] ? row[7].split(',').map(s => s.trim()) : [],
            eventType: (row[8]?.toLowerCase().includes('workshop') ? 'Workshop' : 'Bar Service') as any,
            isPaid: (row[9] || "").toLowerCase().includes('yes'),
            status: 'Booked', // Default status for sheet imports
            bartender: {
                name: row[10] || "TBD",
                email: row[11] || ""
            },
            barRental: {
                required: barRequired,
                size: row[13] || (barRequired ? "6ft Mobile" : ""),
                color: row[14] || (barRequired ? "Standard" : "")
            },
            glassRental: {
                required: glassRequired,
                items: glassItems
            },
            clientSuppliesAlcohol: false // Default
        };
    });

  } catch (error) {
    console.error("Error fetching events:", error);
    return [INITIAL_EVENT];
  }
};
