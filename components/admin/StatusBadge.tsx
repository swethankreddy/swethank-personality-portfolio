interface Props {
  published: boolean;
  className?: string;
}

export default function StatusBadge({ published, className = '' }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        published
          ? 'bg-[#34c759]/12 text-[#1a7a2e]'
          : 'bg-ink/[0.06] text-ink/40',
        className,
      ].join(' ')}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}
