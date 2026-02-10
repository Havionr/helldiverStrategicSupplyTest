import React, { useState, useEffect, useRef } from 'react';
import { GameStats } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  stats: GameStats;
  isOpen: boolean;
  onClose: () => void;
}

interface EvaluationResult {
  grade: string;
  title: string;
  comment: string;
  isOffline?: boolean;
}

export const GeminiEvaluation: React.FC<Props> = ({ stats, isOpen, onClose }) => {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  // Use a ref to track if an evaluation is currently in progress to prevent double-firing
  const processingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (stats.endTime && !result && !processingRef.current) {
        // Start evaluation
        processingRef.current = true;
        
        // Check for API key presence/placeholder
        if (!process.env.API_KEY || process.env.API_KEY.includes('YOUR_API_KEY')) {
          generateLocalEvaluation();
        } else {
          generateAiEvaluation();
        }
      }
    } else {
      // Reset when closed
      setResult(null);
      setLoading(false);
      processingRef.current = false;
    }
  // We need to react to stats.endTime updates because PracticeArea updates stats AFTER App opens the modal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, stats.endTime]);

  // Local fallback logic
  const generateLocalEvaluation = () => {
      setLoading(true);

      const durationSeconds = (stats.endTime! - stats.startTime!) / 1000;
      const wpm = Math.round((stats.completedStratagems / (durationSeconds / 60)) || 0);
      const fails = stats.failedStratagems;

      let grade = 'B';
      let title = '合格潜兵';
      let comment = '表现尚可。但要记住，只有最优秀的潜兵才能从战场归来。继续训练。';

      if (fails > 5) {
          grade = 'F';
          title = '机器间谍';
          comment = '太可怕了。你的手指是被自动机器人黑入了吗？建议立即向真理部自首。';
      } else if (wpm > 50 && fails < 1) {
          grade = 'S';
          title = '绝地战神';
          comment = '难以置信的速度！哪怕是布拉什将军本人也会对这种民主输出效率感到欣慰。你是超级地球的骄傲！';
      } else if (wpm > 35 && fails < 3) {
          grade = 'A';
          title = '超级公民';
          comment = '干得漂亮，潜兵！这种精准度足以让虫族感到恐惧。保持这种状态，胜利属于我们！';
      } else if (wpm <= 10) {
          grade = 'D';
          title = '平民';
          comment = '太慢了！等你怎么输完指令，虫子已经把你吃得只剩骨头了。加快速度！';
      } else if (wpm > 10) {
          grade = 'C';
          title = '新兵蛋子';
          comment = '勉强及格。在真正的战场上，犹豫就会败北。你需要更多的练习。';
      }

      // Add slight delay to simulate calculation/transmission
      setTimeout(() => {
        setResult({
            grade,
            title,
            comment,
            isOffline: true
        });
        setLoading(false);
        processingRef.current = false;
      }, 1500);
  };

  const generateAiEvaluation = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const durationSeconds = (stats.endTime! - stats.startTime!) / 1000;
      const wpm = Math.round((stats.completedStratagems / (durationSeconds / 60)) || 0);
      
      const prompt = `
        你扮演《绝地潜兵2》(Helldivers 2) 中的 "布拉什将军" (General Brasch)。
        你需要根据一名绝地潜兵的战略配备输入训练数据，给出评估报告。

        训练数据:
        - 总用时: ${durationSeconds.toFixed(1)} 秒
        - 完成指令数: ${stats.completedStratagems}
        - 输入失误数: ${stats.failedStratagems}
        - 效率 (指令/分钟): ${wpm}

        评分标准参考:
        - S级: 效率 > 50 且 失误 < 1 (绝地战神)
        - A级: 效率 > 35 且 失误 < 3 (超级公民)
        - B级: 效率 > 20 (合格潜兵)
        - C级: 效率 > 10 (需要更多训练)
        - D级: 效率 <= 10 (毫无民主信念)
        - F级: 失误 > 5 (甚至不如机器人间谍)

        请生成一个 JSON 对象，包含以下字段：
        1. grade: 评级 (S, A, B, C, D, F)
        2. title: 授予该潜兵的本次训练头衔 (例如："光速手指", "民主之盾", "甚至是机器人", "补给毁灭者", "善良的平民" 等，要符合赫尔潜兵风格，简短有力，中文)
        3. comment: 布拉什将军的评语。
           - 风格：激昂、军国主义、爱国、超级地球至上。
           - 如果成绩好：极力赞扬，使用"自由"、"民主"、"管理式民主"等词汇。
           - 如果成绩差：严厉斥责，质疑其忠诚度，建议送去"自由营"再教育，或者嘲讽其手指被虫子吃掉了。
           - 字数控制在 80 字以内。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              grade: { type: Type.STRING },
              title: { type: Type.STRING },
              comment: { type: Type.STRING },
            },
            required: ['grade', 'title', 'comment'],
          }
        }
      });

      const jsonText = response.text;
      if (jsonText) {
          // Clean markdown formatting if present
          const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
          setResult(JSON.parse(cleanJson));
          setLoading(false); // Success path only
          processingRef.current = false;
      } else {
          throw new Error("No response text");
      }

    } catch (error) {
      console.error("AI Evaluation failed, switching to local:", error);
      // Fallback to local logic. 
      generateLocalEvaluation();
    }
  };

  if (!isOpen) return null;

  // Grade color helper
  const getGradeColor = (g: string) => {
      if (g.includes('S') || g.includes('A')) return 'text-yellow-400';
      if (g.includes('B')) return 'text-blue-400';
      if (g.includes('F') || g.includes('D')) return 'text-red-500';
      return 'text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl border-4 border-yellow-500 bg-[#1a1a1a] shadow-[0_0_50px_rgba(255,230,0,0.3)] p-8 relative flex flex-col items-center text-center">
        
        {/* Header Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4 border border-yellow-500">
             <span className="text-yellow-400 font-black text-xl tracking-[0.2em] uppercase">Super Earth Command</span>
        </div>

        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wider mt-4">
          训练评估报告
        </h2>
        
        {loading || (!result && stats.endTime) ? (
             <div className="flex flex-col items-center py-12 space-y-4">
               <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-yellow-400 animate-pulse font-mono">
                  {process.env.API_KEY && !process.env.API_KEY.includes('YOUR_API_KEY') 
                    ? "正在接收布拉什将军的加密传输..." 
                    : "正在计算本地模拟数据..."}
               </p>
             </div>
        ) : result ? (
             <div className="w-full animate-in zoom-in-50 duration-300">
                {/* Offline Badge */}
                {result.isOffline && (
                    <div className="mb-4">
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-500 uppercase">
                            Offline Simulation Mode
                        </span>
                    </div>
                )}

                {/* Grade and Title */}
                <div className="mb-8 relative border-b-2 border-dashed border-gray-700 pb-8">
                     <div className={`text-[8rem] leading-none font-black ${getGradeColor(result.grade)} drop-shadow-[0_0_15px_rgba(255,230,0,0.5)]`}>
                         {result.grade}
                     </div>
                     <div className="text-2xl font-bold text-white uppercase tracking-widest mt-2 bg-white/10 inline-block px-4 py-1 rounded">
                         {result.title}
                     </div>
                </div>

                {/* The General's Quote */}
                <div className="bg-black/50 border-l-4 border-yellow-500 p-6 text-left mb-8 relative">
                    <span className="absolute -top-3 left-4 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 uppercase">
                        {result.isOffline ? "Automated Assessment System" : "General Brasch"}
                    </span>
                    <p className="text-yellow-100 font-mono text-lg leading-relaxed italic">
                        "{result.comment}"
                    </p>
                </div>

                {/* Stats Summary Small */}
                <div className="grid grid-cols-4 gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider mb-6 border-t border-gray-800 pt-4">
                    <div>
                        <div className="text-gray-600">Time</div>
                        <div className="text-white">{((stats.endTime! - stats.startTime!) / 1000).toFixed(1)}s</div>
                    </div>
                    <div>
                        <div className="text-gray-600">Completed</div>
                        <div className="text-white">{stats.completedStratagems}</div>
                    </div>
                    <div>
                        <div className="text-gray-600">Errors</div>
                        <div className="text-white">{stats.failedStratagems}</div>
                    </div>
                    <div>
                        <div className="text-gray-600">SPM</div>
                        <div className="text-white">{Math.round((stats.completedStratagems / ((stats.endTime! - stats.startTime!) / 60000)) || 0)}</div>
                    </div>
                </div>

                {/* Action */}
                <button 
                    onClick={onClose}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xl py-4 uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-400/20"
                >
                    为了超级地球！
                </button>
             </div>
        ) : (
            /* Fallback state if somehow we are open but no stats/loading yet */
            <div className="py-12 text-gray-500 animate-pulse">等待数据同步...</div>
        )}
      </div>
    </div>
  );
};
