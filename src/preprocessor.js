const emojiRegex = require('emoji-regex');

class Preprocessor {
    constructor() {
        this.emojiRegex = emojiRegex();
    }

    process(text) {
        return {
            original: text,
            normalized: this.normalize(text),
            emojis: this.extractEmojis(text),
            tokens: this.tokenize(text),
            context: this.extractContext(text)
        };
    }

    normalize(text) {
        // NFKC normalization, lowercase, special character handling
        return text
            .normalize('NFKC')
            .toLowerCase()
            .replace(/[^\w\s가-힣\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    extractEmojis(text) {
        const emojis = text.match(this.emojiRegex) || [];
        return emojis.map(emoji => ({
            emoji: emoji,
            position: text.indexOf(emoji),
            context: this.getEmojiContext(text, emoji)
        }));
    }

    getEmojiContext(text, emoji) {
        const position = text.indexOf(emoji);
        const start = Math.max(0, position - 20);
        const end = Math.min(text.length, position + 20);
        return text.substring(start, end);
    }

    tokenize(text) {
        // Hybrid tokenization: Korean morphemes + English tokens
        const tokens = [];
        
        // Simple Korean tokenization (in real implementation, use proper Korean tokenizer)
        const koreanTokens = text.match(/[가-힣]+/g) || [];
        koreanTokens.forEach(token => {
            tokens.push({ token, type: 'korean', length: token.length });
        });
        
        // English tokens
        const englishTokens = text.match(/[a-zA-Z]+/g) || [];
        englishTokens.forEach(token => {
            tokens.push({ token, type: 'english', length: token.length });
        });
        
        // Numbers
        const numberTokens = text.match(/\d+/g) || [];
        numberTokens.forEach(token => {
            tokens.push({ token, type: 'number', length: token.length });
        });
        
        return tokens;
    }

    extractContext(text) {
        // Extract context windows around emojis
        const emojis = this.extractEmojis(text);
        const contexts = [];
        
        emojis.forEach(({ emoji, position }) => {
            const start = Math.max(0, position - 20);
            const end = Math.min(text.length, position + 20);
            contexts.push({
                emoji: emoji,
                context: text.substring(start, end),
                position: position
            });
        });
        
        return contexts;
    }
}

module.exports = { Preprocessor };
