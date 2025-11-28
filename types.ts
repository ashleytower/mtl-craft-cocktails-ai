
export enum IngredientType {
  ALCOHOL = "alcohol",
  SYRUP = "syrup",
  JUICE = "juice",
  GARNISH = "garnish",
  GLASS = "glass",
  SODA = "soda",
  OTHERS = "others"
}

export interface Ingredient {
  name: string;
  type: IngredientType;
  quantityPerDrink: number;
  unit: string;
  // Used for calculating bottles/cans needed based on standard bottle sizes (e.g., 26oz for spirits, cans for soda)
  containerSize?: number; 
}

export interface CocktailRecipe {
  id: string;
  name: string;
  englishDescription: string;
  method: string;
  ingredients: Ingredient[];
}

export interface EventData {
  id: string;
  eventType: 'Bar Service' | 'Workshop'; 
  clientName: string;
  clientPhone: string; // Added Phone
  isPaid: boolean;     // Added Payment Status
  eventDate: string;
  endTime: string; 
  headcount: number;
  location: string;
  status: "Inquiry" | "Proposal Sent" | "Booked" | "Ready for Prep" | "Completed";
  cocktailSelections: string[];
  bartender: {
    name: string;
    email: string;
  };
  barRental: {
    required: boolean;
    size?: string;
    color?: string;
  };
  glassRental: {
    required: boolean;
    items?: { type: string; quantity: number }[];
  };
  clientSuppliesAlcohol?: boolean;
}

export interface PackingItem {
  name: string;
  quantityNeededOz: number;
  containersNeeded: number;
  unit: string;
  breakdown: string;
}

export interface PackingListCategory {
  items: PackingItem[];
}

export interface PackingList {
  eventId: string;
  generatedAt: string;
  summary: {
    totalDrinks: number;
    drinksPerCocktail: number;
  };
  categories: {
    [key in IngredientType]: PackingItem[];
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
