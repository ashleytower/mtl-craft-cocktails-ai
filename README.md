# MTL Craft Cocktails AI Assistant

A voice-first AI dashboard for bartender event planning, packing list generation, and menu creation. This application integrates with Google Gemini (Live API) and Google Sheets to automate the logistics of bar service and cocktail workshops.

## 🚀 Features

- **Voice Operations Manager**: Real-time voice interaction (via Gemini Live API) to manage event details, ask questions, and update logistics hands-free.
- **Smart Packing Lists**: Automatically calculates alcohol, syrups, garnishes, and glassware quantities based on headcount, cocktail selection, and event type (Bar Service vs. Workshop).
- **Menu Builder**: Generates beautiful, printable PDF menus with custom branding, French translations, and smart styling.
- **Event Dashboard**: Manage multiple bookings, track payment status, and view logistics summaries (Bar/Glassware rentals).
- **Google Sheets Sync**: Two-way integration (read-heavy) to pull "Recipes" and "Active Events" from a master spreadsheet.
- **Rich Reporting**: Generate Notion-style event briefs and packing lists that can be emailed or copied to Excel.

## 🛠️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mtl-craft-cocktails-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Google Gemini API Key (Must have Google Sheets API enabled if using Sheet Sync)
   API_KEY=your_google_api_key_here
   ```

4. **Run Locally**
   ```bash
   npm start
   ```

## 📊 Google Sheets Configuration

To enable the sync feature, your Google Sheet must have the following two tabs with specific columns:

### 1. `Recipes` Tab
Used to populate the cocktail database.
*   **Columns A-H**: Name, Description, Method, Ingredient Name, Type, Quantity Per Drink, Unit, Container Size (oz)

### 2. `Active_Events` Tab
Used to populate the dashboard.
*   **Column A**: Client Name
*   **Column B**: Phone Number
*   **Column C**: Email
*   **Column D**: Date (YYYY-MM-DD)
*   **Column E**: Time (e.g., 18:00 - 23:00)
*   **Column F**: Location
*   **Column G**: Headcount
*   **Column H**: Cocktails (comma separated)
*   **Column I**: Type ("Bar Service" or "Workshop")
*   **Column J**: Paid? (Yes/No)
*   **Column K**: Lead Bartender Name
*   **Column L**: Bartender Email
*   **Column M**: Bar Rental (e.g., "Yes, 6ft, Gold")
*   **Column N**: Bar Size (fallback)
*   **Column O**: Bar Color (fallback)
*   **Column P**: Glass Rental? (Yes/No)
*   **Column Q**: Glass Types (comma separated)

## 📦 Deployment

This project is built with React and Vite. It is optimized for deployment on **Vercel**.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add your `API_KEY` in the Vercel Project Settings > Environment Variables.
4. Deploy!

## 🤖 AI Models Used
- **Gemini 2.0 Flash Exp**: For low-latency Live API (Voice) streaming.
- **Gemini 2.5 Flash**: For standard chat and tool processing.
- **Gemini 3.0 Pro**: For complex reasoning tasks (Thinking Mode).
