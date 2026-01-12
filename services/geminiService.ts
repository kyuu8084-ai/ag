import { GoogleGenAI } from "@google/genai";
import { Attachment, AttachmentType, SubjectId, SUBJECTS } from '../types';

const getBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateAiReply = async (postContent: string, attachments: Attachment[], subject: SubjectId): Promise<string> => {
  // Use process.env.API_KEY as per coding guidelines
  // The API key is assumed to be pre-configured and available.
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const subjectName = SUBJECTS[subject];
    
    // Prepare contents
    const prompt = `Bạn là một trợ giảng AI nhiệt tình, thông thái tại diễn đàn học tập 'StudyWithMe'. 
    Người dùng đang hỏi về môn: ${subjectName}.
    Hãy trả lời bài viết sau đây một cách chính xác về mặt kiến thức, ngắn gọn (dưới 100 từ), dễ hiểu và khích lệ tinh thần học tập.
    Nếu là câu hỏi bài tập, hãy đưa ra gợi ý giải quyết thay vì giải chi tiết ngay lập tức.
    Bài viết: "${postContent}"`;

    const parts: any[] = [{ text: prompt }];

    // Add images if present
    for (const att of attachments) {
      if (att.type === AttachmentType.IMAGE) {
        const base64Data = await getBase64(att.url);
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: base64Data
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Mạng đang chập chờn, mình chưa tải được kiến thức về!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Máy chủ AI đang quá tải bài tập, vui lòng thử lại sau!";
  }
};