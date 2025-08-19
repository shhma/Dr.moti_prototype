class LLMAnalyzer {
    constructor() {
        // Simulated LLM patterns for new slang detection
        this.knownPatterns = [
            '🍁 dm 가격',
            '💊 파티 야간',
            '❄️ 거래 배송',
            '🍄 환각 트립',
            '🔥 크랙 거래',
            '💉 주사 마약'
        ];

        // Risk flags for different contexts
        this.riskFlags = {
            'buy_sell_intent': '거래 의도',
            'party_context': '파티 맥락',
            'stimulant_hint': '흥분제 암시',
            'vulnerable_emotion': '취약한 정서',
            'transaction_context': '거래 맥락',
            'minor_targeting': '미성년자 타겟팅',
            'benign_context': '무해한 맥락',
            'new_slang': '새로운 은어',
            'repeated_pattern': '반복 패턴'
        };

        // Trigger conditions for LLM analysis
        this.triggerConditions = {
            ruleMiss: false, // When rule-based detection misses
            unusualPattern: false, // New emoji combinations
            repeatedAppearance: false, // Repeated patterns
            highContextComplexity: false // Complex context
        };
    }

    async analyze(preprocessed) {
        const { normalized, emojis, tokens } = preprocessed;
        
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

        // Perform LLM analysis
        const analysis = this.performLLMAnalysis(preprocessed);
        
        return {
            score: analysis.score,
            used: true,
            reason: analysis.reason,
            flags: analysis.flags,
            confidence: analysis.confidence
        };
    }

    shouldTriggerAnalysis(preprocessed) {
        const { emojis, normalized } = preprocessed;
        
        // 고위험 케이스는 항상 LLM 분석 실행
        if (this.isHighRiskCase(preprocessed)) {
            return true;
        }
        
        // Check for unusual patterns
        const hasUnusualPattern = this.checkUnusualPattern(emojis, normalized);
        
        // Check for repeated patterns
        const hasRepeatedPattern = this.checkRepeatedPattern(normalized);
        
        // Check for complex context
        const hasComplexContext = this.checkComplexContext(normalized);
        
        // Check if rule-based detection would miss this
        const wouldRuleMiss = this.wouldRuleMiss(preprocessed);
        
        return hasUnusualPattern || hasRepeatedPattern || hasComplexContext || wouldRuleMiss;
    }
    
    isHighRiskCase(preprocessed) {
        const { emojis, normalized } = preprocessed;
        
        // 고위험 이모지들
        const highRiskEmojis = ['🍁', '💊', '❄️', '💉', '🔥', '🍄'];
        const hasHighRiskEmoji = emojis.some(e => highRiskEmojis.includes(e.emoji));
        
        // 고위험 키워드들 (거래 관련)
        const transactionKeywords = ['dm', '가격', '배송', '거래', '판매', '구매'];
        const hasTransactionKeyword = transactionKeywords.some(keyword => normalized.includes(keyword));
        
        // 고위험 맥락 키워드들
        const contextKeywords = ['파티', '야간', '클럽', '춤', '흥분', '각성', '해보고 싶어', '시도'];
        const hasContextKeyword = contextKeywords.some(keyword => normalized.includes(keyword));
        
        // 취약한 감정 키워드들
        const vulnerableKeywords = ['우울', '힘들다', '절망', '외로움', '불안'];
        const hasVulnerableEmotion = vulnerableKeywords.some(keyword => normalized.includes(keyword));
        
        // 이모지 + (거래 키워드 OR 맥락 키워드 OR 취약한 감정) = 고위험
        return hasHighRiskEmoji && (hasTransactionKeyword || hasContextKeyword || hasVulnerableEmotion);
    }

    checkUnusualPattern(emojis, text) {
        // Check for new emoji combinations not in known patterns
        const emojiCombination = emojis.map(e => e.emoji).join(' ');
        const textKeywords = text.split(/\s+/).filter(word => word.length > 1);
        
        // Check if this combination is new
        const isKnownPattern = this.knownPatterns.some(pattern => {
            const patternEmojis = pattern.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
            const patternKeywords = pattern.split(/\s+/).filter(word => !word.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu));
            
            return patternEmojis && patternEmojis.join(' ') === emojiCombination &&
                   patternKeywords.some(keyword => textKeywords.includes(keyword));
        });
        
        return !isKnownPattern && emojis.length > 0;
    }

    checkRepeatedPattern(text) {
        // Check for repeated words or patterns
        const words = text.split(/\s+/);
        const wordCount = {};
        
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        const repeatedWords = Object.keys(wordCount).filter(word => wordCount[word] > 2);
        return repeatedWords.length > 0;
    }

    checkComplexContext(text) {
        // Check for complex context with multiple risk indicators
        const riskKeywords = ['dm', '가격', '배송', '거래', '파티', '야간', '클럽', '계좌', '입금'];
        const foundKeywords = riskKeywords.filter(keyword => text.includes(keyword));
        
        return foundKeywords.length >= 3;
    }

    wouldRuleMiss(preprocessed) {
        // Simulate rule-based detection to see if it would miss this
        const { emojis, normalized } = preprocessed;
        
        // Simple rule-based check
        const dangerousEmojis = ['🍁', '🍄', '💊', '❄️', '🌿', '🔥', '💉', '💨', '🥤', '🍃'];
        const dangerousKeywords = ['dm', '가격', '배송', '거래', '판매', '구매', '파티', '야간', '클럽'];
        
        const hasDangerousEmoji = emojis.some(e => dangerousEmojis.includes(e.emoji));
        const hasDangerousKeyword = dangerousKeywords.some(keyword => normalized.includes(keyword));
        
        // If it has dangerous elements but might be missed by simple rules
        return (hasDangerousEmoji || hasDangerousKeyword) && this.hasAmbiguousContext(normalized);
    }

    hasAmbiguousContext(text) {
        // Check for ambiguous context that might confuse simple rules
        const benignKeywords = ['레시피', '요리', '음식', '맛', '식당', '크림', '파스타'];
        const hasBenignContext = benignKeywords.some(keyword => text.includes(keyword));
        
        return hasBenignContext;
    }

    performLLMAnalysis(preprocessed) {
        const { normalized, emojis } = preprocessed;
        
        let score = 0;
        let flags = [];
        let reason = '';
        let confidence = 0.5;

        // 고위험 케이스 기본 점수 부여
        if (this.isHighRiskCase(preprocessed)) {
            score += 50;
            flags.push('high_risk_case');
            reason += '고위험 케이스 감지. ';
        }

        // Analyze transaction intent
        if (this.hasTransactionIntent(normalized)) {
            score += 30;
            flags.push('buy_sell_intent');
            reason += '거래 의도 감지. ';
        }

        // Analyze party context
        if (this.hasPartyContext(normalized)) {
            score += 30; // 20에서 30으로 증가
            flags.push('party_context');
            reason += '파티 맥락 감지. ';
        }

        // Analyze stimulant hints
        if (this.hasStimulantHints(normalized, emojis)) {
            score += 35; // 25에서 35로 증가
            flags.push('stimulant_hint');
            reason += '흥분제 암시 감지. ';
        }

        // Analyze vulnerable emotion
        if (this.hasVulnerableEmotion(normalized)) {
            score += 15;
            flags.push('vulnerable_emotion');
            reason += '취약한 정서 상태 감지. ';
        }

        // Analyze minor targeting
        if (this.hasMinorTargeting(normalized)) {
            score += 20;
            flags.push('minor_targeting');
            reason += '미성년자 타겟팅 의심. ';
        }

        // Check for benign context (reduce score)
        if (this.hasBenignContext(normalized)) {
            score = Math.max(0, score - 20);
            flags.push('benign_context');
            reason += '무해한 맥락으로 점수 감소. ';
        }

        // Check for new slang
        if (this.isNewSlang(preprocessed)) {
            score += 10;
            flags.push('new_slang');
            reason += '새로운 은어 패턴 감지. ';
        }

        // Adjust confidence based on flag count
        confidence = Math.min(0.9, 0.5 + (flags.length * 0.1));

        return {
            score: Math.min(100, score),
            reason: reason || '일반적인 분석',
            flags: flags,
            confidence: confidence
        };
    }

    hasTransactionIntent(text) {
        const transactionKeywords = ['dm', '가격', '배송', '거래', '판매', '구매', '계좌', '입금', '현금'];
        return transactionKeywords.some(keyword => text.includes(keyword));
    }

    hasPartyContext(text) {
        const partyKeywords = ['파티', '야간', '클럽', '밤', '축제'];
        return partyKeywords.some(keyword => text.includes(keyword));
    }

    hasStimulantHints(text, emojis) {
        const stimulantEmojis = ['💊', '❄️', '🔥'];
        const stimulantKeywords = ['흥분', '각성', '에너지', '활력'];
        
        return emojis.some(e => stimulantEmojis.includes(e.emoji)) ||
               stimulantKeywords.some(keyword => text.includes(keyword));
    }

    hasVulnerableEmotion(text) {
        const vulnerableKeywords = ['힘들다', '우울', '절망', '외로움', '불안', '스트레스'];
        return vulnerableKeywords.some(keyword => text.includes(keyword));
    }

    hasMinorTargeting(text) {
        const minorKeywords = ['학생', '청소년', '미성년', '고등학생', '중학생'];
        return minorKeywords.some(keyword => text.includes(keyword));
    }

    hasBenignContext(text) {
        const benignKeywords = ['레시피', '요리', '음식', '맛', '식당', '크림', '파스타', '요리법'];
        return benignKeywords.some(keyword => text.includes(keyword));
    }

    isNewSlang(preprocessed) {
        // Check if this is a new slang pattern
        const { emojis, normalized } = preprocessed;
        const emojiCombination = emojis.map(e => e.emoji).join(' ');
        
        // Check against known patterns
        return !this.knownPatterns.some(pattern => {
            const patternEmojis = pattern.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
            return patternEmojis && patternEmojis.join(' ') === emojiCombination;
        });
    }
}

module.exports = { LLMAnalyzer };
