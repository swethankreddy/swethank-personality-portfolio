'use client';

interface DeleteFormProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
}

export default function DeleteForm({ action, id, label }: DeleteFormProps) {
  return (
    <form
      action={action}
      className="shrink-0"
      onSubmit={(e) => {
        if (!window.confirm(`Delete "${label}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-[12px] text-muted/50 hover:text-red-500 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
