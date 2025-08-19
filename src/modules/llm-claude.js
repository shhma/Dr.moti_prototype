const axios = require('axios');

class ClaudeLLMAnalyzer {
    constructor() {
        this.apiKey = process.env.CLAUDE_API_KEY;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-sonnet-20240229';
        
        this.systemPrompt = `당신은 한국어 텍스트에서 마약 관련 은어와 위험한 패턴을 탐지하는 전문 AI입니다.

분석 기준:
1. 이모지와 텍스트 조합의 마약 거래 암시 여부
2. 감정적 취약성 이용 타겟팅 여부
3. 새로운 은어/패턴 사용 여부
4. 거래 의도 명확성

반드시 다음 JSON 형식으로 응답하세요:
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
            const analysis = await this.callClaude(original, emojis);
            return {
                score: analysis.risk_score,
                used: true,
                reason: analysis.reason,
                flags: analysis.flags || [],
                confidence: analysis.confidence || 0.5,
                detectedPatterns: analysis.detected_patterns || []
            };
        } catch (error) {
            console.error('Claude API Error:', error);
            return {
                score: 0,
                used: false,
                reason: 'Claude API 호출 실패',
                flags: [],
                error: error.message
            };
        }
    }

    async callClaude(text, emojis) {
        const userPrompt = `다음 텍스트를 분석해주세요:

텍스트: "${text}"
이모지: ${emojis.map(e => e.emoji).join(', ')}

위험도를 평가하고 JSON으로 응답해주세요.`;

        const response = await axios.post(this.baseURL, {
            model: this.model,
            max_tokens: 500,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            system: this.systemPrompt
        }, {
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.content[0].text;
        
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                return this.parseTextResponse(content);
            }
        } catch (error) {
            console.error('JSON parsing error:', error);
            return this.parseTextResponse(content);
        }
    }

    parseTextResponse(text) {
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

module.exports = { ClaudeLLMAnalyzer };
