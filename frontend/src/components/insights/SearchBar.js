import { Search } from 'lucide-react';

export default function SearchBar({ placeholder = "Search insights...", value, onChange }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ls-white/40">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        className="w-full bg-ls-supporting/10 border border-ls-supporting/30 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-ls-compliment focus:bg-ls-supporting/20 transition-all text-ls-white placeholder:text-ls-white/40"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
