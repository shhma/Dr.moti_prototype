const axios = require('axios');

class RealLLMAnalyzer {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4'; // or 'gpt-3.5-turbo' for cost efficiency
        
        // System prompt for drug slang detection
        this.systemPrompt = `당신은 한국어 텍스트에서 마약 관련 은어와 위험한 패턴을 탐지하는 전문 AI입니다.

다음 기준으로 분석해주세요:
1. 이모지와 텍스트의 조합이 마약 거래를 암시하는지
2. 감정적 취약성을 이용한 타겟팅이 있는지
3. 새로운 은어나 패턴이 사용되었는지
4. 거래 의도가 명확한지

JSON 형태로 응답해주세요:
{
  "risk_score": 0-100,
  "risk_level": "low|medium|high",
  "flags": ["flag1", "flag2"],
  "reason": "분석 근거",
  "confidence": 0.0-1.0,
  "detected_patterns": ["패턴1", "패턴2"]
}`;
    }

    async analyze(preprocessed) {
        const { normalized, emojis, original } = preprocessed;
        
        // Check if LLM analysis should be triggered
        const shouldTrigger = this.shouldTriggerAnalysis(preprocessed);
        
        if (!shouldTrigger) {
            return {
                score: 0,
                used: false,
                reason: 'LLM analysis not triggered',
                flags: []
            };
        }

        try {
            // Call OpenAI API
            const analysis = await this.callOpenAI(original, emojis);
            return {
                score: analysis.risk_score,
                used: true,
                reason: analysis.reason,
                flags: analysis.flags || [],
                confidence: analysis.confidence || 0.5,
                detectedPatterns: analysis.detected_patterns || []
            };
        } catch (error) {
            console.error('LLM API Error:', error);
            return {
                score: 0,
                used: false,
                reason: 'LLM API 호출 실패',
                flags: [],
                error: error.message
            };
        }
    }

    async callOpenAI(text, emojis) {
        const userPrompt = `다음 텍스트를 분석해주세요:

텍스트: "${text}"
이모지: ${emojis.map(e => e.emoji).join(', ')}

위험도를 평가하고 JSON으로 응답해주세요.`;

        const response = await axios.post(this.baseURL, {
            model: this.model,
            messages: [
                { role: 'system', content: this.systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1, // 낮은 temperature로 일관성 확보
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        
        try {
            // JSON 파싱 시도
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                // JSON이 아닌 경우 기본 분석
                return this.parseTextResponse(content);
            }
        } catch (error) {
            console.error('JSON parsing error:', error);
            return this.parseTextResponse(content);
        }
    }

    parseTextResponse(text) {
        // 텍스트 응답을 파싱하는 폴백 메서드
        const riskLevel = text.includes('high') ? 'high' : 
                         text.includes('medium') ? 'medium' : 'low';
        
        const score = riskLevel === 'high' ? 80 : 
                     riskLevel === 'medium' ? 50 : 20;
        
        return {
            risk_score: score,
            risk_level: riskLevel,
            reason: text,
            confidence: 0.5
        };
    }

    shouldTriggerAnalysis(preprocessed) {
        const { emojis, normalized } = preprocessed;
        
        // LLM 분석이 필요한 조건들
        const conditions = [
            this.hasUnusualPattern(emojis, normalized),
            this.hasRepeatedPattern(normalized),
            this.hasComplexContext(normalized),
            this.wouldRuleMiss(preprocessed)
        ];
        
        return conditions.some(condition => condition);
    }

    hasUnusualPattern(emojis, text) {
        const knownPatterns = ['🍁 dm 가격', '💊 파티 야간', '❄️ 거래 배송'];
        const emojiCombination = emojis.map(e => e.emoji).join(' ');
        
        return !knownPatterns.some(pattern => 
            pattern.includes(emojiCombination) || 
            pattern.includes(text.substring(0, 10))
        ) && emojis.length > 0;
    }

    hasRepeatedPattern(text) {
        const words = text.split(/\s+/);
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        return Object.values(wordCount).some(count => count > 2);
    }

    hasComplexContext(text) {
        const riskKeywords = ['dm', '가격', '배송', '거래', '파티', '야간', '클럽'];
        const foundKeywords = riskKeywords.filter(keyword => text.includes(keyword));
        
        return foundKeywords.length >= 3;
    }

    wouldRuleMiss(preprocessed) {
        // 룰 기반 탐지가 놓칠 수 있는 복잡한 패턴 확인
        const { emojis, normalized } = preprocessed;
        const hasDangerousEmoji = emojis.some(e => 
            ['🍁', '🍄', '💊', '❄️', '🌿', '🔥', '💉'].includes(e.emoji)
        );
        
        const hasAmbiguousContext = ['레시피', '요리', '음식', '맛', '식당'].some(keyword => 
            normalized.includes(keyword)
        );
        
        return hasDangerousEmoji && hasAmbiguousContext;
    }
}

module.exports = { RealLLMAnalyzer };
