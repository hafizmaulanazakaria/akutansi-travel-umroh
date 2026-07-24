import React from 'react';
import { ShieldAlert, Lock, Eye } from 'lucide-react';
import { UserRole } from '../types';
import { getRolePermissions } from '../utils/rbac';

interface AccessRestrictedNoticeProps {
  currentRole: UserRole;
  actionMessage?: string;
  className?: string;
}

export const AccessRestrictedNotice: React.FC<AccessRestrictedNoticeProps> = ({
  currentRole,
  actionMessage,
  className = ''
}) => {
  const perm = getRolePermissions(currentRole);

  if (perm.isReadOnly) {
    return (
      <div className={`p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Executive Read-Only View:</strong> Anda sedang masuk sebagai <strong>{perm.label}</strong>. Seluruh tombol transaksi & pengubahan data dinonaktifkan.
          </span>
        </div>
        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold text-[10px] uppercase rounded-sm shrink-0">
          Mode Lihat
        </span>
      </div>
    );
  }

  if (actionMessage) {
    return (
      <div className={`p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2 ${className}`}>
        <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>
          <strong>Akses Terbatas ({perm.label}):</strong> {actionMessage}
        </span>
      </div>
    );
  }

  return null;
};
