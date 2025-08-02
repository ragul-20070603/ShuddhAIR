'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  projectId: "shuddhair-health",
  appId: "1:376315036170:web:2ac232fff49e01d72955f3",
  storageBucket: "shuddhair-health.firebasestorage.app",
  apiKey: "AIzaSyAFJ3eXUnFwuy68WTimEiZECEEFKat4kF4",
  authDomain: "shuddhair-health.firebaseapp.com",
  messagingSenderId: "376315036170"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
