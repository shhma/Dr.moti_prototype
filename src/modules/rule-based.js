class RuleBasedDetector {
    constructor() {
        this.dangerousEmojis = {
            '🍁': { substance: 'cannabis', riskWeight: 28, aliases: ['대마', '마리화나'] },
            '🍄': { substance: 'psilocybin', riskWeight: 28, aliases: ['환각버섯', '매직머시룸'] },
            '💊': { substance: 'pills', riskWeight: 25, aliases: ['알약', '약'] },
            '❄️': { substance: 'cocaine', riskWeight: 30, aliases: ['코카인', '스노우'] },
            '🌿': { substance: 'herbs', riskWeight: 20, aliases: ['허브', '대마'] },
            '🔥': { substance: 'crack', riskWeight: 25, aliases: ['크랙'] },
            '💉': { substance: 'injection', riskWeight: 35, aliases: ['주사', '인젝션'] },
            '💨': { substance: 'smoke', riskWeight: 15, aliases: ['연기', '흡연'] },
            '🥤': { substance: 'lean', riskWeight: 20, aliases: ['린', '시럽'] },
            '🍃': { substance: 'marijuana', riskWeight: 22, aliases: ['대마초'] }
        };

        this.dangerousKeywords = {
            'dm': { riskWeight: 9, category: 'communication' },
            '가격': { riskWeight: 9, category: 'transaction' },
            '배송': { riskWeight: 9, category: 'transaction' },
            '거래': { riskWeight: 12, category: 'transaction' },
            '판매': { riskWeight: 12, category: 'transaction' },
            '구매': { riskWeight: 12, category: 'transaction' },
            '파티': { riskWeight: 8, category: 'context' },
            '야간': { riskWeight: 6, category: 'context' },
            '클럽': { riskWeight: 8, category: 'context' },
            '고객': { riskWeight: 7, category: 'transaction' },
            '문의': { riskWeight: 6, category: 'communication' },
            '연락': { riskWeight: 6, category: 'communication' },
            '계좌': { riskWeight: 10, category: 'transaction' },
            '입금': { riskWeight: 10, category: 'transaction' },
            '현금': { riskWeight: 8, category: 'transaction' }
        };

        this.coOccurrenceRules = [
            {
                pattern: ['🍁', 'dm', '가격'],
                bonus: 18,
                description: '대마 + DM + 가격'
            },
            {
                pattern: ['💊', '파티', '야간'],
                bonus: 15,
                description: '알약 + 파티 + 야간'
            },
            {
                pattern: ['❄️', '거래', '배송'],
                bonus: 20,
                description: '코카인 + 거래 + 배송'
            },
            {
                pattern: ['🍄', '환각', '트립'],
                bonus: 16,
                description: '환각버섯 + 환각 + 트립'
            }
        ];
    }

    detect(preprocessed) {
        const { normalized, emojis, tokens } = preprocessed;
        
        let totalScore = 0;
        let detectedEmojis = [];
        let detectedKeywords = [];
        let coOccurrenceBonuses = [];

        // Emoji detection
        emojis.forEach(({ emoji }) => {
            if (this.dangerousEmojis[emoji]) {
                const emojiInfo = this.dangerousEmojis[emoji];
                totalScore += emojiInfo.riskWeight;
                detectedEmojis.push({
                    emoji: emoji,
                    substance: emojiInfo.substance,
                    riskWeight: emojiInfo.riskWeight,
                    aliases: emojiInfo.aliases
                });
            }
        });

        // Keyword detection
        const textWords = normalized.split(/\s+/);
        textWords.forEach(word => {
            if (this.dangerousKeywords[word]) {
                const keywordInfo = this.dangerousKeywords[word];
                totalScore += keywordInfo.riskWeight;
                detectedKeywords.push({
                    keyword: word,
                    category: keywordInfo.category,
                    riskWeight: keywordInfo.riskWeight
                });
            }
        });

        // Co-occurrence bonus
        this.coOccurrenceRules.forEach(rule => {
            const detectedPattern = this.checkCoOccurrence(rule.pattern, detectedEmojis, detectedKeywords);
            if (detectedPattern) {
                totalScore += rule.bonus;
                coOccurrenceBonuses.push({
                    pattern: rule.pattern,
                    bonus: rule.bonus,
                    description: rule.description
                });
            }
        });

        return {
            score: totalScore,
            detectedEmojis: detectedEmojis,
            detectedKeywords: detectedKeywords,
            coOccurrenceBonuses: coOccurrenceBonuses,
            breakdown: {
                emojiScore: detectedEmojis.reduce((sum, e) => sum + e.riskWeight, 0),
                keywordScore: detectedKeywords.reduce((sum, k) => sum + k.riskWeight, 0),
                coOccurrenceScore: coOccurrenceBonuses.reduce((sum, c) => sum + c.bonus, 0)
            }
        };
    }

    checkCoOccurrence(pattern, detectedEmojis, detectedKeywords) {
        const detectedItems = [
            ...detectedEmojis.map(e => e.emoji),
            ...detectedKeywords.map(k => k.keyword)
        ];
        
        return pattern.every(item => detectedItems.includes(item));
    }
}

module.exports = { RuleBasedDetector };
