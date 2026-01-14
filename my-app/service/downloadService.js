import * as FileSystem from 'expo-file-system';
import { openDB } from '../database/db';
import { IMAGE_URL } from './api';

const LOCAL_IMAGE_DIR = FileSystem.documentDirectory + 'images/';

export const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(LOCAL_IMAGE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(LOCAL_IMAGE_DIR, { intermediates: true });
  }
};

export const getLocalImageUri = async (remoteUri) => {
  if (!remoteUri) return null;
  
  // Clean query params if any
  const cleanUri = remoteUri.split('?')[0];
  // Flatten path: subjects/math.png -> subjects_math.png
  const localFilename = cleanUri.replace(/\//g, '_');
  const localUri = LOCAL_IMAGE_DIR + localFilename;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }
  } catch (e) {
    // Ignore error, fallback to remote
  }
  return `${IMAGE_URL}${remoteUri}`; 
};

export const downloadSubjectImages = async (userId) => {
  await ensureDirExists();
  const db = await openDB();

  console.log("Starting background image download for user:", userId);

  try {
    // 1. Get Selected Subjects
    const subjects = await db.getAllAsync(
      `SELECT s.image_url, s.icon_uri, s.id 
       FROM subjects s 
       JOIN user_subjects us ON s.id = us.subject_id 
       WHERE us.user_id = ?`,
      userId
    );

    if (subjects.length === 0) {
        console.log("No selected subjects found to download.");
        return;
    }

    const subjectIds = subjects.map(s => s.id);
    const placeholders = subjectIds.map(() => '?').join(',');

    // 2. Get Skills for these subjects
    const skills = await db.getAllAsync(
      `SELECT id, icon_uri FROM skills WHERE subject_id IN (${placeholders})`,
      ...subjectIds
    );

    // 3. Get Questions for these skills
    const skillIds = skills.map(s => s.id);
    let questions = [];
    if (skillIds.length > 0) {
        const skillPlaceholders = skillIds.map(() => '?').join(',');
        // Fetch only questions that have images
        questions = await db.getAllAsync(
          `SELECT media_uri FROM questions WHERE skill_id IN (${skillPlaceholders}) AND media_uri IS NOT NULL`,
          ...skillIds
        );
    }

    // 4. Collect all URIs
    const allUris = new Set();
    subjects.forEach(s => {
      if (s.image_url) allUris.add(s.image_url);
      if (s.icon_uri) allUris.add(s.icon_uri);
    });
    skills.forEach(s => {
       if (s.icon_uri) allUris.add(s.icon_uri);
    });
    questions.forEach(q => {
       if (q.media_uri) allUris.add(q.media_uri);
    });

    console.log(`Found ${allUris.size} unique images to check/download.`);

    // 5. Download loop (Sequential to avoid overwhelming network/filesystem)
    for (const uri of allUris) {
        if (!uri) continue;
        const cleanUri = uri.split('?')[0];
        const localFilename = cleanUri.replace(/\//g, '_');
        const localUri = LOCAL_IMAGE_DIR + localFilename;

        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            const remoteUrl = `${IMAGE_URL}${uri}`;
            try {
                // console.log(`Downloading ${remoteUrl}...`);
                await FileSystem.downloadAsync(remoteUrl, localUri);
            } catch (e) {
                console.warn(`Failed to download ${uri}:`, e.message);
            }
        }
    }
    console.log("Download completed.");

  } catch (e) {
    console.error("Download service error:", e);
  }
};
