import { Actividad } from '../types';

const OUTBOX_KEY = 'medflow_pending_activities';
const SYNC_STATUS_KEY = 'medflow_sync_status';

export interface SyncStatus {
  pendingCount: number;
  lastSyncAttempt: string | null;
  isOnline: boolean;
  isSyncing: boolean;
}

export const outboxService = {
  addToQueue(activity: Actividad): void {
    const pending = this.getPending();
    const exists = pending.find(p => p.id === activity.id);
    if (!exists) {
      pending.push({ ...activity, synced: false });
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(pending));
    }
    this.updateSyncStatus({ pendingCount: pending.length });
  },
  
  getPending(): Actividad[] {
    const data = localStorage.getItem(OUTBOX_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  removeFromQueue(id: string): void {
    const pending = this.getPending().filter(p => p.id !== id);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(pending));
    this.updateSyncStatus({ pendingCount: pending.length });
  },
  
  clearQueue(): void {
    localStorage.removeItem(OUTBOX_KEY);
    this.updateSyncStatus({ pendingCount: 0 });
  },
  
  getSyncStatus(): SyncStatus {
    const data = localStorage.getItem(SYNC_STATUS_KEY);
    const defaultStatus: SyncStatus = {
      pendingCount: 0,
      lastSyncAttempt: null,
      isOnline: navigator.onLine,
      isSyncing: false
    };
    return data ? { ...defaultStatus, ...JSON.parse(data) } : defaultStatus;
  },
  
  updateSyncStatus(partial: Partial<SyncStatus>): void {
    const current = this.getSyncStatus();
    const updated = { ...current, ...partial };
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
  },
  
  async syncPending(backendUrl?: string): Promise<{ success: number; failed: number }> {
    const pending = this.getPending();
    if (pending.length === 0 || !navigator.onLine) {
      return { success: 0, failed: 0 };
    }
    
    this.updateSyncStatus({ isSyncing: true });
    
    let success = 0;
    let failed = 0;
    
    for (const activity of pending) {
      try {
        if (backendUrl) {
          const response = await fetch(`${backendUrl}/actividades`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('medflow_token') || ''}`
            },
            body: JSON.stringify(activity)
          });
          
          if (response.ok) {
            this.removeFromQueue(activity.id);
            success++;
          } else {
            failed++;
          }
        } else {
          this.removeFromQueue(activity.id);
          success++;
        }
      } catch (error) {
        failed++;
      }
    }
    
    this.updateSyncStatus({
      isSyncing: false,
      lastSyncAttempt: new Date().toISOString(),
      pendingCount: this.getPending().length
    });
    
    return { success, failed };
  },
  
  initOnlineListener(onSync?: () => void): () => void {
    const handleOnline = () => {
      this.updateSyncStatus({ isOnline: true });
      if (onSync) onSync();
    };
    
    const handleOffline = () => {
      this.updateSyncStatus({ isOnline: false });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    this.updateSyncStatus({ isOnline: navigator.onLine });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};