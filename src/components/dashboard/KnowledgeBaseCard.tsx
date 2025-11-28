import Link from 'next/link';
import { Bot, FileText, Eye, Edit, Trash2 } from 'lucide-react';

interface KnowledgeBaseCardProps {
  id: string;
  name: string;
  description?: string;
  status: string;
  linkedBots: string;
  documentCount: number;
  onDelete: (id: string) => void;
}

export function KnowledgeBaseCard({
  id,
  name,
  description,
  status,
  linkedBots,
  documentCount,
  onDelete,
}: KnowledgeBaseCardProps) {
  const getStatusPill = () => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-4 flex items-center justify-between gap-6 border border-white/70">
      {/* Left Side: Name, Description, Meta */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-semibold text-gray-900 truncate leading-6">{name}</h3>
            {getStatusPill()}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mb-1 line-clamp-1 leading-5">{description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-gray-500" />
              <span>{linkedBots}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>{documentCount} {documentCount === 1 ? 'doc' : 'docs'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/dashboard/knowledge-bases/${id}`}
          className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-full px-4 py-2 text-base font-medium flex items-center space-x-2 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-600" />
          <span>View</span>
        </Link>
        <Link
          href={`/dashboard/knowledge-bases/${id}/edit`}
          className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-full px-4 py-2 text-base font-medium flex items-center space-x-2 transition-colors"
        >
          <Edit className="w-4 h-4 text-gray-600" />
          <span>Edit</span>
        </Link>
        <button
          onClick={() => onDelete(id)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Delete knowledge base"
        >
          <Trash2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

