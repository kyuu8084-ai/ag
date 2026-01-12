import React, { useState } from 'react';
import { Heart, MessageCircle, Play, Pause, Bot } from 'lucide-react';
import { Post, Attachment, AttachmentType, FRAMES } from '../types';
import { ComposePost } from './ComposePost';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onReply: (postId: string, content: string, attachments: Attachment[]) => void;
}

const AudioPlayer = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play();
      setPlaying(!playing);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-sky-50 p-2 rounded-lg border border-sky-100 max-w-xs">
      <button onClick={toggle} className="w-8 h-8 flex items-center justify-center bg-sky-500 rounded-full text-white hover:bg-sky-600">
        {playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="h-1 flex-1 bg-sky-200 rounded-full overflow-hidden">
        <div className={`h-full bg-sky-500 ${playing ? 'animate-[width_2s_linear_infinite]' : 'w-0'}`} />
      </div>
      <audio 
        ref={audioRef} 
        src={url} 
        onEnded={() => setPlaying(false)} 
        className="hidden" 
      />
    </div>
  );
};

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onReply }) => {
  const [showReply, setShowReply] = useState(false);
  
  const authorFrame = post.frameId ? FRAMES.find(f => f.id === post.frameId) : null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-sky-100 overflow-hidden mb-6 transition-transform hover:scale-[1.01] duration-300">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
             <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full border border-sky-300 bg-white object-cover" />
             {authorFrame && <div className={authorFrame.cssClass} style={{ inset: '-3px' }}></div>}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-tight">{post.author}</h3>
            <span className="text-xs text-sky-500 font-medium">
              {new Date(post.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4 text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>

        {/* Attachments */}
        {post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.attachments.map(att => (
              <div key={att.id} className="rounded-lg overflow-hidden border border-gray-200">
                {att.type === AttachmentType.IMAGE ? (
                  <img src={att.url} alt="Attachment" className="max-h-64 object-cover" />
                ) : (
                  <AudioPlayer url={att.url} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
          <button 
            onClick={() => onLike(post.id)}
            className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group"
          >
            <Heart 
              size={20} 
              className={`transition-transform group-active:scale-125 ${post.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} 
            />
            <span className="font-semibold">{post.likes || ''}</span>
          </button>
          
          <button 
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-2 text-gray-500 hover:text-sky-600 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-semibold">Trả lời</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {(post.comments.length > 0 || showReply) && (
        <div className="bg-sky-50/50 p-4 border-t border-sky-100">
          {post.comments.map(comment => {
            const commentFrame = comment.frameId ? FRAMES.find(f => f.id === comment.frameId) : null;
            return (
            <div key={comment.id} className={`flex gap-3 mb-4 last:mb-0 ${comment.isAi ? 'bg-indigo-50/80 p-3 rounded-xl border border-indigo-100' : ''}`}>
               {comment.isAi ? (
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                   <Bot size={16} className="text-white" />
                 </div>
               ) : (
                 <div className="relative shrink-0">
                    <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full border border-gray-200 bg-white object-cover" />
                    {commentFrame && <div className={commentFrame.cssClass} style={{ inset: '-2px' }}></div>}
                 </div>
               )}
               <div className="flex-1 min-w-0">
                 <div className="flex items-baseline gap-2 mb-1">
                   <span className={`font-bold text-sm ${comment.isAi ? 'text-indigo-700 font-pixel' : 'text-gray-800'}`}>
                     {comment.author}
                   </span>
                   <span className="text-[10px] text-gray-400">
                      {new Date(comment.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                   </span>
                 </div>
                 <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                 {comment.attachments.map(att => (
                   <div key={att.id} className="mt-2">
                      {att.type === AttachmentType.IMAGE ? (
                        <img src={att.url} alt="Reply Image" className="h-32 rounded-lg border border-gray-200" />
                      ) : (
                        <AudioPlayer url={att.url} />
                      )}
                   </div>
                 ))}
               </div>
            </div>
            );
          })}

          {showReply && (
            <div className="mt-4 animate-fade-in-up">
              <ComposePost 
                placeholder="Viết câu trả lời của bạn..." 
                onSubmit={(content, atts) => {
                  onReply(post.id, content, atts);
                  setShowReply(false);
                }} 
                compact
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};