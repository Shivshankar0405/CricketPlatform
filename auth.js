import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase-config";

const auth = getAuth();

// User state management
let currentUser = null;
const userListeners = new Set();

function subscribeToAuth(callback) {
  userListeners.add(callback);
  return () => userListeners.delete(callback);
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    userListeners.forEach(cb => cb({ 
      ...user,
      ...userDoc.data(),
      uid: user.uid
    }));
  } else {
    userListeners.forEach(cb => cb(null));
  }
});

// Enhanced signup with referral tracking
export async function signUp(email, password, referralCode = null) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const userData = {
      email,
      coins: 100,
      streak: 1,
      referralCode: generateReferralCode(),
      createdAt: new Date().toISOString(),
      referrals: []
    };

    if (referralCode) {
      const referrer = await findUserByReferralCode(referralCode);
      if (referrer) {
        await updateDoc(doc(db, "users", referrer.uid), {
          coins: arrayUnion(50),
          referrals: arrayUnion(userCredential.user.uid)
        });
        userData.coins += 100;
      }
    }

    await setDoc(doc(db, "users", userCredential.user.uid), userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Session management
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  await signOut(auth);
}

// Helper functions
function generateReferralCode() {
  return 'CRIC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function findUserByReferralCode(code) {
  const snapshot = await db.collection('users')
    .where('referralCode', '==', code)
    .limit(1)
    .get();

  return snapshot.docs[0]?.ref;
}

export { subscribeToAuth };