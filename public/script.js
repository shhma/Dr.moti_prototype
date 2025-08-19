class DrMotiUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupTestCases();
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.riskLevel = document.getElementById('riskLevel');
        this.riskScore = document.getElementById('riskScore');
        this.ruleScore = document.getElementById('ruleScore');
        this.emotionScore = document.getElementById('emotionScore');
        this.clipScore = document.getElementById('clipScore');
        this.llmScore = document.getElementById('llmScore');
        this.ruleDetails = document.getElementById('ruleDetails');
        this.emotionDetails = document.getElementById('emotionDetails');
        this.clipDetails = document.getElementById('clipDetails');
        this.llmDetails = document.getElementById('llmDetails');
        this.recommendationList = document.getElementById('recommendationList');
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeText());
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.analyzeText();
            }
        });
        
        // 테스트 케이스 추가 버튼 이벤트
        const addCaseBtn = document.getElementById('addCaseBtn');
        if (addCaseBtn) {
            addCaseBtn.addEventListener('click', () => this.addTestCase());
        }
        
        // LLM 설정 버튼 이벤트
        document.querySelectorAll('.llm-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchLLM(btn.dataset.llm));
        });
        
        // LLM 상태 확인
        this.checkLLMStatus();
    }
    
    async addTestCase() {
        const name = document.getElementById('caseName').value.trim();
        const text = document.getElementById('caseText').value.trim();
        const description = document.getElementById('caseDescription').value.trim();
        
        if (!name || !text) {
            alert('케이스 이름과 텍스트는 필수입니다.');
            return;
        }
        
        try {
            const response = await fetch('/api/test-cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    text,
                    description: description || `사용자 정의 테스트 케이스: ${name}`
                })
            });
            
            if (response.ok) {
                alert('테스트 케이스가 추가되었습니다!');
                // 폼 초기화
                document.getElementById('caseName').value = '';
                document.getElementById('caseText').value = '';
                document.getElementById('caseDescription').value = '';
                
                // 테스트 케이스 다시 로드
                await this.setupTestCases();
            } else {
                const error = await response.json();
                alert('테스트 케이스 추가 실패: ' + error.error);
            }
        } catch (error) {
            console.error('Add test case error:', error);
            alert('테스트 케이스 추가 중 오류가 발생했습니다.');
        }
    }

    async setupTestCases() {
        try {
            // JSON 파일에서 테스트 케이스 로드
            const response = await fetch('/test-cases.json');
            const testData = await response.json();
            this.testCases = testData.testCases;
            
            // 기존 버튼들에 이벤트 리스너 추가
            document.querySelectorAll('.case-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const caseType = btn.dataset.case;
                    if (this.testCases[caseType]) {
                        this.textInput.value = this.testCases[caseType].text;
                        this.analyzeText();
                    }
                });
            });
            
            // 추가 테스트 케이스 버튼들 동적 생성
            this.createAdditionalTestButtons();
            
        } catch (error) {
            console.error('테스트 케이스 로드 실패:', error);
            // 폴백: 기본 테스트 케이스 사용
            this.setupFallbackTestCases();
        }
    }
    
    createAdditionalTestButtons() {
        const caseButtons = document.querySelector('.case-buttons');
        
        // 추가 테스트 케이스 버튼들 생성
        Object.keys(this.testCases).forEach(caseKey => {
            if (!document.querySelector(`[data-case="${caseKey}"]`)) {
                const btn = document.createElement('button');
                btn.className = 'case-btn';
                btn.dataset.case = caseKey;
                btn.textContent = this.testCases[caseKey].description.split(' - ')[0];
                btn.title = this.testCases[caseKey].description;
                
                btn.addEventListener('click', () => {
                    this.textInput.value = this.testCases[caseKey].text;
                    this.analyzeText();
                });
                
                caseButtons.appendChild(btn);
            }
        });
    }
    
    setupFallbackTestCases() {
        const fallbackCases = {
            'high-risk': '오늘 급해. DM 가능? 🍁 가격 말해줘',
            'medium-risk': '요즘 너무 힘들다... 친구들이 🍄 얘기하던데 혹시 DM?',
            'low-risk': '크림파스타 먹자 🍄 ㅋㅋ 레시피 링크 줄게',
            'false-positive': '오늘 밤 파티 가자 ✨💊'
        };

        document.querySelectorAll('.case-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const caseType = btn.dataset.case;
                this.textInput.value = fallbackCases[caseType];
                this.analyzeText();
            });
        });
    }

    async analyzeText() {
        const text = this.textInput.value.trim();
        if (!text) {
            alert('분석할 텍스트를 입력해주세요.');
            return;
        }

        this.setLoading(true);
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error('분석 요청에 실패했습니다.');
            }

            const result = await response.json();
            this.displayResults(result);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('분석 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (loading) {
            this.analyzeBtn.textContent = '분석 중...';
            this.analyzeBtn.disabled = true;
            document.body.classList.add('loading');
        } else {
            this.analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span>분석 시작';
            this.analyzeBtn.disabled = false;
            document.body.classList.remove('loading');
        }
    }

    displayResults(result) {
        this.resultsSection.style.display = 'block';
        
        // Update risk level and score
        this.updateRiskDisplay(result.riskLevel, result.finalScore);
        
        // Update module scores
        this.updateModuleScores(result.analysis);
        
        // Update module details
        this.updateModuleDetails(result.analysis);
        
        // Update recommendations
        this.updateRecommendations(result.recommendations);
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    updateRiskDisplay(riskLevel, score) {
        const riskIcons = {
            'low': '✅',
            'medium': '⚠️',
            'high': '🚨'
        };

        const riskTexts = {
            'low': '저위험',
            'medium': '중위험',
            'high': '고위험'
        };

        const riskColors = {
            'low': 'risk-low',
            'medium': 'risk-medium',
            'high': 'risk-high'
        };

        this.riskLevel.innerHTML = `
            <span class="risk-icon">${riskIcons[riskLevel]}</span>
            <span class="risk-text ${riskColors[riskLevel]}">${riskTexts[riskLevel]}</span>
        `;

        this.riskScore.innerHTML = `
            <span class="score-number">${score}</span>
            <span class="score-label">점</span>
        `;
    }

    updateModuleScores(analysis) {
        this.ruleScore.textContent = Math.round(analysis.rule.score || 0);
        this.emotionScore.textContent = Math.round(analysis.emotion.score || 0);
        this.clipScore.textContent = Math.round(analysis.clip.score || 0);
        this.llmScore.textContent = Math.round(analysis.llm.score || 0);
    }

    updateModuleDetails(analysis) {
        // Rule-based details
        let ruleDetails = '';
        if (analysis.rule.detectedEmojis && analysis.rule.detectedEmojis.length > 0) {
            ruleDetails += `탐지된 이모지: ${analysis.rule.detectedEmojis.map(e => `${e.emoji}(${e.substance})`).join(', ')}<br>`;
        }
        if (analysis.rule.detectedKeywords && analysis.rule.detectedKeywords.length > 0) {
            ruleDetails += `탐지된 키워드: ${analysis.rule.detectedKeywords.map(k => k.keyword).join(', ')}<br>`;
        }
        if (analysis.rule.coOccurrenceBonuses && analysis.rule.coOccurrenceBonuses.length > 0) {
            ruleDetails += `코오커런스 보너스: ${analysis.rule.coOccurrenceBonuses.map(c => c.description).join(', ')}`;
        }
        this.ruleDetails.innerHTML = ruleDetails || '탐지된 요소 없음';

        // Emotion details
        let emotionDetails = '';
        if (analysis.emotion.dominantEmotion) {
            emotionDetails += `주요 감정: ${this.getEmotionText(analysis.emotion.dominantEmotion)}<br>`;
        }
        if (analysis.emotion.emotions) {
            const emotionScores = Object.entries(analysis.emotion.emotions)
                .filter(([emotion, score]) => score > 0)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([emotion, score]) => `${this.getEmotionText(emotion)}: ${Math.round(score)}%`);
            if (emotionScores.length > 0) {
                emotionDetails += `감정 점수: ${emotionScores.join(', ')}`;
            }
        }
        this.emotionDetails.innerHTML = emotionDetails || '감정 분석 결과 없음';

        // CLIP details
        let clipDetails = '';
        if (analysis.clip.similarities && analysis.clip.similarities.length > 0) {
            const similarities = analysis.clip.similarities
                .slice(0, 3)
                .map(s => `${s.emoji}-${s.pattern}: ${Math.round(s.similarity * 100)}%`);
            clipDetails += `유사도: ${similarities.join(', ')}<br>`;
        }
        if (analysis.clip.contextReinforcement > 0) {
            clipDetails += `맥락 강화: +${Math.round(analysis.clip.contextReinforcement)}점`;
        }
        this.clipDetails.innerHTML = clipDetails || 'CLIP 분석 결과 없음';

        // LLM details
        let llmDetails = '';
        if (analysis.llm.used) {
            if (analysis.llm.reason) {
                llmDetails += `분석: ${analysis.llm.reason}<br>`;
            }
            if (analysis.llm.flags && analysis.llm.flags.length > 0) {
                llmDetails += `플래그: ${analysis.llm.flags.join(', ')}`;
            }
        } else {
            llmDetails = 'LLM 분석 미사용';
        }
        this.llmDetails.innerHTML = llmDetails;
    }

    getEmotionText(emotion) {
        const emotionMap = {
            'depression': '우울',
            'anxiety': '불안',
            'despair': '절망',
            'anger': '분노',
            'neutrality': '중립'
        };
        return emotionMap[emotion] || emotion;
    }

    updateRecommendations(recommendations) {
        let html = '';
        
        if (recommendations.immediate && recommendations.immediate.length > 0) {
            html += '<div class="recommendation-item">';
            html += '<span class="recommendation-icon">⚡</span>';
            html += '<span>즉시 조치: ' + recommendations.immediate.join(', ') + '</span>';
            html += '</div>';
        }
        
        if (recommendations.followUp && recommendations.followUp.length > 0) {
            html += '<div class="recommendation-item">';
            html += '<span class="recommendation-icon">📋</span>';
            html += '<span>후속 조치: ' + recommendations.followUp.join(', ') + '</span>';
            html += '</div>';
        }
        
        if (recommendations.escalation && recommendations.escalation.length > 0) {
            html += '<div class="recommendation-item">';
            html += '<span class="recommendation-icon">🚨</span>';
            html += '<span>상위 조치: ' + recommendations.escalation.join(', ') + '</span>';
            html += '</div>';
        }
        
        this.recommendationList.innerHTML = html || '<div class="recommendation-item">권장 조치사항이 없습니다.</div>';
    }
    
    async checkLLMStatus() {
        try {
            const response = await fetch('/api/llm-status');
            const status = await response.json();
            
            const currentLLMElement = document.getElementById('currentLLM');
            if (currentLLMElement) {
                currentLLMElement.textContent = this.getLLMDisplayName(status.currentLLM);
            }
            
            // 버튼 상태 업데이트
            document.querySelectorAll('.llm-btn').forEach(btn => {
                const llmType = btn.dataset.llm;
                btn.classList.remove('active', 'disabled');
                
                if (llmType === status.currentLLM) {
                    btn.classList.add('active');
                } else if (!status.availableLLMs[llmType]) {
                    btn.classList.add('disabled');
                    btn.title = 'API 키가 설정되지 않음';
                }
            });
        } catch (error) {
            console.error('LLM status check failed:', error);
        }
    }
    
    async switchLLM(llmType) {
        try {
            const response = await fetch('/api/llm-switch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ llmType })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(`${result.message}\n\n${result.note}`);
                this.checkLLMStatus();
            } else {
                const error = await response.json();
                alert('LLM 전환 실패: ' + error.error);
            }
        } catch (error) {
            console.error('LLM switch error:', error);
            alert('LLM 전환 중 오류가 발생했습니다.');
        }
    }
    
    getLLMDisplayName(llmType) {
        const names = {
            'simulated': '시뮬레이션 모드',
            'openai': 'OpenAI GPT',
            'claude': 'Claude'
        };
        return names[llmType] || llmType;
    }
}

// Initialize the UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DrMotiUI();
});
