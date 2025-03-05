import { db } from "./firebase-config";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

const LEADERBOARD_LIMIT = 10;

export class Leaderboard {
  constructor(gameType) {
    this.gameType = gameType;
    this.subscribers = new Set();
  }

  subscribe(callback) {
    const q = query(
      collection(db, 'leaderboards', this.gameType, 'entries'),
      orderBy('score', 'desc'),
      limit(LEADERBOARD_LIMIT)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leaders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      this.subscribers.forEach(cb => cb(leaders));
    });

    this.subscribers.add(callback);
    return () => {
      unsubscribe();
      this.subscribers.delete(callback);
    };
  }

  async addScore(score) {
    const user = getAuth().currentUser;
    await db.collection('leaderboards').doc(this.gameType)
      .collection('entries').add({
        userId: user.uid,
        score,
        timestamp: new Date().toISOString(),
        displayName: user.displayName || 'Anonymous'
      });
  }
}