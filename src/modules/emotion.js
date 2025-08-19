class EmotionAnalyzer {
    constructor() {
        // Simulated KoBERT emotion classification
        this.emotionLabels = ['depression', 'anxiety', 'despair', 'anger', 'neutrality'];
        
        // Korean emotion keywords for simple analysis
        this.emotionKeywords = {
            depression: ['힘들다', '우울', '절망', '무기력', '피곤', '지치다', '싫다', '미치겠다'],
            anxiety: ['불안', '걱정', '긴장', '스트레스', '짜증', '화나다', '분하다'],
            despair: ['포기', '끝', '더이상', '안되겠다', '그만', '죽고싶다'],
            anger: ['화나다', '짜증', '열받다', '빡치다', '개빡치다', '미치겠다'],
            neutrality: ['그냥', '보통', '평범', '괜찮다', '좋다', '행복']
        };
    }

    async analyze(preprocessed) {
        const { normalized, original } = preprocessed;
        
        // Simple keyword-based emotion analysis (in real implementation, use KoBERT)
        const emotionScores = this.analyzeEmotions(normalized);
        const dominantEmotion = this.getDominantEmotion(emotionScores);
        const compositeScore = this.calculateCompositeScore(emotionScores);
        
        return {
            score: compositeScore,
            emotions: emotionScores,
            dominantEmotion: dominantEmotion,
            breakdown: {
                depression: emotionScores.depression,
                anxiety: emotionScores.anxiety,
                despair: emotionScores.despair,
                anger: emotionScores.anger,
                neutrality: emotionScores.neutrality
            }
        };
    }

    analyzeEmotions(text) {
        console.log(`[Emotion Debug] Analyzing text for emotions: "${text}"`);
        
        const scores = {
            depression: 0,
            anxiety: 0,
            despair: 0,
            anger: 0,
            neutrality: 0
        };

        // Count emotion keywords
        Object.keys(this.emotionKeywords).forEach(emotion => {
            this.emotionKeywords[emotion].forEach(keyword => {
                const regex = new RegExp(keyword, 'g');
                const matches = text.match(regex);
                if (matches) {
                    scores[emotion] += matches.length * 10;
                    console.log(`😢 Emotion detected: ${emotion} - "${keyword}" (${matches.length} times)`);
                }
            });
        });

        // Normalize scores to 0-100 range
        const maxScore = Math.max(...Object.values(scores));
        if (maxScore > 0) {
            Object.keys(scores).forEach(emotion => {
                scores[emotion] = Math.min(100, (scores[emotion] / maxScore) * 100);
            });
        }

        return scores;
    }

    getDominantEmotion(emotionScores) {
        let maxScore = 0;
        let dominantEmotion = 'neutrality';

        Object.keys(emotionScores).forEach(emotion => {
            if (emotionScores[emotion] > maxScore) {
                maxScore = emotionScores[emotion];
                dominantEmotion = emotion;
            }
        });

        return dominantEmotion;
    }

    calculateCompositeScore(emotionScores) {
        // Calculate composite negative emotion score (0-100)
        const negativeEmotions = emotionScores.depression + 
                                emotionScores.anxiety + 
                                emotionScores.despair + 
                                emotionScores.anger;
        
        // Normalize to 0-100 range
        return Math.min(100, negativeEmotions / 4);
    }
}

module.exports = { EmotionAnalyzer };
