import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3Sc7Y4IQkPVrGzz6q6Fd_n6bhbt5SPoo",
  authDomain: "cricketers-platform.firebaseapp.com",
  projectId: "cricketers-platform",
  storageBucket: "cricketers-platform.appspot.com",
  messagingSenderId: "123532409270",
  appId: "1:123532409270:web:345f75dfa5697fdec96917"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    console.log('Firebase persistence error:', err.code);
  });

export { db, storage };