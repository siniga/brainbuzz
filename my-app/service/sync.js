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
    const token = await AsyncStorage.getItem('userToken');
    
    // Check if user is authenticated
    if (!token) {
      console.warn('⚠️ No auth token found, skipping sync');
      return false;
    }
    
    console.log('🔄 Starting sync...');
    
    // --- UPSTREAM SYNC (PUSH) ---
    // Push local progress to server first to prevent overwrites
    const unsyncedLogs = await getUnsyncedSessionLogs(userId);
    const unsyncedProgress = await getUnsyncedProgress(userId);
    const unsyncedRewards = await getUnsyncedRewards(userId);

    if (unsyncedLogs.length > 0 || unsyncedProgress.length > 0 || unsyncedRewards.length > 0) {
      console.log(`📤 Pushing ${unsyncedLogs.length} logs, ${unsyncedProgress.length} progress, ${unsyncedRewards.length} rewards`);
      
      try {
        const pushResponse = await api.post('/sync', {
          data: {
            sessions: unsyncedLogs,
            progress: unsyncedProgress,
            rewards: unsyncedRewards
          }
        });

        if (pushResponse.data && pushResponse.data.success) {
          console.log('✅ Upstream sync successful');
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
      } catch (pushError) {
        // Detailed error logging for push
        console.error('❌ Push sync failed:', {
          message: pushError.message,
          code: pushError.code,
          response: pushError.response?.data,
          status: pushError.response?.status,
          isNetworkError: pushError.code === 'ERR_NETWORK'
        });
        // Continue to pull sync even if push fails
      }
    }

    // --- DOWNSTREAM SYNC (PULL) ---
    console.log('📥 Starting pull sync...');
    try {
      const response = await api.get('/sync', {
        params: { 
          // last_synced_at: lastSyncedAt 
        }
      });

      const { timestamp, data } = response.data;
      
      if (data) {
        if (data.subjects && data.subjects.length > 0) {
          await upsertSubjects(data.subjects);
          console.log(`✅ Synced ${data.subjects.length} subjects`);
        }
        
        if (data.skills && data.skills.length > 0) {
          await upsertSkills(data.skills);
          console.log(`✅ Synced ${data.skills.length} skills`);
        }
        
        if (data.questions && data.questions.length > 0) {
          await upsertQuestions(data.questions);
          console.log(`✅ Synced ${data.questions.length} questions`);
        }

        if (data.rewards && data.rewards.length > 0) {
          await upsertRewards(data.rewards);
          console.log(`✅ Synced ${data.rewards.length} rewards`);
        }

        if (data.progress && data.progress.length > 0) {
          await upsertProgress(data.progress);
          console.log(`✅ Synced ${data.progress.length} progress records`);
        }

        if (data.sessions && data.sessions.length > 0) {
          await upsertSessionLogs(data.sessions);
          console.log(`✅ Synced ${data.sessions.length} sessions`);
        }
      }

      await AsyncStorage.setItem('last_synced_at', timestamp);
      console.log('✅ Sync completed successfully at:', timestamp);
      return true;
    } catch (pullError) {
      // Detailed error logging for pull
      console.error('❌ Pull sync failed:', {
        message: pullError.message,
        code: pullError.code,
        response: pullError.response?.data,
        status: pullError.response?.status,
        isNetworkError: pullError.code === 'ERR_NETWORK'
      });
      throw pullError;
    }
  } catch (error) {
    // Improved error logging
    console.error('❌ Sync failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      isAxiosError: error.isAxiosError,
      response: error.response?.data,
      status: error.response?.status
    });
    return false;
  }
};

