import { GoogleGenAI } from "@google/genai";
import { Attachment, AttachmentType, SubjectId, SUBJECTS } from '../types';

const getBase64 = async (url: string): Promise<string> => {
  // If it's already a base64 string (data:image...), return the data part
  if (url.startsWith('data:')) {
    const parts = url.split(',');
    return parts.length > 1 ? parts[1] : "";
  }

  // If it's a blob url
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (base64String) {
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        } else {
            resolve("");
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error converting image for AI:", e);
    return "";
  }
};

export const generateAiReply = async (postContent: string, attachments: Attachment[], subject: SubjectId): Promise<string> => {
  try {
    // Check API Key existence
    if (!process.env.API_KEY) {
      console.warn("Missing API_KEY");
      return "Tutor AI đang bảo trì (Thiếu khóa API).";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const subjectName = SUBJECTS[subject];
    
    // Prepare contents with explicit typing
    const prompt = `Bạn là một trợ giảng AI nhiệt tình tại diễn đàn 'StudyWithMe'. 
    Môn học: ${subjectName}.
    Yêu cầu: Trả lời ngắn gọn (dưới 80 từ), đúng trọng tâm, giọng văn thân thiện, khích lệ.
    Câu hỏi của học sinh: "${postContent}"`;

    // Define parts array explicitly compatible with Gemini SDK
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }];

    // Add images if present
    for (const att of attachments) {
      if (att.type === AttachmentType.IMAGE && att.url) {
        const base64Data = await getBase64(att.url);
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType || 'image/jpeg',
              data: base64Data
            }
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts as any }, // Cast to any to avoid strict SDK type mismatches in build
      config: {
        maxOutputTokens: 200,
        temperature: 0.7
      }
    });

    return response.text || "Hmm, câu này khó quá, để mình suy nghĩ thêm chút nhé!";
  } catch (error: unknown) {
    console.error("Gemini API Detailed Error:", error);
    
    // Type guard for error object
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const err = error as { message: string };
        if (err.message.includes('429')) {
            return "AI đang quá tải do nhiều bạn hỏi quá, vui lòng đợi 1 phút nhé!";
        }
    }
    
    return "Tutor AI đang nghỉ giải lao, bạn thử lại sau nha!";
  }
};