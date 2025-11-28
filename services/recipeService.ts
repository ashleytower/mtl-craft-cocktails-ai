
import { CocktailRecipe, IngredientType } from '../types';
import { MOCK_RECIPES, GOOGLE_SHEETS_CONFIG } from '../constants';

export const fetchRecipesFromSheet = async (): Promise<CocktailRecipe[]> => {
  // Check Config
  if (!GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID) {
      console.log("No Spreadsheet ID configured. Using local mock recipes.");
      return MOCK_RECIPES;
  }
  
  // Check API Key
  if (!process.env.API_KEY) {
      console.warn("API Key missing in environment, skipping Sheets fetch. Using mock recipes.");
      return MOCK_RECIPES;
  }

  try {
    const apiKey = process.env.API_KEY; 
    // Use the specific RECIPES_TAB_NAME
    const range = `${GOOGLE_SHEETS_CONFIG.RECIPES_TAB_NAME}!A2:H`; // Headers in Row 1
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Failed to fetch from Google Sheets (Status ${response.status}). Using mock recipes. Error: ${errorText}`);
        return MOCK_RECIPES;
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
        console.log("Sheet is empty or no data found. Using mock recipes.");
        return MOCK_RECIPES;
    }

    const recipesMap = new Map<string, CocktailRecipe>();
    let lastRecipeName = "";
    let lastDescription = "";
    let lastMethod = "";

    rows.forEach((row: string[]) => {
        // Expected Columns:
        // A: Name, B: Description, C: Method, D: Ingredient, E: Type, F: Qty, G: Unit, H: Container
        
        let name = row[0]?.trim();
        const description = row[1]?.trim();
        const method = row[2]?.trim();
        
        // Fill-down logic: If name is empty, belongs to previous cocktail
        if (!name && lastRecipeName) {
            name = lastRecipeName;
        } else if (name) {
            lastRecipeName = name;
            lastDescription = description || "";
            lastMethod = method || "";
        }

        if (!name) return;

        // Create Recipe Entry if not exists
        if (!recipesMap.has(name)) {
            recipesMap.set(name, {
                id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: name,
                englishDescription: description || lastDescription,
                method: method || lastMethod,
                ingredients: []
            });
        }

        const recipe = recipesMap.get(name)!;
        
        // Add Ingredient if present in this row
        const ingName = row[3]?.trim();
        if (ingName) {
            recipe.ingredients.push({
                name: ingName,
                type: (row[4]?.trim().toLowerCase() as IngredientType) || IngredientType.OTHERS,
                quantityPerDrink: parseFloat(row[5]) || 0,
                unit: row[6]?.trim() || 'unit',
                containerSize: row[7] ? parseFloat(row[7]) : undefined
            });
        }
    });

    const recipes = Array.from(recipesMap.values());
    console.log(`Successfully loaded ${recipes.length} recipes from Google Sheets.`);
    return recipes;

  } catch (error) {
    console.error("Unexpected error loading recipes from sheet:", error);
    console.log("Falling back to local mock recipes.");
    return MOCK_RECIPES;
  }
};
