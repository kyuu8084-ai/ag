import React, { useState, useRef } from 'react';
import { X, Edit2, Award, Book, Star, Crown, Zap, Flame, Trophy, PlusCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { User, FRAMES } from '../types';

interface UserProfileModalProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onClose: () => void;
}

const LEVEL_THRESHOLDS = [0, 300, 500, 1000, 2000, 4000, 7000, 10000];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onUpdateUser, onClose }) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user.bio || '');
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const currentLevel = user.level || 1;
  const currentXP = user.xp || 0;
  
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || 10000;
  const prevLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const progressPercent = Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  const handleSaveBio = () => {
    onUpdateUser({ bio: bioInput });
    setIsEditingBio(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      onUpdateUser({ avatar: url });
    }
  };

  const handleShowcaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const currentShowcase = user.showcase || [];
      if (currentShowcase.length < 4) {
        onUpdateUser({ showcase: [...currentShowcase, url] });
      }
    }
  };

  const handleFlexBadge = () => {
    const badgeImage = `https://api.dicebear.com/7.x/initials/svg?seed=${user.level}&backgroundColor=ffdfbf&scale=75&chars=L${user.level}`;
    const currentShowcase = user.showcase || [];
    if (currentShowcase.length < 4) {
       onUpdateUser({ showcase: [...currentShowcase, badgeImage] });
    }
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1: return { name: "Mầm Non Tri Thức", color: "text-sky-600", bg: "bg-sky-200", icon: Book, effect: "" };
      case 2: return { name: "Chồi Non Hiếu Học", color: "text-green-600", bg: "bg-green-200", icon: Star, effect: "" };
      case 3: return { name: "Cây Xanh Vững Chãi", color: "text-blue-600", bg: "bg-blue-200", icon: Award, effect: "badge-level-3" };
      case 4: return { name: "Đại Thụ Thông Thái", color: "text-purple-600", bg: "bg-purple-200", icon: Zap, effect: "badge-level-3" };
      case 5: return { name: "Học Giả Uyên Bác", color: "text-yellow-600", bg: "bg-yellow-200", icon: Crown, effect: "badge-level-5" };
      case 6: return { name: "Hiền Triết Lỗi Lạc", color: "text-orange-600", bg: "bg-orange-200", icon: Flame, effect: "badge-level-6" };
      case 7: return { name: "Thần Đồng Đất Việt", color: "text-red-600", bg: "bg-red-200", icon: Trophy, effect: "badge-level-7" };
      default: return { name: "Siêu Phàm Nhập Thánh", color: "text-red-600", bg: "bg-red-200", icon: Trophy, effect: "badge-level-7" };
    }
  };

  const lvlInfo = getLevelInfo(currentLevel);
  const Icon = lvlInfo.icon;
  const currentFrame = FRAMES.find(f => f.id === user.frameId);

  return (
    // Outer overlay is now scrollable for mobile (overflow-y-auto) and items-start to prevent cutting off top on simple overflow
    <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto items-start">
      {/* Container: Removed fixed minHeight, added my-8 for scroll margin, flex-col on mobile */}
      <div className="relative w-full max-w-4xl bg-[#F4F1E8] rounded-xl shadow-2xl flex flex-col md:flex-row border-4 border-[#DCD6C7] my-8 md:my-0">
        
        {/* Close Button - Fixed position relative to container is tricky on scroll, making it absolute top right */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-50 text-gray-500 hover:text-red-500 bg-white/80 p-2 rounded-full shadow-md transition-all hover:scale-110"
        >
          <X size={24} />
        </button>

        {/* Left Page (Main Info) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 border-b-2 md:border-b-0 md:border-r-2 border-[#DCD6C7] flex flex-col items-center relative">
            <div className="absolute top-4 left-6 text-gray-400 font-pixel text-xs">ID: {user.id.slice(0, 8)}</div>
            
            {/* Avatar Section */}
            <div className="mt-8 mb-4 relative group">
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-white p-1 shadow-inner cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                 <img src={user.avatar} alt="Avatar" className="frame-content rounded-full transition-transform group-hover:scale-95" />
                 
                 {/* Avatar Change Overlay */}
                 <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Camera className="text-white" size={32} />
                 </div>

                 {/* CSS Frame Overlay */}
                 {currentFrame && <div className={currentFrame.cssClass}></div>}
              </div>

              <div className="absolute -bottom-2 -right-2 bg-[#F6F1E3] p-2 rounded-full border border-[#DCD6C7] z-30">
                 <span className="font-pixel font-bold text-[#495366] text-xs">Lv.{currentLevel}</span>
              </div>

              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
            
            <button 
              onClick={() => setShowFrameSelector(!showFrameSelector)}
              className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-100 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
            >
              <ImageIcon size={14} />
              Đổi Khung Avatar
            </button>

            {/* Frame Selector Dropdown */}
            {showFrameSelector && (
              <div className="absolute top-[280px] z-50 bg-white rounded-xl shadow-xl border-2 border-sky-200 p-3 w-64 grid grid-cols-3 gap-3 animate-fade-in-up">
                <div 
                  className={`aspect-square rounded-lg border-2 ${!user.frameId ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-sky-400'} flex items-center justify-center cursor-pointer`}
                  onClick={() => { onUpdateUser({ frameId: undefined }); setShowFrameSelector(false); }}
                >
                   <span className="text-xs font-bold text-gray-500">Mặc định</span>
                </div>
                {FRAMES.map(frame => (
                   <div 
                      key={frame.id}
                      className={`relative aspect-square rounded-lg border-2 ${user.frameId === frame.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-sky-400'} flex items-center justify-center cursor-pointer p-4`}
                      onClick={() => { onUpdateUser({ frameId: frame.id }); setShowFrameSelector(false); }}
                   >
                      <div className="w-full h-full rounded-full bg-gray-200 relative">
                         <div className={frame.cssClass} style={{ inset: '-5px' }}></div>
                      </div>
                   </div>
                ))}
              </div>
            )}

            {/* Name */}
            <h2 className="text-xl md:text-2xl font-bold text-[#495366] font-bungee mb-6 mt-4 break-words text-center">{user.name}</h2>

            {/* Stats Bars */}
            <div className="w-full space-y-3 px-2 md:px-4">
               <div className="flex items-center bg-[#EBE5D5] rounded-lg p-2 relative overflow-hidden">
                  <div className="w-20 md:w-24 font-bold text-[#7E8592] text-xs md:text-sm z-10 shrink-0">Kinh nghiệm</div>
                  <div className="flex-1 text-right font-bold text-[#495366] pr-2 z-10 text-[10px] md:text-xs truncate">
                    {currentXP} / {nextLevelXP} XP
                  </div>
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-[#A6D589] opacity-70 transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
               </div>
               <div className="flex items-center bg-[#EBE5D5] rounded-lg p-2 relative overflow-hidden">
                  <div className="w-20 md:w-24 font-bold text-[#7E8592] text-xs md:text-sm z-10 shrink-0">Danh Hiệu</div>
                  <div className={`flex-1 text-right font-bold pr-2 z-10 text-[10px] md:text-xs truncate ${lvlInfo.color}`}>
                     {lvlInfo.name}
                  </div>
               </div>
            </div>

            {/* Signature / Bio */}
            <div className="mt-8 w-full bg-[#EBE5D5] rounded-lg p-4 relative min-h-[80px] border border-[#DCD6C7]">
               {isEditingBio ? (
                 <div className="flex flex-col gap-2 h-full">
                    <textarea 
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full bg-white p-2 rounded text-sm text-[#495366] outline-none border border-[#C3B8A3] resize-none h-16"
                      placeholder="Nhập giới thiệu về bạn..."
                      maxLength={100}
                    />
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setIsEditingBio(false)} className="text-xs text-red-500 font-bold px-2 py-1">Hủy</button>
                       <button onClick={handleSaveBio} className="text-xs text-green-600 font-bold px-2 py-1 bg-white rounded border border-green-200">Lưu</button>
                    </div>
                 </div>
               ) : (
                 <>
                    <p className="text-[#6B7584] text-sm italic leading-relaxed text-center flex items-center justify-center h-full min-h-[40px]">
                      "{user.bio || 'Chưa đặt chữ ký'}"
                    </p>
                    <button 
                      onClick={() => { setBioInput(user.bio || ''); setIsEditingBio(true); }}
                      className="absolute bottom-2 right-2 text-[#7E8592] hover:text-[#495366]"
                    >
                      <Edit2 size={16} />
                    </button>
                 </>
               )}
            </div>
        </div>

        {/* Right Page (Achievements/Cards) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-[#F4F1E8] flex flex-col">
           <div className="flex items-center gap-2 mb-6 border-b-2 border-[#EBE5D5] pb-2">
              <Award className="text-[#D3BC8E]" size={24} />
              <h3 className="text-lg font-bold text-[#495366]">Huy Chương Học Tập</h3>
              <span className="ml-auto text-xl font-bold text-[#495366] font-pixel">Lv.{currentLevel}/7</span>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dynamic Badge based on level */}
              <div className={`bg-[#EBE5D5] p-3 rounded-lg flex items-center gap-3 transition-transform hover:scale-105 border border-transparent hover:border-[#D3BC8E] relative group`}>
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border-2 border-white ${lvlInfo.bg} ${lvlInfo.effect}`}>
                    <Icon size={24} className={lvlInfo.color} />
                </div>
                <div>
                    <div className="text-xs text-[#7E8592] font-bold">Danh hiệu</div>
                    <div className={`text-sm font-bold ${lvlInfo.color} truncate max-w-[100px]`}>{lvlInfo.name}</div>
                </div>
                
                {/* Flex Button */}
                <button 
                  onClick={handleFlexBadge}
                  className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Treo lên góc học tập"
                >
                  Treo Badge
                </button>
              </div>

              {/* Static Badge */}
              <div className="bg-[#EBE5D5] p-3 rounded-lg flex items-center gap-3">
                 <div className="w-12 h-12 shrink-0 bg-indigo-200 rounded-full flex items-center justify-center border-2 border-white">
                    <Star size={20} className="text-indigo-600" />
                 </div>
                 <div>
                    <div className="text-xs text-[#7E8592] font-bold">Chuyên cần</div>
                    <div className="text-sm text-[#495366] font-bold">Tích Cực</div>
                 </div>
              </div>
           </div>

           <div className="mt-8 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-[#EBE5D5] pb-2">
                  <div className="w-6 h-6 rounded bg-[#495366] text-[#F4F1E8] flex items-center justify-center font-bold text-xs">C</div>
                  <h3 className="text-lg font-bold text-[#495366]">Chứng Nhận Siêu Cấp</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {/* Render uploaded showcase images */}
                 {user.showcase?.map((img, idx) => (
                   <div key={idx} className="aspect-[3/4] bg-white rounded-lg relative overflow-hidden border-2 border-[#DCD6C7] shadow-sm group">
                      <img src={img} alt="Showcase" className="w-full h-full object-cover" />
                   </div>
                 ))}

                 {/* Upload Button Placeholder (if less than 4 items) */}
                 {(!user.showcase || user.showcase.length < 4) && (
                   <div 
                      className="aspect-[3/4] bg-[#E0D8C3] rounded-lg relative group cursor-pointer overflow-hidden border-2 border-[#DCD6C7] hover:border-[#D3BC8E] transition-colors"
                      onClick={() => showcaseInputRef.current?.click()}
                   >
                      <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] group-hover:bg-[#D3BC8E] group-hover:text-white transition-colors">
                        <PlusCircle size={24} />
                      </div>
                   </div>
                 )}
                 <input 
                   type="file" 
                   ref={showcaseInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handleShowcaseUpload} 
                 />
              </div>
              
              <div className="mt-auto pt-4 flex justify-end">
                  <div className="px-4 py-1 bg-[#D3BC8E] text-white rounded-full text-xs font-bold shadow-md uppercase tracking-wider">
                     Bộ sưu tập
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};