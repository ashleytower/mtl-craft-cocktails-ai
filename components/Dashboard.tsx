
import React from 'react';
import { EventData } from '../types';

interface DashboardProps {
  events: EventData[];
  onSelectEvent: (event: EventData) => void;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, onSelectEvent, onRefresh }) => {
  return (
    <div className="h-full flex flex-col bg-dark-900 overflow-hidden">
      <div className="p-8 border-b border-white/10 flex justify-between items-end bg-dark-800">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Event Dashboard</h1>
          <p className="text-gray-400 text-sm">Overview of all active bookings and inquiries</p>
        </div>
        <button 
           onClick={onRefresh}
           className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-sm text-gray-300 transition-colors flex items-center gap-2"
        >
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
             <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
           </svg>
           Refresh from Sheets
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-gold-400/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border
                    ${event.isPaid ? 'border-green-800 text-green-400 bg-green-900/20' : 'border-red-800 text-red-400 bg-red-900/20'}`}>
                    {event.isPaid ? 'PAID' : 'PENDING'}
                 </span>
              </div>
              
              <div className="mb-4">
                 <div className="text-[10px] font-bold text-gold-400 uppercase tracking-widest mb-1">{event.eventType}</div>
                 <h3 className="text-xl font-serif text-white group-hover:text-gold-400 transition-colors">{event.clientName}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-50"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" /></svg>
                   <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-50"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                   <span className="truncate">{event.location}</span>
                </div>
                 <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-50"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" /></svg>
                   <span>{event.headcount} Guests</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                  {event.cocktailSelections.slice(0, 3).map(c => (
                      <span key={c} className="text-[10px] bg-dark-900 px-2 py-1 rounded text-gray-400">{c}</span>
                  ))}
                  {event.cocktailSelections.length > 3 && (
                      <span className="text-[10px] bg-dark-900 px-2 py-1 rounded text-gray-400">+{event.cocktailSelections.length - 3}</span>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
