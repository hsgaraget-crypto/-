import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, getDocFromServer, doc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { Invention, Comment } from "./types";

// Determine if Firebase config is real or placeholder
const isRealConfig = firebaseConfig && 
                     firebaseConfig.apiKey && 
                     !firebaseConfig.apiKey.includes("placeholder") &&
                     firebaseConfig.projectId && 
                     !firebaseConfig.projectId.includes("placeholder");

let dbInstance: any = null;
let authInstance: any = null;
let isRealFirebase = false;

if (isRealConfig) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app);
    authInstance = getAuth(app);
    isRealFirebase = true;

    // Test connection according to skill guidelines
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, 'test', 'connection'));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration: Client is offline.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Firebase init failed, switching to local storage mock:", err);
    isRealFirebase = false;
  }
} else {
  console.log("Using Mock Database & Auth (Firebase not configured in UI)");
}

export { isRealFirebase };
export const db = dbInstance;
export const auth = authInstance;

// Helper to handle Firestore Error objects as requested by the skill:
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid || "mock-user",
      email: authInstance?.currentUser?.email || "mock@gmail.com",
      emailVerified: authInstance?.currentUser?.emailVerified || true,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// LOCAL STORAGE MOCK STORES (for Fallback Mode)
// ----------------------------------------------------
const getLocalInventions = (): Invention[] => {
  const data = localStorage.getItem("atelier_inventions_v1");
  if (!data) {
    const defaultData: Invention[] = [
      {
        id: "default-1",
        title: "하늘을 달리는 우산 자전거 🚲☂️",
        shortIdea: "비 오는 날 자전거를 타면 옷이 젖으니까, 투명 우산 날개를 달아 달리면서 발전을 하는 자전거예요!",
        description: "비가 세차게 와도 걱정 없어요! 이 우산 자전거는 투명 방수 날개막이 얼굴과 몸을 완벽히 감싸 젖지 않게 해줘요. 게다가 빗물과 우산 표면의 미세한 날개 마찰을 이용하여 발전을 하고, 생성된 전기로 밤길 자전거 전조등을 활짝 밝혀준답니다!",
        slogan: "☔ 비가 와도 쌩쌩, 전기를 뿜는 미래형 수륙 우산 자전거!",
        targetAudience: "비를 피하며 등교하고 싶은 3, 4학년 친구들 🏫",
        imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop",
        authorId: "mock-author-1",
        authorName: "상상대장 민우",
        authorPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=minwoo",
        likesCount: 12,
        likedBy: ["mock-author-2", "mock-author-3"],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "default-2",
        title: "자동 양말 뒤집기 상자 📦🧦",
        shortIdea: "엄마 아빠가 빨래 갤 때 뒤집어진 양말을 쉽게 원래대로 싹 뒤집어주는 신기한 상자입니다.",
        description: "매일 뒤집어진 양말을 똑바로 펴는 게 너무 지치셨죠? 이 신기한 뒤집기 구멍에 쏙 양말을 넣고 레버를 쏙 당기면, 안에서 특수 실리콘 손가락 손이 나와 앞코를 딱 꼬집어 오목하게 반대편으로 일초 만에 튕겨냅니다!",
        slogan: "🧦 빨래 고민 끝! 세상에서 가장 빠르고 재미있는 양말 해결사!",
        targetAudience: "부모님의 집안일을 돕고 싶은 마음 착한 효자 친구들 💖",
        imageUrl: "https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=600&auto=format&fit=crop",
        authorId: "mock-author-2",
        authorName: "발명왕 수진",
        authorPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=sujin",
        likesCount: 18,
        likedBy: ["mock-author-1"],
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];
    localStorage.setItem("atelier_inventions_v1", JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveLocalInventions = (list: Invention[]) => {
  localStorage.setItem("atelier_inventions_v1", JSON.stringify(list));
};

const getLocalComments = (): Comment[] => {
  const data = localStorage.getItem("atelier_comments_v1");
  if (!data) {
    const defaultData: Comment[] = [
      {
        id: "comment-1",
        inventionId: "default-1",
        text: "와! 비를 완벽하게 막아주면 태풍 바람도 버틸 수 있는 튼튼한 우산살로 만들어야 할 것 같아요! 멋진 생각이에요! 👍👍",
        authorId: "mock-author-2",
        authorName: "발명왕 수진",
        authorPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=sujin",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: "comment-2",
        inventionId: "default-2",
        text: "발명품 양말 상자를 세탁기 바로 옆에 이쁘게 붙여놓으면 더 편리하겠어용! 최고에요! ✨",
        authorId: "mock-author-1",
        authorName: "상상대장 민우",
        authorPhoto: "https://api.dicebear.com/7.x/adventurer/svg?seed=minwoo",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
    localStorage.setItem("atelier_comments_v1", JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveLocalComments = (list: Comment[]) => {
  localStorage.setItem("atelier_comments_v1", JSON.stringify(list));
};

// ----------------------------------------------------
// CONSOLIDATED SERVICES (FIREBASE OR LOCALSTORAGE)
// ----------------------------------------------------

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

// Global Auth State listeners for client components
let authListeners: ((user: UserProfile | null) => void)[] = [];
let mockCurrentUser: UserProfile | null = null;

// Initialise mock user from session/local storage if present
const savedUser = sessionStorage.getItem("atelier_user_v1");
if (savedUser) {
  mockCurrentUser = JSON.parse(savedUser);
}

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  if (isRealFirebase) {
    return authInstance.onAuthStateChanged((firebaseUser: User | null) => {
      if (firebaseUser) {
        const up: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "상상나라 친구",
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
          email: firebaseUser.email || "",
        };
        callback(up);
      } else {
        callback(null);
      }
    });
  } else {
    authListeners.push(callback);
    callback(mockCurrentUser);
    return () => {
      authListeners = authListeners.filter(l => l !== callback);
    };
  }
};

export const handleLoginWithGoogle = async (): Promise<UserProfile> => {
  if (isRealFirebase) {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(authInstance, provider);
      return {
        uid: result.user.uid,
        displayName: result.user.displayName || "기발한 발명가",
        photoURL: result.user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${result.user.uid}`,
        email: result.user.email || "",
      };
    } catch (err) {
      console.error("Firebase Login fail:", err);
      throw err;
    }
  } else {
    // Elegant Korean dialog/character picker popup simulated dynamically
    // We'll generate a random cute child name
    const suffixes = ["지우", "예준", "서윤", "하준", "도윤", "서연", "민재", "채원", "은우", "수아"];
    const randomName = "창의적인 " + suffixes[Math.floor(Math.random() * suffixes.length)];
    const seed = Math.random().toString(36).substring(7);
    const mockUser: UserProfile = {
      uid: "mock-uid-" + seed,
      displayName: randomName,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
      email: `${seed}@atelier-school.kr`,
    };
    mockCurrentUser = mockUser;
    sessionStorage.setItem("atelier_user_v1", JSON.stringify(mockUser));
    authListeners.forEach(listener => listener(mockUser));
    return mockUser;
  }
};

// Simulated Logout
export const handleLogoutCurrent = async (): Promise<void> => {
  if (isRealFirebase) {
    await signOut(authInstance);
  } else {
    mockCurrentUser = null;
    sessionStorage.removeItem("atelier_user_v1");
    authListeners.forEach(listener => listener(null));
  }
};

// Get list of inventions
export const fetchInventionsList = async (): Promise<Invention[]> => {
  if (isRealFirebase) {
    try {
      const q = query(collection(dbInstance, "inventions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: Invention[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
        } as Invention);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "inventions");
      return [];
    }
  } else {
    return getLocalInventions().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

// Create a new invention
export const createInventionDoc = async (invention: Omit<Invention, "id" | "createdAt" | "likesCount" | "likedBy">): Promise<Invention> => {
  if (isRealFirebase) {
    try {
      const payload = {
        ...invention,
        likesCount: 0,
        likedBy: [] as string[],
        createdAt: new Date() // Real time gets overwrote in firestore.rules using server timestamp request.time or JS Date
      };
      const docRef = await addDoc(collection(dbInstance, "inventions"), payload);
      return {
        id: docRef.id,
        ...payload,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "inventions");
      throw err;
    }
  } else {
    const list = getLocalInventions();
    const newInvn: Invention = {
      id: "inv-" + Math.random().toString(36).substring(7),
      ...invention,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };
    list.unshift(newInvn);
    saveLocalInventions(list);
    return newInvn;
  }
};

// Toggle Love / Cheers
export const toggleLikeInvention = async (inventionId: string, userId: string): Promise<Invention> => {
  if (isRealFirebase) {
    // In real firebase, we'd typically pull, modify fields and save. Or use transaction. Let's do a transactional flow or simple getDoc -> setDoc.
    try {
      // Direct implementation via manual load and set
      const docRef = doc(dbInstance, "inventions", inventionId);
      const snap = await getDocs(query(collection(dbInstance, "inventions"))); // simple fallback mock or fetch doc
      // For simplicity, we can load all local lists and sync back
      const list = await fetchInventionsList();
      const target = list.find(x => x.id === inventionId);
      if (!target) throw new Error("발명품을 찾을 수 없어요.");

      const alreadyLiked = target.likedBy.includes(userId);
      const newLikedBy = alreadyLiked 
        ? target.likedBy.filter(id => id !== userId)
        : [...target.likedBy, userId];
      
      const updated = {
        ...target,
        likedBy: newLikedBy,
        likesCount: newLikedBy.length
      };

      // Since we want standard offline fallback compatibility, let's keep it clean
      // In real backend, we write updated likes back
      // Using write operation
      const { setDoc } = await import("firebase/firestore");
      await setDoc(docRef, {
        ...updated,
        createdAt: new Date(updated.createdAt) // Keep format consistent
      }, { merge: true });

      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `inventions/${inventionId}`);
      throw err;
    }
  } else {
    const list = getLocalInventions();
    const index = list.findIndex(x => x.id === inventionId);
    if (index === -1) throw new Error("발명품을 찾을 수 없어요.");
    
    const target = list[index];
    const alreadyLiked = target.likedBy.includes(userId);
    const newLikedBy = alreadyLiked 
      ? target.likedBy.filter(id => id !== userId)
      : [...target.likedBy, userId];

    const updated = {
      ...target,
      likedBy: newLikedBy,
      likesCount: newLikedBy.length
    };
    list[index] = updated;
    saveLocalInventions(list);
    return updated;
  }
};

// Fetch comments for an invention
export const fetchCommentsList = async (inventionId: string): Promise<Comment[]> => {
  if (isRealFirebase) {
    try {
      const snap = await getDocs(collection(dbInstance, "comments"));
      const list: Comment[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.inventionId === inventionId) {
          list.push({
            id: doc.id,
            ...d,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
          } as Comment);
        }
      });
      // Sort oldest first (conversational feed style)
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "comments");
      return [];
    }
  } else {
    return getLocalComments()
      .filter(c => c.inventionId === inventionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
};

// Create a new comment
export const createCommentDoc = async (inventionId: string, text: string, authorId: string, authorName: string, authorPhoto: string): Promise<Comment> => {
  if (isRealFirebase) {
    try {
      const payload = {
        inventionId,
        text,
        authorId,
        authorName,
        authorPhoto,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(dbInstance, "comments"), payload);
      return {
        id: docRef.id,
        ...payload,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "comments");
      throw err;
    }
  } else {
    const list = getLocalComments();
    const newComment: Comment = {
      id: "comment-" + Math.random().toString(36).substring(7),
      inventionId,
      text,
      authorId,
      authorName,
      authorPhoto,
      createdAt: new Date().toISOString()
    };
    list.push(newComment);
    saveLocalComments(list);
    return newComment;
  }
};
