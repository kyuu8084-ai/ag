import React, { useState, useEffect, useRef } from 'react';
import { CloudBackground } from './components/CloudBackground';
import { OceanBackground } from './components/OceanBackground';
import { CityBackground } from './components/CityBackground';
import { ComposePost } from './components/ComposePost';
import { PostCard } from './components/PostCard';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Post, Attachment, Comment, SubjectId, SUBJECTS, User, Notification, FRAMES } from './types';
import { generateAiReply } from './services/geminiService';
import { db, collection, addDoc, updateDoc, doc, onSnapshot, arrayUnion, increment, query, orderBy, isConfigured as isFirebaseReady } from './services/firebase';
import { 
  BookOpen, LogIn, ChevronLeft, ChevronRight, Trophy, Sparkles, 
  Search, Bell, Filter, Flame, Clock, Cloud, Wifi, WifiOff
} from 'lucide-react';

const POSTS_PER_PAGE = 10;
const LEVEL_THRESHOLDS = [0, 300, 500, 1000, 2000, 4000, 7000, 10000];
const STORAGE_KEY_USER = 'swm_user_data_v2';
const STORAGE_KEY_POSTS = 'swm_posts_data_v2';

// Background Types
type BackgroundType = 'CLOUD' | 'OCEAN' | 'CITY';

// Sample initial data distributed across subjects
const INITIAL_POSTS: Post[] = [
  {
    id: '3',
    subject: 'KHAC',
    author: 'Admin',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    content: 'Chào mừng đến với StudyWithMe! Hãy chọn môn học ở trên để bắt đầu thảo luận nhé ☁️',
    timestamp: Date.now() - 86400000,
    likes: 99,
    attachments: [],
    comments: [],
    frameId: 'f5'
  },
  {
    id: '1',
    subject: 'TOAN',
    author: 'Minh Toán',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Minh',
    content: 'Có ai biết cách giải bài tích phân này nhanh không ạ? Mình đang bí quá 🤔',
    timestamp: Date.now() - 3600000,
    likes: 5,
    attachments: [],
    comments: [],
    frameId: 'f1'
  },
  {
    id: '2',
    subject: 'ANH',
    author: 'Sarah English',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah',
    content: 'Mọi người chia sẻ tips học từ vựng IELTS hiệu quả với ạ!',
    timestamp: Date.now() - 7200000,
    likes: 12,
    attachments: [],
    comments: [],
    frameId: 'f4'
  }
];

const App: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('KHAC');
  
  // State for posts
  const [posts, setPosts] = useState<Post[]>([]);

  // Load user from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error loading user from storage", e);
      return null;
    }
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevelData, setNewLevelData] = useState<number | null>(null);
  
  // Background State
  const [currentBg, setCurrentBg] = useState<BackgroundType>('CLOUD');
  
  // New Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', content: 'Chào mừng bạn đến với diễn đàn!', timestamp: Date.now(), read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuScrollRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // --- DATA SYNCING LOGIC ---
  useEffect(() => {
    if (isFirebaseReady && db) {
      // ONLINE MODE: Subscribe to Firestore
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cloudPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          // Safe mapping ensuring all required Post fields exist
          return {
            id: doc.id,
            subject: data.subject || 'KHAC',
            author: data.author || 'Anonymous',
            avatar: data.avatar || '',
            content: data.content || '',
            timestamp: data.timestamp || Date.now(),
            likes: data.likes || 0,
            attachments: data.attachments || [],
            comments: data.comments || [],
            frameId: data.frameId
          } as Post;
        });
        setPosts(cloudPosts);
      }, (error) => {
        console.error("Error reading from Firebase:", error);
      });
      return () => unsubscribe();
    } else {
      // OFFLINE MODE: Load from localStorage
      try {
        const savedPosts = localStorage.getItem(STORAGE_KEY_POSTS);
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts));
        } else {
          setPosts(INITIAL_POSTS);
        }
      } catch (e) {
        setPosts(INITIAL_POSTS);
      }
    }
  }, []);

  // Save to localStorage only in Offline Mode
  useEffect(() => {
    if (!isFirebaseReady) {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    }
  }, [posts]);

  // Persistence Effects - Save whenever user changes (User data always local for now)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  // Background Rotation Logic
  useEffect(() => {
    const backgrounds: BackgroundType[] = ['CLOUD', 'OCEAN', 'CITY'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % backgrounds.length;
      setCurrentBg(backgrounds[index]);
    }, 60000); // Switch every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and Sort logic
  const filteredPosts = posts
    .filter(post => post.subject === activeSubject)
    .filter(post => 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.likes - a.likes; // Sort by likes desc
      }
      return b.timestamp - a.timestamp; // Sort by time desc
    });
  
  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const displayedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  // Reset page when subject or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubject, searchQuery, sortBy]);

  const handleScrollMenu = (direction: 'left' | 'right') => {
    if (menuScrollRef.current) {
      const scrollAmount = 200;
      menuScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const calculateLevel = (xp: number) => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      }
    }
    return Math.min(level, 7);
  };

  const handleGainXP = (amount: number) => {
    if (!currentUser) return;
    const newXP = (currentUser.xp || 0) + amount;
    const oldLevel = currentUser.level || 1;
    const newLevel = calculateLevel(newXP);
    
    handleUpdateUser({ xp: newXP, level: newLevel });

    if (newLevel > oldLevel) {
      setNewLevelData(newLevel);
      setShowLevelUp(true);
      // Add notification for level up
      setNotifications(prev => [{
        id: Date.now().toString(),
        content: `Chúc mừng! Bạn đã đạt cấp độ ${newLevel}!`,
        timestamp: Date.now(),
        read: false
      }, ...prev]);
    }
  };

  const handleLogin = (name: string, avatar: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      avatar,
      level: 1,
      xp: 0,
      bio: 'Tân thủ StudyWithMe',
      showcase: []
    };
    setCurrentUser(newUser);
    // Explicitly save immediately
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    setShowLogin(false);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };

  const handleNewPost = async (content: string, attachments: Attachment[]) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    
    const newPostData = {
      subject: activeSubject,
      author: currentUser.name,
      avatar: currentUser.avatar,
      content,
      timestamp: Date.now(),
      likes: 0,
      attachments,
      comments: [],
      frameId: currentUser.frameId
    };

    if (isFirebaseReady && db) {
      // Save to Firebase with type checking on 'db'
      try {
        await addDoc(collection(db, "posts"), newPostData);
      } catch (e) {
        console.error("Error adding doc: ", e);
      }
    } else {
      // Save to LocalStorage
      const newPost: Post = { ...newPostData, id: Date.now().toString() } as Post;
      setPosts([newPost, ...posts]);
    }

    setCurrentPage(1);
    handleGainXP(50); // +50XP for posting
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    if (isFirebaseReady && db) {
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
          likes: increment(1)
        });
      } catch (e) {
        console.error("Error updating likes: ", e);
      }
    } else {
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 } 
          : post
      ));
    }
  };

  const handleReply = async (postId: string, content: string, attachments: Attachment[]) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    const newComment: Comment = {
      id: Date.now().toString(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      content,
      timestamp: Date.now(),
      attachments,
      frameId: currentUser.frameId
    };

    if (isFirebaseReady && db) {
       try {
         const postRef = doc(db, "posts", postId);
         await updateDoc(postRef, {
           comments: arrayUnion(newComment)
         });
       } catch (e) {
         console.error("Error adding reply: ", e);
       }
    } else {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: [...post.comments, newComment] };
        }
        return post;
      }));
    }

    handleGainXP(50); // +50XP for replying

    const targetPost = posts.find(p => p.id === postId);
    if (targetPost) {
       // Mock notification & AI Reply
       setTimeout(async () => {
         const aiText = await generateAiReply(content, attachments, targetPost.subject);
         const aiComment: Comment = {
           id: 'ai-' + Date.now(),
           author: 'Tutor AI',
           avatar: '', 
           content: aiText,
           timestamp: Date.now(),
           attachments: [],
           isAi: true
         };
         
         if (isFirebaseReady && db) {
           try {
             const postRef = doc(db, "posts", postId);
             await updateDoc(postRef, {
               comments: arrayUnion(aiComment)
             });
           } catch(e) {}
         } else {
           setPosts(currentPosts => currentPosts.map(p => {
             if (p.id === postId) {
               return { ...p, comments: [...p.comments, aiComment] };
             }
             return p;
           }));
         }

         setNotifications(prev => [{
           id: 'notif-' + Date.now(),
           content: `Tutor AI đã trả lời trong bài viết "${targetPost.content.substring(0, 20)}..."`,
           timestamp: Date.now(),
           read: false
         }, ...prev]);

       }, 2000);
    }
  };

  const getLevelTitle = (level: number) => {
    switch(level) {
      case 1: return "Mầm Non Tri Thức";
      case 2: return "Chồi Non Hiếu Học";
      case 3: return "Cây Xanh Vững Chãi";
      case 4: return "Đại Thụ Thông Thái";
      case 5: return "Học Giả Uyên Bác";
      case 6: return "Hiền Triết Lỗi Lạc";
      case 7: return "Thần Đồng Đất Việt";
      default: return "";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const currentFrame = currentUser?.frameId ? FRAMES.find(f => f.id === currentUser.frameId) : null;

  return (
    <div className="min-h-screen relative font-sans text-gray-800 overflow-x-hidden bg-transparent transition-colors duration-1000">
      
      {/* Dynamic Backgrounds */}
      {currentBg === 'CLOUD' && <CloudBackground />}
      {currentBg === 'OCEAN' && <OceanBackground />}
      {currentBg === 'CITY' && <CityBackground />}
      
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2 text-sky-600 shrink-0">
              <div className="bg-gradient-to-br from-sky-400 to-indigo-500 p-2 rounded-lg text-white shadow-lg hidden sm:block">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bungee tracking-wide leading-none bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 drop-shadow-sm">
                  StudyWithMe
                </h1>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-sky-800/60 font-medium uppercase tracking-widest hidden sm:block">Diễn đàn học tập</span>
                   {isFirebaseReady ? (
                     <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-green-700 border border-green-200" title="Đã kết nối dữ liệu Online">
                       <Wifi size={10} />
                       ONLINE
                     </div>
                   ) : (
                     <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-500 border border-gray-200" title="Chế độ Offline (Chỉ lưu trên máy này)">
                       <WifiOff size={10} />
                       OFFLINE
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm câu hỏi, bài viết..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-sky-400 group-focus-within:text-sky-600" size={16} />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-sky-600 hover:bg-sky-100 rounded-full transition-colors relative"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-sky-100 overflow-hidden animate-fade-in-up">
                    <div className="p-3 border-b border-gray-100 bg-sky-50 font-bold text-sky-800 text-sm">
                      Thông báo
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-sky-50/50' : ''}`}>
                            <p className="text-sm text-gray-700">{notif.content}</p>
                            <span className="text-xs text-gray-400 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-sm">Không có thông báo mới</div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({...n, read: true})));
                          setShowNotifications(false);
                        }}
                        className="w-full py-2 text-center text-xs font-bold text-sky-600 hover:bg-sky-50"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                )}
              </div>

              {currentUser ? (
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 bg-sky-50 px-2 py-1 pr-4 rounded-full border-2 border-sky-100 hover:border-sky-300 hover:bg-sky-100 transition-all cursor-pointer group"
                >
                  <div className="relative">
                    {/* User Avatar with Frame (Header) */}
                    <div className="relative w-9 h-9">
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full border border-sky-200 group-hover:scale-105 transition-transform object-cover" />
                      {currentFrame && (
                        <div className={currentFrame.cssClass}></div>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[9px] font-bold text-yellow-900 w-4 h-4 flex items-center justify-center rounded-full border border-white z-20">
                      {Math.min(currentUser.level || 1, 7)}
                    </div>
                  </div>
                  <div className="flex flex-col items-start hidden sm:flex">
                    <span className="text-sm font-bold text-sky-800 truncate max-w-[100px] leading-tight">{currentUser.name}</span>
                    <span className="text-[9px] text-sky-500 font-bold uppercase">XP: {currentUser.xp || 0}</span>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-full font-bold shadow-md shadow-indigo-200 transition-all text-sm font-bungee"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable Menu Container with Buttons */}
          <div className="relative group px-4 pb-2">
            <button 
              onClick={() => handleScrollMenu('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-1 rounded-full shadow-md border border-sky-100 text-sky-600 hover:bg-sky-50"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div 
              ref={menuScrollRef}
              className="overflow-x-auto pb-2 -mx-4 px-8 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth"
            >
              <div className="flex gap-2 min-w-max">
                {(Object.keys(SUBJECTS) as SubjectId[]).map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setActiveSubject(subj)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                      activeSubject === subj
                        ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200 scale-105'
                        : 'bg-white border-sky-100 text-gray-500 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50'
                    }`}
                  >
                    {SUBJECTS[subj]}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleScrollMenu('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 p-1 rounded-full shadow-md border border-sky-100 text-sky-600 hover:bg-sky-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-40 pb-12 px-4 max-w-4xl mx-auto">
        
        {/* Intro Banner for current subject (MODERATE TEXT SIZE) */}
        <div className="mb-8 text-center animate-fade-in-down flex justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border-4 border-sky-300 p-8 max-w-3xl w-full transform hover:scale-[1.01] transition-transform relative overflow-hidden group">
             {/* Decorative lines */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-300 via-indigo-300 to-sky-300"></div>
             <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-sky-300 via-indigo-300 to-sky-300"></div>
             <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-sky-300 via-indigo-300 to-sky-300"></div>
             <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-sky-300 via-indigo-300 to-sky-300"></div>
             
             <div className="relative z-10">
               <h2 className="text-2xl md:text-3xl font-bungee text-sky-800 tracking-wider drop-shadow-sm leading-tight">
                  GÓC HỌC TẬP <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mt-2 inline-block">
                    {SUBJECTS[activeSubject].toUpperCase()}
                  </span>
               </h2>
               <div className="mt-4 flex justify-center">
                 <span className="px-6 py-2 bg-sky-100/50 rounded-full text-sky-800 font-bold uppercase tracking-widest text-sm border border-sky-200">
                    Trao đổi kiến thức & Kinh nghiệm
                 </span>
               </div>
             </div>
             
             {/* Subtle pattern background */}
             <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>
        </div>

        {/* Compose Area */}
        <div className="mb-8 sticky top-[160px] z-30">
          <ComposePost 
            onSubmit={handleNewPost} 
            placeholder={`Đặt câu hỏi môn ${SUBJECTS[activeSubject]}...`}
            userAvatar={currentUser?.avatar}
          />
        </div>

        {/* Filter / Sort Bar with Background for Contrast */}
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-sky-100">
           <div className="flex items-center gap-2 text-sky-800 text-sm font-bold">
             <Filter size={16} />
             <span>Lọc bài viết:</span>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setSortBy('newest')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-bold transition-colors ${sortBy === 'newest' ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Clock size={14} /> Mới nhất
              </button>
              <button 
                onClick={() => setSortBy('popular')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-bold transition-colors ${sortBy === 'popular' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Flame size={14} /> Phổ biến
              </button>
           </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {displayedPosts.length > 0 ? (
            displayedPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike}
                onReply={handleReply}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-sky-200">
              <Cloud size={64} className="mx-auto mb-4 text-sky-300" />
              <p className="text-sky-800 font-medium text-lg font-bungee">
                {searchQuery ? 'Không tìm thấy kết quả nào' : 'Chưa có bài thảo luận nào'}
              </p>
              <p className="text-sky-600/70 text-sm">
                {searchQuery ? 'Hãy thử từ khóa khác xem sao' : `Hãy là người đầu tiên đặt câu hỏi môn ${SUBJECTS[activeSubject]}!`}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredPosts.length > POSTS_PER_PAGE && (
          <div className="flex justify-center items-center gap-4 mt-8 bg-white/60 p-2 rounded-full backdrop-blur-sm inline-flex mx-auto w-full max-w-xs">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full bg-white shadow border border-sky-100 disabled:opacity-50 hover:bg-sky-50 text-sky-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-sky-800 font-pixel">
              Trang {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full bg-white shadow border border-sky-100 disabled:opacity-50 hover:bg-sky-50 text-sky-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>

      {/* Level Up Modal */}
      {showLevelUp && newLevelData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative text-center animate-pop-in">
             <div className="absolute inset-0 bg-yellow-400/20 blur-[100px] rounded-full"></div>
             
             {/* Spinning Rays */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-30 animate-spin-slow pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-300">
                   <path d="M50 50 L50 0 L55 50 Z" />
                   <path d="M50 50 L100 50 L50 55 Z" />
                   <path d="M50 50 L50 100 L45 50 Z" />
                   <path d="M50 50 L0 50 L50 45 Z" />
                   <path d="M50 50 L85 15 L50 50 Z" />
                   <path d="M50 50 L85 85 L50 50 Z" />
                   <path d="M50 50 L15 85 L50 50 Z" />
                   <path d="M50 50 L15 15 L50 50 Z" />
                </svg>
             </div>

             <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 p-10 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] max-w-sm mx-4">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                   <Trophy size={80} className="text-yellow-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-bounce" />
                </div>
                
                <h2 className="text-4xl font-bungee text-white mt-8 mb-2 drop-shadow-md tracking-wider">LÊN CẤP!</h2>
                <div className="text-6xl font-black text-yellow-300 mb-4 font-header drop-shadow-[0_2px_0_rgba(161,98,7,1)]">
                   {newLevelData}
                </div>
                
                <div className="space-y-2 mb-8">
                   <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Danh hiệu mới</p>
                   <p className="text-2xl font-bold text-white font-header">{getLevelTitle(newLevelData)}</p>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => {
                        setShowLevelUp(false);
                        setShowProfile(true); // Open profile to flex
                     }}
                     className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 px-6 py-3 rounded-xl font-black shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                   >
                     <Sparkles size={20} />
                     KHOE NGAY
                   </button>
                   <button 
                     onClick={() => setShowLevelUp(false)}
                     className="text-white/60 hover:text-white font-bold text-sm"
                   >
                     Đóng
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showLogin && (
        <LoginModal 
          onLogin={handleLogin} 
          onClose={() => setShowLogin(false)} 
        />
      )}

      {showProfile && currentUser && (
        <UserProfileModal
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Global Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;