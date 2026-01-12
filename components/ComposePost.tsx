import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Mic, Camera, Send, X, User as UserIcon } from 'lucide-react';
import { Attachment, AttachmentType } from '../types';
import { CameraCapture } from './CameraCapture';
import { AudioRecorder } from './AudioRecorder';

interface ComposePostProps {
  onSubmit: (content: string, attachments: Attachment[]) => void;
  placeholder?: string;
  compact?: boolean;
  userAvatar?: string;
}

export const ComposePost: React.FC<ComposePostProps> = ({ onSubmit, placeholder = "Bạn đang nghĩ gì?", compact = false, userAvatar }) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;
    onSubmit(content, attachments);
    setContent("");
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        id: Math.random().toString(36),
        type: AttachmentType.IMAGE,
        url,
        mimeType: file.type
      }]);
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAttachments(prev => [...prev, {
      id: Math.random().toString(36),
      type: AttachmentType.IMAGE,
      url,
      mimeType: 'image/jpeg'
    }]);
  };

  const handleAudioCapture = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setAttachments(prev => [...prev, {
      id: Math.random().toString(36),
      type: AttachmentType.AUDIO,
      url,
      mimeType: blob.type
    }]);
    setIsRecording(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={`${compact ? 'bg-white rounded-xl' : 'bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-sky-200'} p-4 transition-all duration-300`}>
        {!compact && (
          <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 font-pixel text-sky-600 text-lg">Tạo bài viết mới</span>
          </div>
        )}
        
        <div className="flex gap-4">
           {!compact && (
             <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden hidden md:block shrink-0">
               {userAvatar ? (
                 <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                   <UserIcon className="text-gray-400" size={24} />
                 </div>
               )}
             </div>
           )}
           <div className="flex-1">
             <textarea
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder={placeholder}
               className="w-full bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 min-h-[60px]"
               rows={compact ? 1 : 3}
             />
             
             {/* Attachment Previews */}
             {attachments.length > 0 && (
               <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                 {attachments.map(att => (
                   <div key={att.id} className="relative group shrink-0">
                     {att.type === AttachmentType.IMAGE ? (
                       <img src={att.url} alt="Preview" className="h-20 rounded-lg border border-gray-200" />
                     ) : (
                       <div className="h-20 w-32 bg-sky-100 rounded-lg flex items-center justify-center border border-sky-200">
                         <Mic size={24} className="text-sky-500" />
                       </div>
                     )}
                     <button
                       type="button"
                       onClick={() => removeAttachment(att.id)}
                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                     >
                       <X size={12} />
                     </button>
                   </div>
                 ))}
               </div>
             )}

             {isRecording && (
               <div className="mb-3">
                 <AudioRecorder onRecordingComplete={handleAudioCapture} onCancel={() => setIsRecording(false)} />
               </div>
             )}

             <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
               <div className="flex items-center gap-1">
                 <input 
                   type="file" 
                   accept="image/*" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={handleFileSelect} 
                 />
                 
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors tooltip"
                   title="Thêm ảnh"
                 >
                   <ImageIcon size={20} />
                 </button>
                 
                 <button 
                   type="button"
                   onClick={() => setIsCameraOpen(true)}
                   className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                   title="Chụp ảnh ngay"
                 >
                   <Camera size={20} />
                 </button>

                 <button 
                   type="button"
                   onClick={() => setIsRecording(!isRecording)}
                   className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-50' : 'text-sky-500 hover:bg-sky-50'}`}
                   title="Ghi âm giọng nói"
                 >
                   <Mic size={20} />
                 </button>
               </div>

               <button
                 type="submit"
                 disabled={!content.trim() && attachments.length === 0}
                 className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-sky-200 transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
               >
                 <span className="hidden md:inline">Đăng</span>
                 <Send size={18} />
               </button>
             </div>
           </div>
        </div>
      </form>

      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
    </>
  );
};