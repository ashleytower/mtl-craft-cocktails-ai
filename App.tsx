
import React, { useState, useEffect } from 'react';
import EventPanel from './components/EventPanel';
import VoiceAssistant from './components/VoiceAssistant';
import PackingListDisplay from './components/PackingListDisplay';
import MenuModal from './components/MenuModal';
import Dashboard from './components/Dashboard'; // New Component
import { EventData, PackingList, ChatMessage, CocktailRecipe } from './types';
import { INITIAL_EVENT, MOCK_RECIPES } from './constants';
import { calculatePackingList } from './services/calculationService';
import { sendChatMessage } from './services/geminiService';
import { fetchRecipesFromSheet } from './services/recipeService';
import { fetchEventsFromSheet } from './services/eventService'; // Updated Import
import { generateEventBriefText } from './services/formatService';

const App: React.FC = () => {
  // Navigation State
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);

  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [allRecipes, setAllRecipes] = useState<CocktailRecipe[]>(MOCK_RECIPES);

  // Initial Load
  useEffect(() => {
    const initData = async () => {
        // 1. Fetch Recipes
        const recipes = await fetchRecipesFromSheet();
        setAllRecipes(recipes);

        // 2. Fetch Events (All)
        const remoteEvents = await fetchEventsFromSheet();
        if (remoteEvents.length > 0) {
            setEvents(remoteEvents);
            console.log("Loaded events:", remoteEvents.length);
        } else {
            setEvents([INITIAL_EVENT]);
        }
    };
    initData();
  }, []);

  const handleRefreshEvents = async () => {
      const remoteEvents = await fetchEventsFromSheet();
      if (remoteEvents.length > 0) {
          setEvents(remoteEvents);
          // If current selected event exists, try to update it
          if (selectedEvent) {
              const updated = remoteEvents.find(e => e.id === selectedEvent.id);
              if (updated) {
                  setSelectedEvent(updated);
                  setPackingList(calculatePackingList(updated, allRecipes));
              }
          }
          alert(`Refreshed. Found ${remoteEvents.length} active events.`);
      } else {
          alert("No events found in sheet.");
      }
  };

  const handleSelectEvent = (event: EventData) => {
      setSelectedEvent(event);
      // Auto-generate packing list for the selected event
      if (event.status === 'Ready for Prep' || event.status === 'Booked') {
          setLoadingList(true);
          setTimeout(() => {
              setPackingList(calculatePackingList(event, allRecipes));
              setLoadingList(false);
          }, 500);
      }
  };

  const handleBackToDashboard = () => {
      setSelectedEvent(null);
      setPackingList(null);
  };

  // --- Handlers (Wrap generic handlers to apply to selectedEvent) ---

  const handleFullEventUpdate = (updatedEvent: EventData) => {
    setSelectedEvent(updatedEvent);
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setLoadingList(true);
    setTimeout(() => {
        setPackingList(calculatePackingList(updatedEvent, allRecipes));
        setLoadingList(false);
    }, 500);
  };

  const handleEventTypeChange = (type: 'Bar Service' | 'Workshop') => {
      if (!selectedEvent) return;
      const updated = { ...selectedEvent, eventType: type };
      handleFullEventUpdate(updated);
  };

  const handleUpdateHeadcount = (count: number) => {
      if (!selectedEvent) return;
      const updated = { ...selectedEvent, headcount: count };
      handleFullEventUpdate(updated);
  };

  const handleGenerateList = () => {
      if (!selectedEvent) return;
      setLoadingList(true);
      setTimeout(() => {
          setPackingList(calculatePackingList(selectedEvent, allRecipes));
          setLoadingList(false);
      }, 500);
  };

  const handleAddRecipe = (recipe: CocktailRecipe) => {
      setAllRecipes(prev => [...prev, recipe]);
  };

  const handleUpdateCocktails = (action: 'add' | 'remove', name: string) => {
      if (!selectedEvent) return;
      const prev = selectedEvent;
      const currentSelections = new Set(prev.cocktailSelections.map(s => s.toLowerCase()));
      let newSelections = [...prev.cocktailSelections];

      if (action === 'add') {
         if (!currentSelections.has(name.toLowerCase())) {
             const recipe = allRecipes.find(r => r.name.toLowerCase() === name.toLowerCase());
             newSelections.push(recipe ? recipe.name : name);
         }
      } else {
         newSelections = newSelections.filter(s => s.toLowerCase() !== name.toLowerCase());
      }
      
      const updated = { ...prev, cocktailSelections: newSelections };
      handleFullEventUpdate(updated);
  };

  const handleUpdateDetails = (field: string, value: string) => {
      if (!selectedEvent) return;
      const updated = { ...selectedEvent };
      switch (field) {
        case 'location': updated.location = value; break;
        case 'clientName': updated.clientName = value; break;
        case 'status': updated.status = value as any; break;
        case 'bartenderName': updated.bartender = { ...updated.bartender, name: value }; break;
        case 'bartenderEmail': updated.bartender = { ...updated.bartender, email: value }; break;
        case 'eventDate': updated.eventDate = value; break;
        case 'endTime': updated.endTime = value; break;
        case 'clientPhone': updated.clientPhone = value; break;
        case 'isPaid': updated.isPaid = (value === 'true' || value === 'yes'); break;
      }
      handleFullEventUpdate(updated);
  };

  const handleUpdateRental = (action: string, itemType: string, subtype?: string, quantity?: number) => {
      if (!selectedEvent) return;
      const updated = { ...selectedEvent };

      if (itemType === 'glass') {
         if (action === 'reset') {
             updated.glassRental = { required: false, items: [] };
         } else if (action === 'add' || action === 'update') {
             updated.glassRental.required = true;
             if (!updated.glassRental.items) updated.glassRental.items = [];
             if (subtype) {
                const existingIndex = updated.glassRental.items.findIndex(i => i.type.toLowerCase() === subtype.toLowerCase());
                if (existingIndex >= 0) {
                    if (quantity !== undefined) updated.glassRental.items[existingIndex].quantity = quantity;
                } else if (quantity !== undefined) {
                    updated.glassRental.items.push({ type: subtype, quantity });
                }
             }
         } else if (action === 'remove') {
             updated.glassRental.required = false; 
         }
      } 
      else if (itemType === 'bar') {
          if (action === 'remove') {
              updated.barRental.required = false;
          } else {
              updated.barRental.required = true;
              if (subtype) {
                  if (subtype.toLowerCase().includes('ft') || subtype.toLowerCase().includes('mobile')) {
                      updated.barRental.size = subtype;
                  } else {
                      updated.barRental.color = subtype;
                  }
              }
          }
      }
      handleFullEventUpdate(updated);
  };

  const handleSendEmail = (recipientName?: string) => {
      if (!selectedEvent) return;
      const subject = `Packing List - ${selectedEvent.clientName} - ${new Date().toLocaleDateString()}`;
      const body = generateEventBriefText(selectedEvent, packingList);
      let recipientEmail = "";
      if (recipientName && recipientName.toLowerCase().includes(selectedEvent.bartender.name.split(' ')[0].toLowerCase())) {
          recipientEmail = selectedEvent.bartender.email;
      }
      window.open(`mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // --- Chat Transcription ---
  const handleTranscription = async (text: string, isUser: boolean, source?: 'voice' | 'text') => {
     setChatHistory(prev => [...prev, {
        role: isUser ? 'user' : 'assistant',
        content: text,
        timestamp: new Date().toISOString()
     }]);

     if (isUser && source === 'text') {
         // Context: Pass Selected Event OR All Events
         const context = selectedEvent || events;
         
         const response = await sendChatMessage(text, context, {
             onUpdateHeadcount: handleUpdateHeadcount,
             onGenerateList: handleGenerateList,
             onAddRecipe: handleAddRecipe,
             onUpdateCocktails: handleUpdateCocktails,
             onUpdateDetails: handleUpdateDetails,
             onUpdateRental: handleUpdateRental,
             onSendEmail: handleSendEmail
         });
         
         setChatHistory(prev => [...prev, {
             role: 'assistant',
             content: response,
             timestamp: new Date().toISOString()
         }]);
     }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 border-b border-white/10 bg-dark-900 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToDashboard}>
            <div className="w-8 h-8 rounded-full bg-gold-400 flex items-center justify-center text-dark-900 font-bold font-serif">M</div>
            <span className="font-serif text-xl tracking-wide">MTL CRAFT COCKTAILS</span>
        </div>
        <div className="flex items-center gap-4">
             {selectedEvent && (
                 <button onClick={handleBackToDashboard} className="text-sm text-gray-400 hover:text-white mr-4">
                     ← Back to Dashboard
                 </button>
             )}
             <button 
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-dark-900 text-xs font-bold uppercase tracking-widest rounded transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.379a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H4.5a3 3 0 00-3 3v12a3 3 0 003 3h15zm-6.858-10.814a.75.75 0 10-1.284.828l3.5 5.425a.75.75 0 001.284 0l3.5-5.425a.75.75 0 10-1.284-.828L15.5 14.202l-2.858-4.016z" clipRule="evenodd" />
                </svg>
                Menu Builder
             </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 grid grid-cols-12 h-[calc(100vh-64px)] overflow-hidden">
        
        {!selectedEvent ? (
            /* --- DASHBOARD VIEW --- */
            <>
                {/* Voice/Chat (Global Context) */}
                <div className="col-span-12 md:col-span-4 h-full border-r border-white/10 bg-dark-900">
                    <VoiceAssistant 
                        eventContext={events} // PASSING FULL EVENTS ARRAY FOR DASHBOARD CONTEXT
                        onTranscription={handleTranscription}
                        history={chatHistory}
                        // Dummy handlers for dashboard mode
                        onUpdateHeadcount={() => {}}
                        onGenerateList={() => {}}
                        onAddRecipe={handleAddRecipe}
                        onUpdateCocktails={() => {}}
                        onUpdateDetails={() => {}}
                        onUpdateRental={() => {}}
                        onSendEmail={() => {}}
                    />
                </div>
                {/* Event Grid */}
                <div className="col-span-12 md:col-span-8 h-full bg-dark-800">
                    <Dashboard 
                        events={events} 
                        onSelectEvent={handleSelectEvent}
                        onRefresh={handleRefreshEvents}
                    />
                </div>
            </>
        ) : (
            /* --- WORKSPACE VIEW (Specific Event) --- */
            <>
                <div className="col-span-12 md:col-span-3 h-full overflow-hidden border-r border-white/10">
                    <EventPanel 
                        event={selectedEvent} 
                        onEdit={handleFullEventUpdate} 
                        onSimulateWebhook={() => {}}
                        onOpenMenu={() => setIsMenuOpen(true)}
                        onEventTypeChange={handleEventTypeChange}
                    />
                </div>

                <div className="col-span-12 md:col-span-6 h-full relative border-r border-white/10">
                    <VoiceAssistant 
                        eventContext={selectedEvent}
                        onTranscription={handleTranscription}
                        history={chatHistory}
                        onUpdateHeadcount={handleUpdateHeadcount}
                        onGenerateList={handleGenerateList}
                        onAddRecipe={handleAddRecipe}
                        onUpdateCocktails={handleUpdateCocktails}
                        onUpdateDetails={handleUpdateDetails}
                        onUpdateRental={handleUpdateRental}
                        onSendEmail={handleSendEmail}
                    />
                </div>

                <div className="col-span-3 hidden md:block h-full overflow-hidden">
                    <PackingListDisplay 
                        list={packingList} 
                        loading={loadingList} 
                        event={selectedEvent}
                    />
                </div>
            </>
        )}

      </main>

      <MenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        allRecipes={allRecipes}
        selectedCocktails={selectedEvent ? selectedEvent.cocktailSelections : []}
        onToggleCocktail={(name) => {
             if (selectedEvent) {
                 const exists = selectedEvent.cocktailSelections.some(s => s.toLowerCase() === name.toLowerCase());
                 handleUpdateCocktails(exists ? 'remove' : 'add', name);
             }
        }}
        onAddRecipe={handleAddRecipe}
      />
    </div>
  );
};

export default App;
