interface DateSeparatorProps {
  date: string;
}

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  return (
    <div className="my-3 flex justify-center select-none">
      <span className="rounded-lg bg-wa-panel/95 px-3 py-1 text-[12px] font-medium tracking-wide text-wa-secondary shadow-sm border border-wa-border/40 transition-colors duration-150">
        {date}
      </span>
    </div>
  );
};
