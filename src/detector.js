const { Preprocessor } = require('./preprocessor');
const { RuleBasedDetector } = require('./modules/rule-based');
const { EmotionAnalyzer } = require('./modules/emotion');
const { ClipAnalyzer } = require('./modules/clip');
const { LLMAnalyzer } = require('./modules/llm');
const { RealLLMAnalyzer } = require('./modules/llm-real');
const { ClaudeLLMAnalyzer } = require('./modules/llm-claude');

class DrMotiDetector {
    constructor() {
        this.preprocessor = new Preprocessor();
        this.ruleDetector = new RuleBasedDetector();
        this.emotionAnalyzer = new EmotionAnalyzer();
        this.clipAnalyzer = new ClipAnalyzer();
        // LLM 선택 (환경 변수에 따라)
        const llmType = process.env.LLM_TYPE || 'simulated';
        
        switch (llmType) {
            case 'openai':
                this.llmAnalyzer = new RealLLMAnalyzer();
                break;
            case 'claude':
                this.llmAnalyzer = new ClaudeLLMAnalyzer();
                break;
            default:
                this.llmAnalyzer = new LLMAnalyzer(); // 시뮬레이션 모드
        }
        
        this.weights = {
            rule: 0.45,
            emotion: 0.25,
            clip: 0.10,
            llm: 0.20
        };
        
        this.thresholds = {
            low: 40,
            medium: 70,
            high: 100
        };
    }

    async analyze(text) {
        const preprocessed = this.preprocessor.process(text);
        
        const results = await Promise.all([
            this.ruleDetector.detect(preprocessed),
            this.emotionAnalyzer.analyze(preprocessed),
            this.clipAnalyzer.analyze(preprocessed),
            this.llmAnalyzer.analyze(preprocessed)
        ]);
        
        const [ruleResult, emotionResult, clipResult, llmResult] = results;
        const finalScore = this.calculateFinalScore(ruleResult, emotionResult, clipResult, llmResult);
        const riskLevel = this.classifyRisk(finalScore);
        const recommendations = this.generateRecommendations(riskLevel, finalScore);
        
        return {
            input: text,
            preprocessed: preprocessed,
            analysis: {
                rule: ruleResult,
                emotion: emotionResult,
                clip: clipResult,
                llm: llmResult
            },
            finalScore: Math.round(finalScore),
            riskLevel: riskLevel,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
        };
    }
    
    calculateFinalScore(rule, emotion, clip, llm) {
        let ruleScore = rule.score || 0;
        let emotionScore = emotion.score || 0;
        let clipScore = clip.score || 0;
        let llmScore = llm.score || 0;
        
        // LLM이 사용되지 않은 경우 가중치 재조정
        if (llmScore === 0 || llm.error) {
            const totalWeight = this.weights.rule + this.weights.emotion + this.weights.clip;
            const adjustedWeights = {
                rule: this.weights.rule / totalWeight,
                emotion: this.weights.emotion / totalWeight,
                clip: this.weights.clip / totalWeight
            };
            
            return adjustedWeights.rule * ruleScore + 
                   adjustedWeights.emotion * emotionScore + 
                   adjustedWeights.clip * clipScore;
        }
        
        // 정상적인 가중치 계산
        let finalScore = this.weights.rule * ruleScore + 
                        this.weights.emotion * emotionScore + 
                        this.weights.clip * clipScore + 
                        this.weights.llm * llmScore;
        
        // LLM이 'high_risk_case' 플래그를 반환하면 최종 점수에 강력한 보너스 부여
        if (llm.flags && llm.flags.includes('high_risk_case')) {
            finalScore += 40; // 고위험 케이스에 대한 강력한 보너스
            console.log('🚨 HIGH RISK CASE DETECTED! Adding 40 point bonus');
        }
        
        // LLM이 'buy_sell_intent' 플래그를 반환하면 중위험 보너스 부여
        if (llm.flags && llm.flags.includes('buy_sell_intent')) {
            finalScore += 20; // 거래 의도에 대한 중위험 보너스
            console.log('⚠️ TRANSACTION INTENT DETECTED! Adding 20 point bonus');
        }
        
        // 점수가 100을 초과하지 않도록 제한
        finalScore = Math.min(finalScore, 100);
        
        // 디버깅을 위한 로그
        console.log('Score calculation:', {
            rule: ruleScore,
            emotion: emotionScore,
            clip: clipScore,
            llm: llmScore,
            llmFlags: llm.flags,
            weights: this.weights,
            baseScore: this.weights.rule * ruleScore + this.weights.emotion * emotionScore + this.weights.clip * clipScore + this.weights.llm * llmScore,
            finalScore: finalScore
        });
        
        return finalScore;
    }
    
    classifyRisk(score) {
        if (score < this.thresholds.low) {
            return 'low';
        } else if (score < this.thresholds.medium) {
            return 'medium';
        } else {
            return 'high';
        }
    }
    
    generateRecommendations(riskLevel, score) {
        const recommendations = {
            immediate: [],
            followUp: [],
            escalation: []
        };
        
        switch (riskLevel) {
            case 'low':
                recommendations.immediate = ['로그 저장 (익명화)', '별도 조치 없음'];
                break;
            case 'medium':
                recommendations.immediate = [
                    '사용자에게 경고 알림 제공',
                    '예방 교육 자료 링크 제공'
                ];
                break;
            case 'high':
                recommendations.immediate = [
                    '모더레이터에게 즉시 알림',
                    '옵트인 환경에서 보호자/상담사 연계'
                ];
                break;
        }
        
        return recommendations;
    }
}

module.exports = { DrMotiDetector };
