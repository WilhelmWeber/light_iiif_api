import { FirebaseApp, initializeApp } from "firebase/app";
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDERID,
    appId: process.env.APPID,
    measurementId: process.env.MEASUREMENTID,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const firebasestorage: FirebaseStorage = getStorage(app);

export default firebasestorage;