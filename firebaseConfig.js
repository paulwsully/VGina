import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCq-GvK22CZ-kTMtCRg65bH1KlY74j3sLA",
  authDomain: "vgina-412004.firebaseapp.com",
  databaseURL: "https://vgina-412004-default-rtdb.firebaseio.com",
  projectId: "vgina-412004",
  storageBucket: "vgina-412004.appspot.com",
  messagingSenderId: "220882520840",
  appId: "1:220882520840:web:b653325d86da32dd4ffabd",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const auth = getAuth(app);

export default database;
