
import { EventData, PackingList, IngredientType, PackingItem, CocktailRecipe } from '../types';
import { MOCK_RECIPES } from '../constants';

// Update: Now accepts availableRecipes to ensure custom/fetched recipes are used
export const calculatePackingList = (event: EventData, availableRecipes: CocktailRecipe[] = MOCK_RECIPES): PackingList => {
  try {
      if (!event) throw new Error("Event data is missing.");

      const isWorkshop = event.eventType === 'Workshop';

      // --- LOGIC SPLIT ---
      let list: PackingList;
      if (isWorkshop) {
          list = calculateWorkshopList(event, availableRecipes);
      } else {
          list = calculateBarServiceList(event, availableRecipes);
      }

      // GLOBAL RULE: Always ensure Simple Syrup and Butterfly Pea Syrup exist
      ensureEssentialItem(list, "Simple Syrup", IngredientType.SYRUP, 1, "bottle", "26");
      ensureEssentialItem(list, "Butterfly Pea Syrup", IngredientType.SYRUP, 1, "bottle", "26");

      return list;

  } catch (error) {
      console.error("Critical Error during packing list calculation:", error);
      // Return safe empty structure to prevent UI crash
      return {
          eventId: event?.id || "error",
          generatedAt: new Date().toISOString(),
          summary: {
              totalDrinks: 0,
              drinksPerCocktail: 0
          },
          categories: {
            [IngredientType.ALCOHOL]: [],
            [IngredientType.SYRUP]: [],
            [IngredientType.JUICE]: [],
            [IngredientType.GARNISH]: [],
            [IngredientType.GLASS]: [],
            [IngredientType.SODA]: [],
            [IngredientType.OTHERS]: []
          }
      };
  }
};

/**
 * WORKSHOP CALCULATION LOGIC
 * Rules:
 * - Alcohol: 16oz bottles, 1 bottle per 5 people.
 * - Syrups, Lemon/Lime, Eggwhites: 1 bottle per 4 people.
 * - Garnishes: 1 Jar per 5 people.
 */
const calculateWorkshopList = (event: EventData, recipes: CocktailRecipe[]): PackingList => {
    // Determine Effective Headcount (Base)
    const headcount = event.headcount;

    const packingMap: Map<string, PackingItem & { type: IngredientType }> = new Map();

    event.cocktailSelections.forEach(selectionName => {
        const recipe = recipes.find(r => r.name.toLowerCase() === selectionName.toLowerCase());
        
        if (!recipe) {
            console.warn(`[Calculation] Recipe not found for selection: "${selectionName}". Skipping.`);
            return;
        }

        recipe.ingredients.forEach(ing => {
            // SKIP ALCOHOL IF CLIENT SUPPLIES
            if (event.clientSuppliesAlcohol && ing.type === IngredientType.ALCOHOL) {
                return;
            }

            let ingredientName = ing.name;
            
            // Handle Plastic Logic for Workshops (if applicable)
            if (ing.type === IngredientType.GLASS && !event.glassRental.required) {
                ingredientName = "Plastic Cup";
            }

            const existing = packingMap.get(ingredientName);
            
            let containersNeeded = 0;
            let quantityDisplay = 0; 
            let unitDisplay = ing.unit;
            let breakdownText = "";

            if (ing.type === IngredientType.ALCOHOL) {
                // Rule: 1 bottle (16oz) per 5 people
                containersNeeded = Math.ceil(headcount / 5);
                quantityDisplay = containersNeeded * 16; 
                unitDisplay = "oz";
                breakdownText = `16oz btl (1 per 5)`;
            } 
            else if (ing.type === IngredientType.SYRUP || ing.name.includes("Lemon") || ing.name.includes("Lime") || ing.name.toLowerCase().includes("egg")) {
                 // Rule: 1 bottle (4oz) per 4 people (Includes Eggwhites per user request)
                 containersNeeded = Math.ceil(headcount / 4);
                 quantityDisplay = containersNeeded * 4;
                 unitDisplay = "oz";
                 breakdownText = `btl (1 per 4)`;
            }
            else if (ing.type === IngredientType.GARNISH) {
                 // Rule: 1 Jar per 5 people
                 containersNeeded = Math.ceil(headcount / 5);
                 quantityDisplay = containersNeeded;
                 unitDisplay = "jars";
                 breakdownText = `Jar (1 per 5)`;
            }
            else if (ing.type === IngredientType.GLASS && !event.glassRental.required) {
                // Plastic Cups: Headcount + 20% Buffer
                containersNeeded = Math.ceil(headcount * 1.2);
                quantityDisplay = containersNeeded;
                breakdownText = `1.2 per person (Plastic)`;
            }
            else {
                // Default fallback for Glassware, Soda, etc. in workshops
                containersNeeded = Math.ceil(headcount);
                quantityDisplay = headcount;
                breakdownText = `1 per person`;
            }

            if (existing) {
                // For workshops, we generally accumulate based on headcount rules
                existing.containersNeeded += containersNeeded;
                existing.quantityNeededOz += quantityDisplay;
                existing.breakdown += `, ${recipe.name}`;
            } else {
                packingMap.set(ingredientName, {
                    name: ingredientName,
                    quantityNeededOz: quantityDisplay,
                    containersNeeded: containersNeeded,
                    unit: unitDisplay,
                    type: ing.type,
                    breakdown: `${recipe.name} [${breakdownText}]`
                });
            }
        });
    });

    return formatList(event, packingMap, headcount);
};

/**
 * BAR SERVICE CALCULATION LOGIC
 * Standard volume-based math + White Bucket Essentials
 */
const calculateBarServiceList = (event: EventData, recipes: CocktailRecipe[]): PackingList => {
    // 1 drink of each cocktail per person implies:
    const totalDrinksPerCocktail = event.headcount; 
    
    const packingMap: Map<string, PackingItem & { type: IngredientType }> = new Map();

    // 1. Process Selected Cocktails
    event.cocktailSelections.forEach(selectionName => {
        const recipe = recipes.find(r => r.name.toLowerCase() === selectionName.toLowerCase());
        
        if (!recipe) {
            console.warn(`[Calculation] Recipe not found for selection: "${selectionName}". Skipping.`);
            return;
        }

        recipe.ingredients.forEach(ing => {
            // SKIP ALCOHOL IF CLIENT SUPPLIES
            if (event.clientSuppliesAlcohol && ing.type === IngredientType.ALCOHOL) {
                return;
            }

            // Calculate Volume
            let qtyPerDrink = ing.quantityPerDrink;
            
            // Fix for Eggwhite / Splash units
            // If unit is "splash", treat as 0.25 oz for calculation against 8oz bottle
            if (ing.unit.toLowerCase() === 'splash' || ing.name.toLowerCase().includes('egg')) {
                // Assuming 1 splash ~ 0.25 oz
                if (ing.unit.toLowerCase() === 'splash') {
                    qtyPerDrink = 0.25; 
                }
            }

            // Total ounces needed for this ingredient for the entire party
            const totalQtyForIng = qtyPerDrink * totalDrinksPerCocktail;
            
            let containers = 0;
            if (ing.containerSize) {
                // e.g. 50oz needed / 26oz bottle = 1.92 -> 2 bottles
                containers = Math.ceil(totalQtyForIng / ing.containerSize);
            } else {
                // If no container size (e.g. garnish units), assumes 1:1
                containers = Math.ceil(totalQtyForIng);
            }

            // Handle Plastic Cups Logic
            let ingredientName = ing.name;
            if (ing.type === IngredientType.GLASS && !event.glassRental.required) {
                ingredientName = "Plastic Cup";
                // 20% Buffer for Plastic Cups
                containers = Math.ceil(totalDrinksPerCocktail * 1.2); 
            }

            const existing = packingMap.get(ingredientName);

            if (existing) {
                existing.quantityNeededOz += totalQtyForIng;
                // Recalculate containers based on accumulated total
                if (ing.containerSize) {
                    existing.containersNeeded = Math.ceil(existing.quantityNeededOz / ing.containerSize);
                } else if (ing.type === IngredientType.GLASS && !event.glassRental.required) {
                    // Accumulate plastic cups properly
                    existing.containersNeeded += containers;
                } else {
                    existing.containersNeeded = Math.ceil(existing.quantityNeededOz);
                }
                existing.breakdown += `, ${recipe.name} (${Math.round(totalQtyForIng * 10)/10} oz)`;
            } else {
                packingMap.set(ingredientName, {
                    name: ingredientName,
                    quantityNeededOz: totalQtyForIng,
                    containersNeeded: containers,
                    unit: ing.unit === 'splash' ? 'oz (est)' : ing.unit,
                    type: ing.type,
                    breakdown: `${recipe.name} (${Math.round(totalQtyForIng * 10)/10} oz)`
                });
            }
        });
    });

    // 2. Add "White Bucket" Essentials (Fixed List)
    addWhiteBucketItem(packingMap, "Sprite", 6, "cans");
    addWhiteBucketItem(packingMap, "Ginger Ale", 6, "cans");
    addWhiteBucketItem(packingMap, "Coke", 6, "cans");
    addWhiteBucketItem(packingMap, "Tonic Water", 6, "cans");
    addWhiteBucketItem(packingMap, "Club Soda", 6, "cans");
    addWhiteBucketItem(packingMap, "Club Soda (2L)", 1, "bottle");

    const list = formatList(event, packingMap, event.headcount);

    // 3. BAR SERVICE RULE: Add Core Spirits if not present (unless client supplies)
    if (!event.clientSuppliesAlcohol) {
        const coreSpirits = ["Vodka", "Gin", "Rum", "Tequila", "Whiskey", "Triple Sec"];
        coreSpirits.forEach(spirit => {
            ensureEssentialItem(list, spirit, IngredientType.ALCOHOL, 1, "bottle", "26");
        });
    }

    return list;
};

// Helper to add white bucket items ensuring they don't overwrite main ingredients if names collide
const addWhiteBucketItem = (
    map: Map<string, PackingItem & { type: IngredientType }>, 
    name: string, 
    count: number, 
    unit: string
) => {
    const existing = map.get(name);
    if (existing) {
        existing.containersNeeded += count;
        existing.breakdown += `, White Bucket (+${count})`;
    } else {
        map.set(name, {
            name: name,
            quantityNeededOz: 0, 
            containersNeeded: count,
            unit: unit,
            type: IngredientType.SODA,
            breakdown: "White Bucket Essential"
        });
    }
};

// Ensure an essential item exists in the formatted list (post-calculation)
const ensureEssentialItem = (
    list: PackingList,
    name: string,
    type: IngredientType,
    minQty: number,
    unit: string,
    containerSizeDesc: string
) => {
    const category = list.categories[type];
    if (!category) return; // Should not happen if initialized correctly

    const existing = category.find(i => i.name.toLowerCase() === name.toLowerCase());
    
    if (!existing) {
        category.push({
            name: name,
            quantityNeededOz: 0,
            containersNeeded: minQty,
            unit: unit,
            breakdown: "Bar Essential / Backup"
        });
    }
};

// Helper to format the final output object
const formatList = (event: EventData, map: Map<string, PackingItem & { type: IngredientType }>, headcountRef: number): PackingList => {
    const categories: any = {};
    Object.values(IngredientType).forEach(type => {
        categories[type] = [];
    });

    map.forEach(item => {
        if (categories[item.type]) {
            categories[item.type].push(item);
        } else {
            if (!categories['others']) categories['others'] = [];
            categories['others'].push(item);
        }
    });

    return {
        eventId: event.id,
        generatedAt: new Date().toISOString(),
        summary: {
            totalDrinks: event.headcount * event.cocktailSelections.length,
            drinksPerCocktail: headcountRef
        },
        categories: categories
    };
};
