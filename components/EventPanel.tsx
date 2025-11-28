
import React, { useState, useEffect } from 'react';
import { EventData } from '../types';

interface EventPanelProps {
  event: EventData;
  onEdit: (updatedEvent: EventData) => void;
  onSimulateWebhook: () => void;
  onOpenMenu: () => void;
  onEventTypeChange: (type: 'Bar Service' | 'Workshop') => void;
  onRefreshFromSheet?: () => void; // New Prop
}

const EventPanel: React.FC<EventPanelProps> = ({ event, onEdit, onSimulateWebhook, onOpenMenu, onEventTypeChange, onRefreshFromSheet }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<EventData>(event);

  // Sync form data if event changes externally (e.g. voice update)
  useEffect(() => {
    setFormData(event);
  }, [event]);

  // ... (Keep existing handlers handleSave, handleCancel, handleChange, etc.)
  const handleSave = () => {
    onEdit(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(event);
    setIsEditing(false);
  };

  const handleChange = (field: keyof EventData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBartenderChange = (field: 'name' | 'email', value: string) => {
    setFormData(prev => ({
      ...prev,
      bartender: { ...prev.bartender, [field]: value }
    }));
  };

  const handleBarRentalChange = (field: string, value: any) => {
      setFormData(prev => ({
          ...prev,
          barRental: { ...prev.barRental, [field]: value }
      }));
  };

  return (
    <div className="h-full bg-dark-800 p-6 flex flex-col gap-6 overflow-hidden border-r border-white/10">
      
      {/* --- VIEW MODE --- */}
      {!isEditing && (
        <>
            <div className="shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gold-400 text-xs font-bold tracking-widest uppercase">Current Event</h2>
                    
                    <div className="relative group">
                        <select
                            value={event.eventType}
                            onChange={(e) => onEventTypeChange(e.target.value as 'Bar Service' | 'Workshop')}
                            className={`appearance-none pl-3 pr-7 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors
                            ${event.eventType === 'Workshop' 
                                ? 'bg-purple-900/40 border-purple-500 text-purple-200 hover:bg-purple-900/60' 
                                : 'bg-blue-900/40 border-blue-500 text-blue-200 hover:bg-blue-900/60'}`}
                        >
                            <option value="Bar Service" className="bg-dark-900 text-gray-300">Bar Service</option>
                            <option value="Workshop" className="bg-dark-900 text-gray-300">Workshop</option>
                        </select>
                        {/* Chevron Icon */}
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${event.eventType === 'Workshop' ? 'text-purple-200' : 'text-blue-200'}`}>
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                
                <h1 className="text-4xl font-serif text-white mb-2 leading-tight">{event.clientName}</h1>
                <div className="flex flex-col gap-2 mt-1">
                    {/* ... (Existing Phone/Status badges) ... */}
                    <div className="text-gray-400 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                        </svg>
                        {event.clientPhone || "No phone provided"}
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-xs font-medium 
                            ${event.status === 'Ready for Prep' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
                            {event.status}
                         </span>
                         <span className={`px-2 py-0.5 rounded text-xs font-medium border
                            ${event.isPaid 
                                ? 'bg-green-900/30 text-green-300 border-green-800' 
                                : 'bg-red-900/30 text-red-300 border-red-800'}`}>
                            {event.isPaid ? 'PAID' : 'UNPAID'}
                         </span>
                    </div>
                </div>
            </div>

            {/* ... (Existing Details List - Date, Location, Guest Count, etc.) ... */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin min-h-0">
                <div className="space-y-4 font-sans text-sm text-gray-300">
                    {/* ... (Client Contact, Invoice Status, Date, Location, Headcount) ... */}
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase">Client Contact</span>
                        <span className="text-white text-lg">{event.clientPhone || 'N/A'}</span>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase">Invoice Status</span>
                        <span className={`font-bold ${event.isPaid ? 'text-green-400' : 'text-red-400'}`}>
                            {event.isPaid ? 'PAID' : 'UNPAID'}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase">Date & Time</span>
                        <span className="text-white text-lg">{new Date(event.eventDate).toLocaleDateString()}</span>
                        <span className="text-gold-400">
                            {new Date(event.eventDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            {' - '}
                            {new Date(event.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase">Location</span>
                        <span>{event.location}</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase">Guest Count</span>
                        <span className="text-3xl font-serif text-gold-400">{event.headcount}</span>
                    </div>
                </div>

                {/* ... (Bartender, Rentals, Cocktails sections - No changes needed) ... */}
                <div className="pt-4 border-t border-white/10">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase mb-1">Lead Bartender</span>
                        <span className="text-white font-medium text-lg">{event.bartender.name}</span>
                        <span className="text-gray-400 text-xs">{event.bartender.email}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                    <div>
                        <span className="text-gray-500 text-xs uppercase block mb-2">Mobile Bar Rental</span>
                        {event.barRental.required ? (
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                <span className="text-green-400 text-xs">●</span> 
                                <span className="text-white font-medium text-sm">Required</span>
                                </div>
                                <div className="flex flex-col gap-1 text-sm text-gray-400 pl-4 border-l border-white/10 ml-1">
                                <span>Size: {event.barRental.size}</span>
                                <span>Color: {event.barRental.color}</span>
                                </div>
                            </div>
                        ) : <span className="text-gray-500 text-sm">Not required</span>}
                    </div>
                    
                    <div>
                        <span className="text-gray-500 text-xs uppercase block mb-2">Glassware Rental</span>
                        {event.glassRental.required ? (
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-400 text-xs">●</span>
                                <span className="text-white font-medium text-sm">Required</span>
                                </div>
                                {event.glassRental.items?.map((g, i) => (
                                    <div key={i} className="flex justify-between text-sm text-gray-400 pl-4 border-l border-white/10 ml-1 mb-1">
                                        <span>{g.type}</span>
                                        <span className="text-gold-400">{g.quantity} units</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 p-3 rounded border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-500 text-xs">●</span>
                                <span className="text-white font-medium text-sm">Plastic Cups</span>
                                </div>
                                <div className="text-sm text-gray-400 pl-4 border-l border-white/10 ml-1">
                                    <span>Total: {event.headcount * event.cocktailSelections.length} units</span>
                                    <span className="text-[10px] text-gray-500 block">(Includes 20% buffer)</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {event.clientSuppliesAlcohol && (
                        <div className="bg-blue-900/20 p-2 rounded border border-blue-500/30 text-center">
                            <span className="text-blue-300 text-xs font-medium">Client Supplies Alcohol</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-white/10">
                    <h3 className="text-gray-500 text-xs uppercase mb-3">Selected Cocktails</h3>
                    <div className="flex flex-wrap gap-2">
                        {event.cocktailSelections.map(c => (
                        <span key={c} className="px-3 py-1 bg-burgundy-900/50 border border-burgundy-900 rounded-full text-sm text-white">
                            {c}
                        </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- FOOTER BUTTONS --- */}
            <div className="shrink-0 flex flex-col gap-3 pt-4 border-t border-white/10">
                <button onClick={onOpenMenu} className="w-full py-2 px-4 bg-gold-500 text-dark-900 font-bold uppercase tracking-wider hover:bg-gold-400 rounded transition-colors text-sm shadow-lg">
                Print Menu
                </button>
                <button onClick={() => setIsEditing(true)} className="w-full py-2 px-4 border border-white/20 rounded hover:bg-white/5 transition-colors text-sm">
                Edit Details
                </button>
                
                {/* NEW: Load from Sheet Button (replaces simulate) */}
                {onRefreshFromSheet && (
                    <button 
                        onClick={onRefreshFromSheet} 
                        className="w-full py-2 px-4 bg-green-900/20 border border-green-800 text-green-400 rounded hover:bg-green-900/40 transition-colors text-xs flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                        </svg>
                        Check for New Booking
                    </button>
                )}
            </div>
        </>
      )}

      {/* --- EDIT MODE (Keeping existing form structure) --- */}
      {isEditing && (
        <div className="flex flex-col h-full">
            {/* ... (Existing Edit Form logic) ... */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">Edit Event Details</h2>
                <button onClick={handleCancel} className="text-gray-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {/* Client & Logistics */}
                <div className="space-y-3">
                    <div>
                        <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Client Name</label>
                        <input type="text" value={formData.clientName} onChange={e => handleChange('clientName', e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" />
                    </div>
                    <div>
                         <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Phone Number</label>
                         <input type="tel" value={formData.clientPhone || ''} onChange={e => handleChange('clientPhone', e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" placeholder="555-555-5555" />
                    </div>
                    <div className="flex items-center gap-3 py-1">
                        <label className="text-gray-500 text-xs uppercase font-bold">Invoice Paid?</label>
                        <input 
                            type="checkbox" 
                            checked={formData.isPaid} 
                            onChange={e => handleChange('isPaid', e.target.checked)}
                            className="w-5 h-5 accent-green-500 cursor-pointer" 
                        />
                        <span className={`text-xs font-bold ${formData.isPaid ? 'text-green-400' : 'text-red-400'}`}>{formData.isPaid ? 'YES' : 'NO'}</span>
                    </div>

                    <div>
                        <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Location</label>
                        <input type="text" value={formData.location} onChange={e => handleChange('location', e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" />
                    </div>
                    <div>
                        <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Headcount</label>
                        <input type="number" value={formData.headcount} onChange={e => handleChange('headcount', parseInt(e.target.value))} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" />
                    </div>
                    <div>
                         <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Date</label>
                         <input type="datetime-local" value={formData.eventDate.slice(0, 16)} onChange={e => handleChange('eventDate', new Date(e.target.value).toISOString())} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" />
                    </div>
                </div>

                {/* Bartender */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                     <h3 className="text-gold-400 text-xs font-bold uppercase">Staffing</h3>
                     <div>
                        <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Lead Bartender</label>
                        <input type="text" value={formData.bartender.name} onChange={e => handleBartenderChange('name', e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" />
                    </div>
                    <div>
                        <label className="text-gray-500 text-xs uppercase font-bold block mb-1">Email</label>
                        <input type="text" value={formData.bartender.email} onChange={e => handleBartenderChange('email', e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none" />
                    </div>
                </div>

                {/* Rentals */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                     <h3 className="text-gold-400 text-xs font-bold uppercase">Rentals</h3>
                     
                     <div className="bg-white/5 p-3 rounded border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                             <label className="text-white text-sm font-medium">Client Supplies Alcohol?</label>
                             <input 
                                 type="checkbox" 
                                 checked={formData.clientSuppliesAlcohol} 
                                 onChange={e => handleChange('clientSuppliesAlcohol', e.target.checked)}
                                 className="w-4 h-4 accent-blue-500"
                             />
                        </div>
                        <p className="text-[10px] text-gray-500">If checked, Alcohol will be excluded from the packing list.</p>
                     </div>

                     {/* Bar Rental */}
                     <div className="bg-white/5 p-3 rounded border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-white text-sm font-medium">Mobile Bar</label>
                            <input 
                                type="checkbox" 
                                checked={formData.barRental.required} 
                                onChange={e => handleBarRentalChange('required', e.target.checked)}
                                className="w-4 h-4 accent-gold-400"
                            />
                        </div>
                        {formData.barRental.required && (
                            <>
                                <div>
                                    <label className="text-gray-500 text-xs uppercase block mb-1">Size</label>
                                    <select 
                                        value={formData.barRental.size} 
                                        onChange={e => handleBarRentalChange('size', e.target.value)}
                                        className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none"
                                    >
                                        <option value="4ft Mobile">4ft Mobile</option>
                                        <option value="6ft Mobile">6ft Mobile</option>
                                        <option value="8ft Mobile">8ft Mobile</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-xs uppercase block mb-1">Color/Finish</label>
                                    <input 
                                        type="text" 
                                        value={formData.barRental.color} 
                                        onChange={e => handleBarRentalChange('color', e.target.value)}
                                        className="w-full bg-dark-900 border border-white/10 rounded p-2 text-sm text-white focus:border-gold-400 outline-none"
                                    />
                                </div>
                            </>
                        )}
                     </div>

                     {/* Glassware Rental */}
                     <div className="bg-white/5 p-3 rounded border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-white text-sm font-medium">Glassware Rental</label>
                            <input 
                                type="checkbox" 
                                checked={formData.glassRental.required} 
                                onChange={e => setFormData(prev => ({ ...prev, glassRental: { ...prev.glassRental, required: e.target.checked } }))}
                                className="w-4 h-4 accent-gold-400"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            {formData.glassRental.required 
                             ? "Using real glassware. (Manage specific counts in packing list)" 
                             : "Using plastic cups (Auto-calculated)."}
                        </p>
                     </div>
                </div>
            </div>

            <div className="pt-4 mt-2 border-t border-white/10">
                <button onClick={handleSave} className="w-full py-3 bg-gold-500 text-dark-900 font-bold uppercase tracking-widest rounded shadow hover:bg-gold-400 transition-colors">
                    Save Changes
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default EventPanel;
