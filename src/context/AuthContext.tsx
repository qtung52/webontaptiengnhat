'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  signInGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  saveProfile: (displayName: string, className?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  showProfileModal: false,
  setShowProfileModal: () => {},
  signInGoogle: async () => {},
  logOut: async () => {},
  saveProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser && db) {
        const firestore = db;
        // Kiểm tra xem đã có document profile trong Firestore chưa
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Lần đầu đăng nhập: tạo thông tin ban đầu và hiện modal hỏi tên/lớp
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Võ sinh Kotoba',
              className: '',
              createdAt: new Date().toISOString(),
              lastSyncedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            setShowProfileModal(true);
          }
        } catch (err) {
          console.warn('Lỗi tải profile Firestore:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      alert('Firebase chưa được cấu hình trong file .env.local!');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Lỗi đăng nhập Google:', error);
      alert('Không thể đăng nhập bằng tài khoản Google. Vui lòng kiểm tra lại cấu hình Firebase.');
    }
  };

  const logOut = async () => {
    if (auth) {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    }
  };

  const saveProfile = async (displayName: string, className?: string) => {
    if (!user || !db) return;
    const firestore = db;
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const updated: Partial<UserProfile> = {
        displayName: displayName.trim(),
        className: className?.trim() || '',
        lastSyncedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, updated, { merge: true });
      setProfile(prev => (prev ? { ...prev, ...updated } : null));
      setShowProfileModal(false);
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: isFirebaseConfigured,
        showProfileModal,
        setShowProfileModal,
        signInGoogle,
        logOut,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
