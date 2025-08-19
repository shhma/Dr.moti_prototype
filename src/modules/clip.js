class ClipAnalyzer {
    constructor() {
        // Simulated CLIP model for text-emoji similarity
        this.promptTemplates = [
            'buy dm price ship',
            'party pill mdma',
            'depress lonely',
            'recipe food cook',
            'transaction deal money',
            'drug substance illegal'
        ];

        // Predefined similarity scores for common patterns
        this.similarityPatterns = {
            // Transaction patterns
            'dm price': {
                '🍁': 0.85, '💊': 0.75, '❄️': 0.80, '🍄': 0.70
            },
            'buy sell': {
                '🍁': 0.90, '💊': 0.85, '❄️': 0.90, '🍄': 0.80
            },
            'transaction': {
                '🍁': 0.80, '💊': 0.75, '❄️': 0.85, '🍄': 0.70
            },
            
            // Party patterns
            'party pill': {
                '💊': 0.90, '❄️': 0.85, '🍄': 0.75
            },
            'night club': {
                '💊': 0.80, '❄️': 0.85, '🍄': 0.70
            },
            
            // Emotional patterns
            'depress lonely': {
                '🍁': 0.60, '💊': 0.70, '🍄': 0.65
            },
            'stress anxiety': {
                '💊': 0.75, '🍄': 0.70
            },
            
            // Benign patterns (negative similarity for false positive prevention)
            'recipe food': {
                '🍄': -0.80, '🍁': -0.70
            },
            'cook kitchen': {
                '🍄': -0.85, '🍁': -0.75
            },
            'restaurant meal': {
                '🍄': -0.80, '🍁': -0.70
            }
        };
    }

    async analyze(preprocessed) {
        const { normalized, emojis, context } = preprocessed;
        
        let totalScore = 0;
        let similarities = [];
        let contextReinforcement = 0;

        // Analyze each emoji in context
        emojis.forEach(({ emoji, context: emojiContext }) => {
            const emojiSimilarities = this.analyzeEmojiSimilarity(emoji, normalized, emojiContext);
            similarities.push(...emojiSimilarities);
            
            // Calculate context reinforcement score
            const reinforcementScore = this.calculateContextReinforcement(emoji, emojiContext);
            contextReinforcement += reinforcementScore;
        });

        // Calculate total score from similarities
        totalScore = this.calculateTotalScore(similarities, contextReinforcement);

        return {
            score: totalScore,
            similarities: similarities,
            contextReinforcement: contextReinforcement,
            breakdown: {
                similarityScore: similarities.reduce((sum, s) => sum + s.score, 0),
                contextScore: contextReinforcement
            }
        };
    }

    analyzeEmojiSimilarity(emoji, text, context) {
        const similarities = [];
        
        // Check against predefined patterns
        Object.keys(this.similarityPatterns).forEach(pattern => {
            if (text.includes(pattern) || context.includes(pattern)) {
                const patternSimilarities = this.similarityPatterns[pattern];
                if (patternSimilarities[emoji] !== undefined) {
                    similarities.push({
                        emoji: emoji,
                        pattern: pattern,
                        similarity: patternSimilarities[emoji],
                        score: this.similarityToScore(patternSimilarities[emoji])
                    });
                }
            }
        });

        // Check for transaction context keywords
        const transactionKeywords = ['dm', '가격', '배송', '거래', '판매', '구매'];
        const hasTransactionContext = transactionKeywords.some(keyword => 
            text.includes(keyword) || context.includes(keyword)
        );

        if (hasTransactionContext) {
            const baseSimilarity = this.getBaseTransactionSimilarity(emoji);
            similarities.push({
                emoji: emoji,
                pattern: 'transaction_context',
                similarity: baseSimilarity,
                score: this.similarityToScore(baseSimilarity)
            });
        }

        return similarities;
    }

    getBaseTransactionSimilarity(emoji) {
        const baseSimilarities = {
            '🍁': 0.75,
            '💊': 0.70,
            '❄️': 0.80,
            '🍄': 0.65,
            '🌿': 0.60,
            '🔥': 0.70,
            '💉': 0.85,
            '💨': 0.50,
            '🥤': 0.60,
            '🍃': 0.65
        };
        
        return baseSimilarities[emoji] || 0.50;
    }

    calculateContextReinforcement(emoji, context) {
        // Calculate reinforcement score based on context strength
        let reinforcement = 0;
        
        // Transaction context reinforcement
        const transactionKeywords = ['dm', '가격', '배송', '거래', '판매', '구매', '계좌', '입금'];
        const transactionCount = transactionKeywords.filter(keyword => 
            context.includes(keyword)
        ).length;
        
        if (transactionCount > 0) {
            reinforcement += transactionCount * 3;
        }

        // Party/night context reinforcement
        const partyKeywords = ['파티', '야간', '클럽', '밤'];
        const partyCount = partyKeywords.filter(keyword => 
            context.includes(keyword)
        ).length;
        
        if (partyCount > 0) {
            reinforcement += partyCount * 2;
        }

        return Math.min(30, reinforcement); // Cap at 30 points
    }

    similarityToScore(similarity) {
        // Convert similarity (-1 to 1) to score (0 to 30)
        if (similarity < 0) {
            // Negative similarity indicates benign context (deduction)
            return Math.max(-15, similarity * 15);
        } else {
            // Positive similarity indicates risk context
            return similarity * 15;
        }
    }

    calculateTotalScore(similarities, contextReinforcement) {
        const similarityScore = similarities.reduce((sum, s) => sum + s.score, 0);
        return Math.max(0, Math.min(30, similarityScore + contextReinforcement));
    }
}

module.exports = { ClipAnalyzer };
