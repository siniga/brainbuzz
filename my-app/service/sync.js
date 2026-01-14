import api from './api';
import { 
  upsertSubjects, 
  upsertSkills, 
  upsertQuestions, 
  upsertRewards,
  upsertProgress,
  upsertSessionLogs,
  getUnsyncedSessionLogs,
  getUnsyncedProgress,
  getUnsyncedRewards,
  markRowsSynced
} from '../database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const syncData = async () => {
  try {
    const lastSyncedAt = await AsyncStorage.getItem('last_synced_at');
    const userId = await AsyncStorage.getItem('userId') || 'user_default';
    
    // --- UPSTREAM SYNC (PUSH) ---
    // Push local progress to server first to prevent overwrites
    const unsyncedLogs = await getUnsyncedSessionLogs(userId);
    const unsyncedProgress = await getUnsyncedProgress(userId);
    const unsyncedRewards = await getUnsyncedRewards(userId);

    if (unsyncedLogs.length > 0 || unsyncedProgress.length > 0 || unsyncedRewards.length > 0) {
      console.log(`Pushing ${unsyncedLogs.length} logs, ${unsyncedProgress.length} progress, ${unsyncedRewards.length} rewards`);
      
      const pushResponse = await api.post('/sync', {
        data: {
          sessions: unsyncedLogs,
          progress: unsyncedProgress,
          rewards: unsyncedRewards
        }
      });

      if (pushResponse.data && pushResponse.data.success) {
        console.log('Upstream sync successful');
        // Mark as synced
        if (unsyncedLogs.length > 0) {
          await markRowsSynced('user_session_logs', unsyncedLogs.map(i => i.id));
        }
        if (unsyncedProgress.length > 0) {
          await markRowsSynced('user_skill_progress', unsyncedProgress.map(i => i.id));
        }
        if (unsyncedRewards.length > 0) {
          await markRowsSynced('rewards', unsyncedRewards.map(i => i.id));
        }
      }
    }

    // --- DOWNSTREAM SYNC (PULL) ---
    // Always force sync everything for now to ensure we get all data
    const response = await api.get('/sync', {
      params: { 
        // last_synced_at: lastSyncedAt 
      }
    });

    const { timestamp, data } = response.data;
    
    if (data) {
      if (data.subjects && data.subjects.length > 0) {
        await upsertSubjects(data.subjects);
      }
      
      if (data.skills && data.skills.length > 0) {
        await upsertSkills(data.skills);
      }
      
      if (data.questions && data.questions.length > 0) {
        await upsertQuestions(data.questions);
      }

      if (data.rewards && data.rewards.length > 0) {
        await upsertRewards(data.rewards); 
      }

      if (data.progress && data.progress.length > 0) {
        await upsertProgress(data.progress);
      }

      if (data.sessions && data.sessions.length > 0) {
        await upsertSessionLogs(data.sessions);
      }
    }

    await AsyncStorage.setItem('last_synced_at', timestamp);
    console.log('Sync completed successfully at:', timestamp);
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
};

