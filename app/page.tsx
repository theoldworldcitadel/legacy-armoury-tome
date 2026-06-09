'use client';
import { useState, useEffect } from 'react';
import { Upload, BookOpen, Book, Trash2, Menu, X } from 'lucide-react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function LegacyArmouryTome() {
  const [library, setLibrary] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const openDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('LegacyArmoury', 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pdfs')) {
          db.createObjectStore('pdfs', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = (e: any) => reject(e.target.error);
    });
  };

  const loadLibrary = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction('pdfs', 'readonly');
      const store = transaction.objectStore('pdfs');
      const saved = await new Promise<any[]>((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
      });

      const loaded = saved.map(item => ({
        id: item.id,
        name: item.name,
        url: URL.createObjectURL(new Blob([item.data]))
      }));

      loaded.sort((a, b) => a.name.localeCompare(b.name));
      setLibrary(loaded);
    } catch (err) {
      console.error("Failed to load library", err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const id = Date.now().toString();
    const name = file.name.replace('.pdf', '').replace(/_/g, ' ');

    try {
      const db = await openDB();
      const transaction = db.transaction('pdfs', 'readwrite');
      const store = transaction.objectStore('pdfs');
      await new Promise<void>((resolve) => {
        store.put({ id, name, data: arrayBuffer });
        resolve();
      });

      await loadLibrary();
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const removeBook = async (id: string) => {
    if (!confirm("Delete this Army List permanently?")) return;

    try {
      const db = await openDB();
      const transaction = db.transaction('pdfs', 'readwrite');
      const store = transaction.objectStore('pdfs');
      await new Promise<void>((resolve) => {
        store.delete(id);
        resolve();
      });

      await loadLibrary();
      if (selectedBook) setSelectedBook(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="min-h-screen bg-[#0a0603] text-amber-100 flex flex-col overflow-hidden">
      {/* Header - Mobile Friendly */}
      <header className="relative border-b border-amber-900 bg-black overflow-hidden h-20 sm:h-24 md:h-28 lg:h-32 shrink-0">
        <img src="/header-banner.png" alt="Legacy Armoury Tome" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black/90"></div>

        <div className="absolute inset-0 flex items-center px-4 md:px-8 z-10">
          <div className="flex-1 flex justify-center">
            <img src="/logo.png" alt="Legacy Armoury Tome" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto object-contain drop-shadow-2xl" />
          </div>

          <label className="cursor-pointer">
            <img 
              src="/upload-button.png" 
              alt="Upload New Grimoire" 
              className="h-12 sm:h-14 md:h-16 w-auto object-contain hover:scale-105 transition-transform drop-shadow-2xl" 
            />
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          </label>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="md:hidden ml-4 text-amber-100 p-2"
          >
            {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Responsive */}
        <div className={`w-80 border-r border-amber-900 bg-[#140d08] p-6 overflow-auto absolute md:relative h-full z-20 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="mb-8 flex justify-center">
            <img src="/library-header.png" alt="Your Army Library" className="w-11/12 max-w-[260px] h-auto object-contain rounded-2xl border border-amber-900 shadow-2xl" />
          </div>

          <div className="space-y-3">
            {library.map((book) => (
              <div key={book.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:bg-amber-950 ${selectedBook === book.url ? 'border-amber-600 bg-amber-950' : 'border-amber-900'}`}>
                <button onClick={() => { setSelectedBook(book.url); setSidebarOpen(false); }} className="flex-1 text-left flex gap-4 items-center">
                  <Book className="w-8 h-8 text-amber-700 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold">{book.name}</div>
                    <div className="text-xs text-amber-700">Legacy PDF</div>
                  </div>
                </button>
                <button onClick={() => removeBook(book.id)} className="p-2 text-red-600 hover:text-red-400 hover:bg-red-950/50 rounded-lg">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative bg-[#1a120b] overflow-auto flex items-center justify-center">
          {selectedBook ? (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                fileUrl={selectedBook}
                plugins={[defaultLayoutPluginInstance]}
                defaultScale={SpecialZoomLevel.PageFit}
              />
            </Worker>
          ) : (
            <div className="flex flex-col items-center justify-center text-center px-6 py-12">
              <img 
                src="/empty-placeholder.png" 
                alt="Tomes of Legend" 
                className="w-72 sm:w-96 h-auto mb-10 drop-shadow-2xl" 
              />
              <h2 className="text-3xl sm:text-4xl mb-4">The Tomes of Legend Await</h2>
              <p className="text-lg sm:text-xl text-amber-700 mb-8">Upload your Legacy PDFs • They are saved permanently</p>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-amber-900 bg-black/80 p-4 text-center text-xs sm:text-sm text-amber-600 shrink-0">
        This app is unofficial and unendorsed by Games Workshop.<br className="hidden sm:block" />
        Created by the Warhammer The Old World Community Podcast &amp; Old World Tavern Magazine.<br />
        <a href="https://www.patreon.com/" target="_blank" className="hover:text-amber-400 underline">Support us on Patreon</a>
      </footer>
    </div>
  );
}