import { db, storage } from "./firebase-config";
import { ref, uploadBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

export class AdminManager {
  static async uploadGame(file, meta) {
    const storageRef = ref(storage, `games/${file.name}`);
    await uploadBytes(storageRef, file);
    
    await setDoc(doc(db, 'games', meta.id), {
      ...meta,
      createdAt: new Date().toISOString(),
      downloads: 0,
      averageRating: 0
    });
  }

  static async updateUserRole(userId, role) {
    await db.collection('users').doc(userId).update({
      roles: arrayUnion(role)
    });
  }

  static async startTournament(config) {
    const tournamentRef = doc(db, 'tournaments', config.id);
    await setDoc(tournamentRef, {
      ...config,
      status: 'active',
      participants: [],
      startTime: new Date().toISOString()
    });
  }
}