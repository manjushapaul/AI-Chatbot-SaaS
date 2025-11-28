import { ReactNode } from 'react';
import { typography } from '@/lib/design-tokens';

interface UploadCardProps {
  icon: ReactNode;
  headline: string;
  helperText: string;
  onFileSelect: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  useLargeTypography?: boolean;
}

export function UploadCard({ icon, headline, helperText, onFileSelect, accept, multiple = true, useLargeTypography = false }: UploadCardProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="w-full rounded-2xl bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur border border-white/70 px-6 py-10 flex flex-col items-center justify-center gap-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="bg-accent-soft/10 text-accent-soft rounded-full p-3">
        {icon}
      </div>
      <h3 className={useLargeTypography ? typography.bodyLarge : 'text-sm font-medium text-gray-800'}>{headline}</h3>
      <p className={useLargeTypography ? typography.helperTextLarge : 'text-xs text-gray-500 text-center'}>{helperText}</p>
      <label className={`rounded-full bg-accent-soft text-white px-5 py-2 ${useLargeTypography ? 'text-base' : 'text-sm'} font-medium shadow hover:bg-accent-soft/80 transition-colors cursor-pointer`}>
        Choose Files
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
}

