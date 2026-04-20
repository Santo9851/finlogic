import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center space-x-2 mt-12">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full bg-ls-supporting/10 text-ls-white/60 hover:bg-ls-supporting/30 hover:text-ls-white transition-all disabled:opacity-30 disabled:hover:bg-ls-supporting/10 disabled:hover:text-ls-white/60"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            currentPage === page
            ? 'bg-ls-compliment text-ls-primary'
            : 'bg-ls-supporting/10 text-ls-white/60 hover:bg-ls-supporting/30 hover:text-ls-white'
          }`}
        >
          {page}
        </button>
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full bg-ls-supporting/10 text-ls-white/60 hover:bg-ls-supporting/30 hover:text-ls-white transition-all disabled:opacity-30 disabled:hover:bg-ls-supporting/10 disabled:hover:text-ls-white/60"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
