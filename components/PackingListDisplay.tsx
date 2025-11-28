
import React from 'react';
import { createPortal } from 'react-dom';
import { PackingList, IngredientType, EventData } from '../types';
import { generateEventBriefText } from '../services/formatService';

interface PackingListDisplayProps {
  list: PackingList | null;
  loading: boolean;
  event: EventData;
}

const PackingListDisplay: React.FC<PackingListDisplayProps> = ({ list, loading, event }) => {
  const handleExportPDF = () => {
    window.print();
  };

  const handleEmailTeam = async () => {
      if (!list) return;

      const subject = `Packing List - ${event.clientName} - ${new Date(list.generatedAt).toLocaleDateString()}`;
      
      // Hex Colors for Email
      const colors: Record<string, string> = {
          alcohol: '#991B1B', // Red
          syrup: '#C2410C',   // Orange
          juice: '#CA8A04',   // Yellow
          garnish: '#166534', // Green
          glass: '#0E7490',   // Cyan
          soda: '#1E40AF',    // Blue
          others: '#6B21A8'   // Purple
      };

      // Construct Rich HTML String (Notion-style)
      let html = `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px;">
          <h1 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px; font-family: 'Times New Roman', serif;">EVENT BRIEF & PACKING LIST</h1>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4b5563; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Event Dashboard</h3>
            <p><strong>Client:</strong> ${event.clientName} (${event.clientPhone || 'No Phone'})</p>
            <p><strong>Status:</strong> ${event.status} | <strong>Invoice:</strong> ${event.isPaid ? '<span style="color:green; font-weight:bold;">PAID</span>' : '<span style="color:red; font-weight:bold;">UNPAID</span>'}</p>
            <p><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString()} | <strong>Time:</strong> ${new Date(event.eventDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(event.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Headcount:</strong> ${event.headcount} Guests</p>
            <p><strong>Bartender:</strong> ${event.bartender.name} (<a href="mailto:${event.bartender.email}">${event.bartender.email}</a>)</p>
          </div>

          <div style="margin-bottom: 20px;">
             <h3 style="color: #4b5563; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Logistics</h3>
             <ul style="list-style-type: none; padding-left: 0;">
                <li><strong>Mobile Bar:</strong> ${event.barRental.required ? `✅ Yes (${event.barRental.size}, ${event.barRental.color})` : '❌ Not Required'}</li>
                <li><strong>Glassware:</strong> ${event.glassRental.required ? `✅ Rental (See List)` : '🥤 Plastic Cups'}</li>
                <li><strong>Alcohol Supply:</strong> ${event.clientSuppliesAlcohol ? '👤 Client Supplied' : '🍸 MTL Craft Supplied'}</li>
             </ul>
             <p><strong>Selected Cocktails:</strong> ${event.cocktailSelections.join(", ")}</p>
          </div>

          <h2 style="font-family: 'Times New Roman', serif; margin-top: 30px;">MASTER PACKING LIST</h2>
          <p style="color: #6b7280; font-size: 14px;">Total Drinks: ${list.summary.totalDrinks}</p>
      `;

      Object.keys(list.categories).forEach(key => {
          const type = key as IngredientType;
          const items = list.categories[type];
          if (items && items.length > 0) {
              const color = colors[type] || '#374151';
              html += `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: ${color}; border-bottom: 1px solid ${color}; padding-bottom: 4px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${type}</h3>
                  <table style="width: 100%; border-collapse: collapse;">
              `;
              
              items.forEach(item => {
                  const vol = item.quantityNeededOz > 0 ? `(${Math.round(item.quantityNeededOz * 10) / 10} ${item.unit})` : '';
                  html += `
                    <tr>
                      <td style="padding: 4px 0; font-weight: bold;">${item.name}</td>
                      <td style="padding: 4px 0; text-align: right;">${item.containersNeeded} ${item.containersNeeded > 1 ? 'units' : 'unit'}</td>
                      <td style="padding: 4px 0; text-align: right; color: #6b7280; font-size: 12px; width: 80px;">${vol}</td>
                    </tr>
                  `;
              });

              html += `</table></div>`;
          }
      });

      html += `
        <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center; color: #9ca3af; font-size: 12px;">
           Generated by MTL Craft Cocktails AI
        </div>
        </div>
      `;

      // Generate Plain Text Fallback
      const textBody = generateEventBriefText(event, list);

      try {
          // Create the HTML blob
          const blob = new Blob([html], { type: 'text/html' });
          const textBlob = new Blob([textBody], { type: 'text/plain' }); 
          
          await navigator.clipboard.write([
              new ClipboardItem({
                  'text/html': blob,
                  'text/plain': textBlob
              })
          ]);
          
          // Open Mail Client with PLAIN TEXT fallback in body 
          // (This ensures email isn't blank if user forgets to paste, but allows pasting for rich format)
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
          
          // Notify User
          alert("✓ Formatted Report Copied! \n\n1. Email app opening...\n2. Press PASTE (Ctrl+V) to replace the text with the Colored Version.");
          
      } catch (err) {
          console.error('Failed to copy html: ', err);
          alert("Could not access clipboard. Please ensure you allow clipboard permissions.");
      }
  };

  const handleCopyForSheets = () => {
    if (!list) return;
    
    // Header Row with Event Meta Data
    let text = `EVENT: ${event.clientName}\tPHONE: ${event.clientPhone || 'N/A'}\tPAID: ${event.isPaid ? 'YES' : 'NO'}\tDATE: ${new Date(event.eventDate).toLocaleDateString()}\n\n`;
    
    text += "Category\tItem Name\tUnits Needed\tUnit Type\tTotal Quantity\tMeasure\n";
    Object.keys(list.categories).forEach(key => {
        const type = key as IngredientType;
        const items = list.categories[type];
        if (items && items.length > 0) {
            items.forEach(item => {
                text += `${type.toUpperCase()}\t${item.name}\t${item.containersNeeded}\t${item.containersNeeded > 1 ? 'units' : 'unit'}\t${Math.round(item.quantityNeededOz * 10) / 10}\t${item.unit}\n`;
            });
        }
    });
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard! Ready to paste into Excel/Sheets.");
  };

  // Helper to get color classes for headers
  const getCategoryColor = (type: IngredientType, isPrint: boolean) => {
      switch (type) {
          case IngredientType.ALCOHOL:
              return isPrint ? 'text-red-800 border-red-800' : 'text-red-400';
          case IngredientType.SYRUP:
              return isPrint ? 'text-orange-700 border-orange-700' : 'text-orange-400';
          case IngredientType.JUICE:
              return isPrint ? 'text-yellow-600 border-yellow-600' : 'text-yellow-400';
          case IngredientType.GARNISH:
              return isPrint ? 'text-green-800 border-green-800' : 'text-green-400';
          case IngredientType.GLASS:
              return isPrint ? 'text-cyan-700 border-cyan-700' : 'text-cyan-400';
          case IngredientType.SODA:
              return isPrint ? 'text-blue-800 border-blue-800' : 'text-blue-400';
          case IngredientType.OTHERS:
              return isPrint ? 'text-purple-800 border-purple-800' : 'text-purple-400';
          default:
              return isPrint ? 'text-gray-800 border-gray-800' : 'text-gray-400';
      }
  };

  const renderPrintContent = () => {
      if (!list) return null;
      
      const renderPrintCategory = (title: string, type: IngredientType) => {
        const items = list.categories[type];
        if (!items || items.length === 0) return null;
    
        const colorClass = getCategoryColor(type, true);

        return (
          <div className="mb-6 break-inside-avoid">
            <h3 className={`${colorClass} text-xs font-bold tracking-widest uppercase mb-2 border-b-2 pb-1`}>{title}</h3>
            <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-500 uppercase bg-gray-50">
                    <tr>
                        <th className="px-2 py-1">Item</th>
                        <th className="px-2 py-1 text-right">Pack Qty</th>
                        <th className="px-2 py-1 text-right">Total Vol</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                        <td className="px-2 py-1.5 font-medium text-black">
                            {item.name}
                            {item.breakdown && <div className="text-[9px] text-gray-500 font-normal italic leading-tight">{item.breakdown}</div>}
                        </td>
                        <td className="px-2 py-1.5 text-right font-bold text-black align-top">
                            {item.containersNeeded} {item.containersNeeded > 1 ? 'units' : 'unit'}
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-600 align-top text-xs">
                             {item.quantityNeededOz > 0 ? `${Math.round(item.quantityNeededOz * 10) / 10} ${item.unit}` : ''}
                        </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        );
      };

      return (
        <div id="print-section" className="bg-white text-black p-10 max-w-[21cm] mx-auto min-h-screen">
          {/* --- HEADER --- */}
          <div className="mb-8 border-b-4 border-double border-black pb-6">
              <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-black mb-1">MTL Craft Cocktails</h1>
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">Logistics & Packing Manifest</div>
                  </div>
                  <div className="text-right">
                      <div className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider inline-block mb-1">
                          {event.eventType}
                      </div>
                      <div className="text-xs text-gray-500">ID: {list.eventId}</div>
                  </div>
              </div>

              {/* --- DASHBOARD GRID (Notion Style) --- */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-t border-gray-200 pt-4">
                  <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Client & Location</span>
                      <div className="font-bold text-black text-lg leading-tight">{event.clientName}</div>
                      <div className="text-gray-800 text-xs mb-1">📞 {event.clientPhone || 'N/A'}</div>
                      <div className="text-gray-700">{event.location}</div>
                  </div>
                  <div className="text-right">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Timing & Payment</span>
                      <div className="font-bold text-black">{new Date(event.eventDate).toLocaleDateString()}</div>
                      <div className="text-gray-700 mb-1">
                          {new Date(event.eventDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(event.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </div>
                      <div className={`text-xs font-bold px-2 py-0.5 inline-block border rounded ${event.isPaid ? 'border-green-600 text-green-700 bg-green-50' : 'border-red-600 text-red-700 bg-red-50'}`}>
                          {event.isPaid ? 'INVOICE PAID' : 'PAYMENT PENDING'}
                      </div>
                  </div>
                  
                  <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Logistics</span>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <span className="text-xs font-semibold text-gray-600">Bar Rental:</span>
                              <div className="text-black">{event.barRental.required ? `${event.barRental.size}, ${event.barRental.color}` : 'None'}</div>
                          </div>
                          <div>
                              <span className="text-xs font-semibold text-gray-600">Glassware:</span>
                              <div className="text-black">{event.glassRental.required ? 'Rental (See List)' : 'Plastic Cups'}</div>
                          </div>
                      </div>
                  </div>
                   <div className="text-right">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Team</span>
                      <div className="text-black font-medium">{event.bartender.name}</div>
                      <div className="text-gray-600 text-xs">{event.bartender.email}</div>
                      <div className="mt-1 font-bold text-black">{event.headcount} Guests</div>
                  </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cocktails</span>
                  <div className="flex flex-wrap gap-2">
                      {event.cocktailSelections.map(c => (
                          <span key={c} className="bg-gray-100 text-black px-2 py-1 rounded text-xs border border-gray-200">{c}</span>
                      ))}
                  </div>
              </div>
          </div>

          {/* --- PACKING LIST COLUMNS --- */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                  {renderPrintCategory("Alcohol", IngredientType.ALCOHOL)}
                  {renderPrintCategory("Syrups & Mixers", IngredientType.SYRUP)}
                  {renderPrintCategory("Juices", IngredientType.JUICE)}
              </div>
              <div>
                  {renderPrintCategory("Glassware", IngredientType.GLASS)}
                  {renderPrintCategory("Garnishes", IngredientType.GARNISH)}
                  {renderPrintCategory("Sodas & Mixers", IngredientType.SODA)}
                  {renderPrintCategory("Others", IngredientType.OTHERS)}
              </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-400 uppercase tracking-widest">
              Generated on {new Date().toLocaleString()} • MTL Craft Cocktails
          </div>
      </div>
      );
  };

  if (loading) {
    return (
      <div className="h-full bg-dark-800 border-l border-white/10 p-6 flex items-center justify-center">
        <div className="text-gold-400 animate-pulse font-serif italic">Calculating...</div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="h-full bg-dark-800 border-l border-white/10 p-6 flex flex-col items-center justify-center text-gray-500">
        <p className="text-center font-serif">Say "Generate packing list" to begin</p>
      </div>
    );
  }

  const renderCategory = (title: string, type: IngredientType) => {
    const items = list.categories[type];
    if (!items || items.length === 0) return null;

    const colorClass = getCategoryColor(type, false);

    return (
      <div className="mb-6 break-inside-avoid">
        <h3 className={`${colorClass} text-xs font-bold tracking-widest uppercase mb-2 border-b border-white/10 pb-1`}>{title}</h3>
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex flex-col">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-white">{item.name}</span>
                <span className="text-gold-400 font-bold">
                    {item.containersNeeded} {item.containersNeeded > 1 ? 'units' : 'unit'} 
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total: {Math.round(item.quantityNeededOz * 10) / 10} {item.unit}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          /* Hide Main App UI */
          #root { display: none !important; }
          
          /* Show Portal Content */
          body { background: white !important; overflow: visible !important; height: auto !important; }
          #print-portal-root { 
              display: block !important; 
              position: absolute; 
              top: 0; 
              left: 0; 
              width: 100%; 
              z-index: 2147483647; 
          }
        }
        @media screen {
          #print-portal-root { display: none; }
        }
      `}</style>

      {/* --- SCREEN VIEW --- */}
      <div className="h-full bg-dark-800 border-l border-white/10 flex flex-col print:hidden">
          <div className="p-6 border-b border-white/10 bg-dark-900">
              <h2 className="text-2xl font-serif text-white mb-1">Master Packing List</h2>
              <div className="flex justify-between text-xs text-gray-400">
                  <span>Total Drinks: {list.summary.totalDrinks}</span>
                  <span>Generated: {new Date(list.generatedAt).toLocaleTimeString()}</span>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {renderCategory("Alcohol", IngredientType.ALCOHOL)}
              {renderCategory("Syrups & Mixers", IngredientType.SYRUP)}
              {renderCategory("Juices", IngredientType.JUICE)}
              {renderCategory("Glassware", IngredientType.GLASS)}
              {renderCategory("Garnishes", IngredientType.GARNISH)}
              {renderCategory("Sodas & Mixers", IngredientType.SODA)}
              {renderCategory("Others", IngredientType.OTHERS)}
          </div>

          <div className="p-6 border-t border-white/10 flex flex-col gap-2">
               <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleExportPDF}
                        className="py-2 bg-burgundy-900 hover:bg-burgundy-950 text-white rounded transition-colors text-xs font-medium shadow-lg"
                    >
                        Print / PDF
                    </button>
                    <button 
                        onClick={handleEmailTeam}
                        className="py-2 bg-gold-500 hover:bg-gold-400 text-dark-900 rounded transition-colors text-xs font-bold shadow-lg"
                    >
                        Email Team
                    </button>
               </div>
               <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={handleCopyForSheets}
                        className="py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded transition-colors text-[10px] font-medium text-center"
                    >
                        Copy for Excel
                    </button>
               </div>
          </div>
      </div>

      {/* --- PRINT PORTAL --- */}
      {createPortal(
        <div id="print-portal-root">
            {renderPrintContent()}
        </div>,
        document.body
      )}
    </>
  );
};

export default PackingListDisplay;
