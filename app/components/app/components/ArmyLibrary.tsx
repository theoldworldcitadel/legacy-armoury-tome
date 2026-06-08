'use client';
import { Book, Users } from 'lucide-react';

export default function ArmyLibrary({ library, onSelect, selected }: any) {
  return (
    <div className="w-80 border-r border-amber-900 bg-[#140d08] p-6 overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-amber-600" />
        <h3 className="text-xl font-bold">YOUR ARMY LIBRARY</h3>
      </div>
      <div className="space-y-3">
        {library.map((book: any) => (
          <button
            key={book.id}
            onClick={() => onSelect(book.url)}
            className={`w-full text-left p-4 rounded-xl transition-all hover:bg-amber-950 flex gap-4 items-center border ${selected === book.url ? 'border-amber-600 bg-amber-950' : 'border-amber-900'}`}
          >
            <Book className="w-8 h-8 text-amber-700" />
            <div className="truncate">
              <div className="font-semibold">{book.name}</div>
              <div className="text-xs text-amber-700">Legacy PDF</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}