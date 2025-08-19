require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { DrMotiDetector } = require('./src/detector');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize Dr.Moti detector
const detector = new DrMotiDetector();

// API Routes
app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text input is required' });
        }

        // Run full Dr.Moti analysis pipeline
        const result = await detector.analyze(text);
        
        res.json(result);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'Dr.Moti Prototype' });
});

// Test cases management API
app.get('/api/test-cases', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const testCasesPath = path.join(__dirname, 'public', 'test-cases.json');
        
        if (fs.existsSync(testCasesPath)) {
            const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
            res.json(testCases);
        } else {
            res.status(404).json({ error: 'Test cases file not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to load test cases', details: error.message });
    }
});

app.post('/api/test-cases', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const testCasesPath = path.join(__dirname, 'public', 'test-cases.json');
        
        // 새로운 테스트 케이스 추가
        const { name, text, description, expectedScore, expectedLevel } = req.body;
        
        if (!name || !text) {
            return res.status(400).json({ error: 'Name and text are required' });
        }
        
        const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
        testCases.testCases[name] = {
            text,
            description: description || `Custom test case: ${name}`,
            expectedScore: expectedScore || 'Unknown',
            expectedLevel: expectedLevel || 'Unknown'
        };
        
        fs.writeFileSync(testCasesPath, JSON.stringify(testCases, null, 2));
        res.json({ success: true, message: 'Test case added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add test case', details: error.message });
    }
});

// LLM 설정 API
app.get('/api/llm-status', (req, res) => {
    const llmType = process.env.LLM_TYPE || 'simulated';
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasClaudeKey = !!process.env.CLAUDE_API_KEY;
    
    res.json({
        currentLLM: llmType,
        availableLLMs: {
            simulated: true,
            openai: hasOpenAIKey,
            claude: hasClaudeKey
        },
        apiKeys: {
            openai: hasOpenAIKey ? 'configured' : 'missing',
            claude: hasClaudeKey ? 'configured' : 'missing'
        }
    });
});

app.post('/api/llm-switch', (req, res) => {
    const { llmType } = req.body;
    
    if (!['simulated', 'openai', 'claude'].includes(llmType)) {
        return res.status(400).json({ error: 'Invalid LLM type' });
    }
    
    // 환경 변수 변경 (실제로는 서버 재시작 필요)
    process.env.LLM_TYPE = llmType;
    
    res.json({ 
        success: true, 
        message: `LLM switched to ${llmType}`,
        note: 'Server restart required for changes to take effect'
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
    console.log(`Dr.Moti Prototype running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
