export default function SuggestionPills({
  quickPrompts,
  onSelect,
}: {
  quickPrompts: string[]
  onSelect: (prompt: string) => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2 border-t border-gray-100 mt-3 pt-2">
      {quickPrompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="max-w-full break-words rounded-full border border-brand-orange/30 bg-[#FFFBF5] px-3.5 py-2 text-xs font-medium text-brand-ink hover:border-brand-orange hover:bg-brand-orange/10"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
