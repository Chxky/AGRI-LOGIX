declare module '*.css';
declare module '*.png';
declare module '*.jpg';
declare module '*.svg';
declare module 'firebase/app' {
  const app: any;
  export default app;
  export function initializeApp(config: any): any;
  export function getApp(name?: string): any;
  export function getApps(): any[];
  export type FirebaseApp = any;
}
declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export function onAuthStateChanged(auth: any, cb: (user: any) => void): () => void;
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function signOut(auth: any): Promise<void>;
  export type User = any;
}
declare module 'firebase/functions' {
  export function getFunctions(app?: any, region?: string): any;
  export function httpsCallable(fn: any, name: string): (data?: any) => Promise<{ data: any }>;
}
declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function collection(db: any, name: string): any;
  export function query(ref: any, ...constraints: any[]): any;
  export function where(field: string, op: string, value: any): any;
  export function getDocs(ref: any): Promise<{ docs: any[]; empty: boolean }>;
  export function addDoc(ref: any, data: any): Promise<any>;
  export function setDoc(ref: any, data: any, opts?: any): Promise<void>;
  export function doc(db: any, name: string, ...path: string[]): any;
}
