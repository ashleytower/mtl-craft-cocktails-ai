import React, { useState } from 'react';
import { CocktailRecipe, IngredientType, Ingredient } from '../types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecipes: CocktailRecipe[];
  selectedCocktails: string[];
  onToggleCocktail: (name: string) => void;
  onAddRecipe: (recipe: CocktailRecipe) => void;
}

// Translation dictionary for common bar ingredients
const INGREDIENT_TRANSLATIONS: Record<string, string> = {
  "Gin": "Gin",
  "Vodka": "Vodka",
  "Rum": "Rhum",
  "Tequila": "Tequila",
  "Whiskey": "Whisky",
  "Bourbon": "Bourbon",
  "Rye": "Rye",
  "Mezcal": "Mezcal",
  "Simple Syrup": "Sirop Simple",
  "Lemon Juice": "Jus de Citron",
  "Lime Juice": "Jus de Citron Vert",
  "Orange Juice": "Jus d'Orange",
  "Grapefruit Juice": "Jus de Pamplemousse",
  "Bitters": "Amers",
  "Egg White": "Blanc d'Œuf",
  "Eggwhite": "Blanc d'Œuf",
  "Cream": "Crème",
  "Milk": "Lait",
  "Soda Water": "Eau Gazeuse",
  "Tonic Water": "Tonic",
  "Ginger Beer": "Bière de Gingembre",
  "Mint": "Menthe",
  "Basil": "Basilic",
  "Cucumber": "Concombre",
  "Jalapeno": "Jalapeño",
  "Butterfly Pea Syrup": "Sirop de Pois Papillon",
  "Jalapeno Syrup": "Sirop de Jalapeño",
  "Cucumber Syrup": "Sirop de Concombre",
  "Triple Sec": "Triple Sec",
  "Kahlua": "Kahlua",
  "Espresso": "Espresso",
  "Aperol": "Aperol",
  "Amaro Nonino": "Amaro Nonino",
  "Angostura Bitters": "Amers Angostura",
  "Sweet Vermouth": "Vermouth Rouge",
  "Dry Vermouth": "Vermouth Sec",
  "Campari": "Campari",
  "Water": "Eau",
  "Sugar": "Sucre",
  "Honey": "Miel",
  "Agave Syrup": "Sirop d'Agave",
  "Cognac": "Cognac",
  "Absinthe": "Absinthe",
  "Cointreau": "Cointreau",
  "St-Germain": "St-Germain",
  "Lillet Blanc": "Lillet Blanc",
  "Prosecco": "Prosecco",
  "Champagne": "Champagne",
  "Wine": "Vin",
  "Beer": "Bière"
};

// Helper to find translation
const getFrenchIngredient = (name: string): string => {
    if (INGREDIENT_TRANSLATIONS[name]) return INGREDIENT_TRANSLATIONS[name];
    // Partial match check
    for (const key in INGREDIENT_TRANSLATIONS) {
        if (name.includes(key)) return name.replace(key, INGREDIENT_TRANSLATIONS[key]);
    }
    return name;
};

const MenuModal: React.FC<MenuModalProps> = ({ 
  isOpen, 
  onClose, 
  allRecipes, 
  selectedCocktails, 
  onToggleCocktail, 
  onAddRecipe 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'list' | 'add'>('list');

  // New Recipe State
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeDesc, setNewRecipeDesc] = useState("");
  const [newRecipeMethod, setNewRecipeMethod] = useState("");
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([]);
  
  // Temp Ingredient State
  const [ingName, setIngName] = useState("");
  const [ingType, setIngType] = useState<IngredientType>(IngredientType.ALCOHOL);
  const [ingQty, setIngQty] = useState(1);
  const [ingUnit, setIngUnit] = useState("oz");

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleAddIngredient = () => {
    if (!ingName) return;
    const newIng: Ingredient = {
      name: ingName,
      type: ingType,
      quantityPerDrink: ingQty,
      unit: ingUnit,
      containerSize: ingType === IngredientType.ALCOHOL ? 26 : undefined
    };
    setNewIngredients([...newIngredients, newIng]);
    setIngName("");
    setIngQty(1);
  };

  const handleSaveRecipe = () => {
    if (!newRecipeName || newIngredients.length === 0) return;
    const recipe: CocktailRecipe = {
      id: newRecipeName.toLowerCase().replace(/\s+/g, '-'),
      name: newRecipeName,
      englishDescription: newRecipeDesc,
      method: newRecipeMethod,
      ingredients: newIngredients
    };
    onAddRecipe(recipe);
    setView('list');
    setNewRecipeName("");
    setNewIngredients([]);
  };

  const filteredRecipes = allRecipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fade-in text-stone-900 print:bg-white print:p-0 print:static print:block">
      <style>
        {`
          @media print {
            @page { margin: 0; size: auto; }
            body { background: white; }
            #root, #root > div { height: auto !important; overflow: visible !important; display: block !important; }
            #root > div > header, #root > div > main { display: none !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
          }
        `}
      </style>

      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none print:overflow-visible">
        
        {/* --- SIDEBAR: SELECTION (Hidden on Print) --- */}
        <div className="w-full md:w-96 bg-dark-900 border-r border-white/10 flex flex-col no-print">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-800">
                <h2 className="text-xl font-serif text-white">Menu Builder</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            {view === 'list' && (
              <div className="p-4 bg-dark-800/50 border-b border-white/10 flex gap-2">
                 <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-dark-900 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-gold-400 outline-none"
                 />
                 <button onClick={() => setView('add')} className="bg-gold-500 hover:bg-gold-400 text-dark-900 px-3 py-1.5 rounded text-xs font-bold uppercase whitespace-nowrap">
                    + Custom
                 </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {view === 'list' ? (
                   <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Available Cocktails</h3>
                      {filteredRecipes.map(recipe => {
                        const isSelected = selectedCocktails.some(s => s.toLowerCase() === recipe.name.toLowerCase());
                        return (
                          <div 
                            key={recipe.id} 
                            onClick={() => onToggleCocktail(recipe.name)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                              ${isSelected 
                                ? 'bg-burgundy-900/40 border-gold-500' 
                                : 'bg-white/5 border-white/10 hover:border-white/30'
                              }`}
                          >
                            <span className={`font-medium text-sm ${isSelected ? 'text-gold-400' : 'text-gray-300'}`}>
                              {recipe.name}
                            </span>
                            {isSelected && <span className="text-gold-400 text-xs">✓</span>}
                          </div>
                        );
                      })}
                   </div>
                ) : (
                    /* ADD CUSTOM FORM */
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-bold text-sm">Create New</h3>
                            <button onClick={() => setView('list')} className="text-gold-400 text-xs hover:underline">Cancel</button>
                        </div>
                        <input type="text" placeholder="Name" value={newRecipeName} onChange={e => setNewRecipeName(e.target.value)} className="w-full bg-dark-800 border border-white/10 rounded p-2 text-white text-sm" />
                        
                        <div className="bg-white/5 rounded p-3 border border-white/10">
                             <div className="flex gap-2 mb-2">
                                <input type="text" placeholder="Ing Name" value={ingName} onChange={e => setIngName(e.target.value)} className="flex-1 bg-dark-800 border border-white/10 rounded p-1 text-xs text-white" />
                                <button onClick={handleAddIngredient} className="bg-gray-700 text-white px-2 rounded text-xs">Add</button>
                             </div>
                             <ul className="text-xs text-gray-400 space-y-1">
                                {newIngredients.map((i,idx) => <li key={idx}>• {i.name}</li>)}
                             </ul>
                        </div>
                        
                        <button onClick={handleSaveRecipe} disabled={!newRecipeName} className="w-full bg-gold-500 text-dark-900 py-2 rounded font-bold text-sm disabled:opacity-50">Save</button>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/10 bg-dark-800">
                <button 
                  onClick={handlePrint}
                  className="w-full py-3 bg-white text-black font-bold uppercase tracking-wider rounded shadow hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.875 1.5a.75.75 0 01.75.75v3h6.75v-3a.75.75 0 011.5 0v3h1.875A2.25 2.25 0 0121 7.5v8.25a2.25 2.25 0 01-2.25 2.25h-1.313a2.25 2.25 0 01-2.25-2.25v-2.25h-6.374v2.25a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 15.75V7.5a2.25 2.25 0 012.25-2.25h1.875v-3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                  </svg>
                  Print Menu
                </button>
            </div>
        </div>

        {/* --- PREVIEW / PRINT CANVAS --- */}
        <div className="flex-1 bg-stone-200/50 p-8 pt-24 flex justify-center overflow-y-auto print:p-0 print:bg-white print:overflow-visible scrollbar-thin print:block">
             {/* Paper Container */}
             <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-2xl relative flex flex-col py-16 px-12 print:shadow-none print:w-full print:h-full print:max-w-none print:py-12 print:px-10">
                
                {/* MENU HEADER */}
                <div className="text-center mb-12 w-full relative z-10">
                    <div className="border-b-2 border-[#7a1f2f] pb-4 px-8 inline-block">
                        <h1 className="font-sans text-xl md:text-2xl font-bold text-stone-900 tracking-[0.3em] uppercase leading-relaxed whitespace-nowrap">
                            MTL Craft Cocktails
                        </h1>
                    </div>
                    <p className="font-sans text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-3">Signatures & Classics</p>
                </div>

                {/* MENU ITEMS LIST */}
                <div className="flex-1 w-full flex flex-col items-center justify-start gap-8 relative z-10">
                    {selectedCocktails.length > 0 ? (
                        allRecipes
                            .filter(r => selectedCocktails.some(s => s.toLowerCase() === r.name.toLowerCase()))
                            .map((recipe, index) => {
                                // Row 1: English
                                const enIngredients = recipe.ingredients.map(i => i.name).join('  •  ');
                                // Row 2: French
                                const frIngredients = recipe.ingredients.map(i => getFrenchIngredient(i.name)).join('  •  ');

                                return (
                                    <div key={recipe.id} className="w-full text-center max-w-lg flex flex-col items-center">
                                        
                                        {/* Separator Star */}
                                        {index > 0 && (
                                            <div className="text-[#7a1f2f] text-lg opacity-90 py-3 pb-6">
                                                ✦
                                            </div>
                                        )}

                                        {/* Name - Modern Sans */}
                                        <h3 className="font-sans text-2xl font-bold text-stone-900 uppercase tracking-widest px-4 mb-2">
                                            {recipe.name}
                                        </h3>
                                        
                                        {/* Ingredients English */}
                                        <p className="font-sans text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-wider leading-snug mb-1">
                                            {enIngredients}
                                        </p>
                                        
                                        {/* Ingredients French - BLACK as requested */}
                                        <p className="font-sans text-[10px] md:text-xs font-bold text-stone-900 uppercase tracking-widest leading-snug">
                                            {frIngredients}
                                        </p>
                                    </div>
                                );
                            })
                    ) : (
                       <div className="text-center py-20 opacity-20">
                           <p className="font-serif italic">Select cocktails to preview menu</p>
                       </div>
                    )}
                </div>

                {/* FOOTER REMOVED AS REQUESTED */}
            </div>
        </div>

      </div>
    </div>
  );
};

export default MenuModal;