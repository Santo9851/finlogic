export default function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            activeCategory === category 
            ? 'bg-ls-compliment text-ls-primary shadow-[0_0_15px_rgba(245,159,1,0.3)]' 
            : 'bg-ls-supporting/10 text-ls-white/60 hover:bg-ls-supporting/30 hover:text-ls-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
