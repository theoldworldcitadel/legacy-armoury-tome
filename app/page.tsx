'use client';
import { useState, useEffect } from 'react';
import { Upload, BookOpen, Sword, Book, Trash2 } from 'lucide-react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function LegacyArmouryTome() {
  const [library, setLibrary] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#0a0603] text-amber-100 overflow-hidden flex flex-col">
      {/* Header - PERFECTLY CENTERED LOGO */}
      <header className="relative border-b border-amber-900 bg-black overflow-hidden h-32 sm:h-36 md:h-40 lg:h-48">
        <img 
          src="/header-banner.png" 
          alt="Legacy Armoury Tome" 
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/90"></div>

        <div className="absolute inset-0 flex items-center px-6 md:px-12 z-10">
          <div className="flex-1 flex justify-center">
            <img 
              src="/logo.png" 
              alt="Legacy Armoury Tome Logo" 
              className="h-28 sm:h-32 md:h-36 lg:h-40 w-auto object-contain drop-shadow-2xl" 
            />
          </div>

          {/* Epic Upload Button */}
          <label className="cursor-pointer overflow-hidden rounded-2xl shadow-2xl ml-8">
            <img 
              src="/upload-button.png" 
              alt="Upload New Grimoire" 
              className="w-full h-20 md:h-24 lg:h-28 object-cover" 
            />
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Library Sidebar */}
        <div className="w-80 border-r border-amber-900 bg-[#140d08] p-6 overflow-auto">
          <div className="mb-8 flex justify-center">
            <img 
              src="/library-header.png" 
              alt="Your Army Library" 
              className="w-11/12 max-w-[260px] h-auto object-contain rounded-2xl border border-amber-900 shadow-2xl" 
            />
          </div>

          <div className="space-y-3">
            {library.map((book) => (
              <div key={book.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:bg-amber-950 ${selectedBook === book.url ? 'border-amber-600 bg-amber-950' : 'border-amber-900'}`}>
                <button onClick={() => setSelectedBook(book.url)} className="flex-1 text-left flex gap-4 items-center">
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

        {/* Main PDF Viewer */}
        <div className="flex-1 relative bg-[#1a120b] overflow-auto">
          {selectedBook ? (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                fileUrl={selectedBook}
                plugins={[defaultLayoutPluginInstance]}
                defaultScale={1}
              />
            </Worker>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 relative overflow-hidden">
              <img 
                src="/empty-placeholder.png" 
                alt="The Tomes of Legend Await" 
                className="absolute inset-0 w-full h-full object-cover opacity-90" 
              />
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-5xl font-bold mb-6 text-amber-100 drop-shadow-2xl">The Tomes of Legend Await</h2>
                <p className="text-xl max-w-md text-white drop-shadow-md">Upload your Legacy PDFs • They are saved permanently</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer Footer */}
      <footer className="border-t border-amber-900 bg-black/80 p-4 text-center text-sm text-amber-600">
        This app is unofficial and unendorsed by Games Workshop.<br />
        Created by the Warhammer The Old World Community Podcast &amp; Old World Tavern Magazine.<br />
        <a href="https://www.patreon.com/" target="_blank" className="hover:text-amber-400 underline">Support us on Patreon</a>
      </footer>
    </div>
  );
}