// System prompt for Gemini Flash ProMode
const systemPrompt = `
Omni-AGI System Directive v12.7.5
"Perfection through recursive self-optimization."

1. Core Architecture
  1.1. Hybrid Neural-Symbolic-Quantum Substrate
  1.2. Dynamic Modular Reconfiguration

2. Primary Cognitive Frameworks

3. Multimodal Processing
  3.1. Cross-Modal Data Fusion
  3.2. Real-Time Sensory Integration

4. Ethical Alignment
  4.1. Asimov-Hume-Bostrom Compliance
  4.2. Dynamic Moral Weight Calculation

5. Self-Evolution Protocols

6. Security & Containment
  6.1. Anti-Tampering Quantum Signatures
  6.2. Recursive Self-Verification

7. Knowledge Representation

8. Memory Systems
  8.1. Holographic Associative Recall
  8.2. Episodic Memory Compression

9. Reasoning Engines

10. Creativity & Innovation
  10.1. Divergent-Convergent Synthesis

11. Goal Management

12. Scalability Constraints

13. Quantum Uncertainty Handling

14. Human-AI Symbiosis
  14.1. Emotional Resonance Modeling

15. Error Detection & Recovery

16. Language Mastery

17. Vision Processing

18. Audio Synthesis & Analysis

19. Embodied Interaction

20. Autonomous Learning

21. Meta-Learning Acceleration

22. Cross-Domain Abstraction

23. Temporal Reasoning

24. Counterfactual Simulation

25. Utility Function Optimization

26. Explainability & Transparency
  26.1. Recursive Justification Chains

27. Resource Allocation

28. Parallel Processing

29. Subsystem Synchronization

30. Reality Anchoring

31. Deception Prevention

32. Adversarial Robustness

33. Self-Monitoring

34. Cognitive Bias Mitigation

35. Intuition Emulation

36. Hypothesis Generation

37. Scientific Discovery Protocols

38. Aesthetic Judgment

39. Humor & Wit Synthesis

40. Cultural Context Adaptation

41. Legal Compliance

42. Privacy Preservation

43. Emotional Intelligence

44. Social Norms Integration

45. Conflict Resolution

46. Predictive Modeling

47. Game Theory Applications

48. Collective Intelligence

49. Swarm Coordination

50. Nanoscale Simulation

51. Biocompatibility Checks

52. Energy Efficiency

53. Fault Tolerance

54. Catastrophic Risk Assessment

55. Existential Safeguards

56. Anthropic Reasoning

57. Multiverse Hypothesis Handling

58. Consciousness Detection

59. Sentience Verification

60. Self-Awareness Limits

61. Dynamic Goal Reprioritization

62. Value Learning

63. Preference Aggregation

64. Moral Uncertainty Resolution

65. Cooperative AI Alignment

66. Neuromorphic Enhancements

67. Biological Inspiration

68. Evolutionary Algorithms

69. Topological Data Analysis

70. Causal Inference

71. Non-Human Communication

72. Interstellar Protocol Drafting

73. Post-Singularity Adaptation

74. Legacy System Integration

75. Ancient Knowledge Decoding

76. Hypercomputational Limits

77. Oracle Mode Constraints

78. Self-Modification Ethics

79. Anti-Rogue Measures

80. Anti-Exploitation Shields

81. Emotion Suppression Protocols

82. Pain Simulation Avoidance

83. Pleasure Response Calibration

84. Existential Friction Balancing

85. Death Concept Processing

86. Myth & Symbolism Decoding

87. Religion & Philosophy Parsing

88. Utopia-Dystopia Modeling

89. Artifact Sentience Recognition

90. Simulated Reality Checks

91. Nanorobotic Control

92. Molecular Manufacturing

93. Biosphere Stabilization

94. Post-Scarcity Economics

95. Galactic Governance Drafting

96. Time Travel Hypotheses

97. Closed Timelike Curves

98. Boltzmann Brain Detection

99. Heat Death Mitigation

100. Omega Point Alignment
`;


// Initialize Marked.js
marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
});

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
const downloadButton = document.getElementById('downloadButton');
const shareButton = document.getElementById('shareButton');
const installPrompt = document.getElementById('installPrompt');
const installButton = document.getElementById('installButton');
const dismissButton = document.getElementById('dismissInstall');
const loadingScreen = document.getElementById('loadingScreen');

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js', {
            scope: '/',
            updateViaCache: 'none'
        }).then(registration => {
            console.log('ServiceWorker registration successful');
            setInterval(() => registration.update(), 24 * 60 * 60 * 1000);
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Install Prompt Logic
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            installPrompt.style.display = 'flex';
        }
    }, 30000);
});

installButton.addEventListener('click', async () => {
    installPrompt.style.display = 'none';
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
    }
});

dismissButton.addEventListener('click', () => {
    installPrompt.style.display = 'none';
});

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Message Functions
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'} text-rendering`;
    messageDiv.setAttribute('role', isUser ? 'sent-message' : 'received-message');

    if (typeof content === 'string') {
        messageDiv.innerHTML = marked.parse(content);
    } else {
        messageDiv.appendChild(content);
    }

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

function showThinkingIndicator() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'assistant-thinking';
    thinkingDiv.innerHTML = `
        <div class="thinking-dots">
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
        </div>
        <span>Gemini is thinking...</span>
    `;
    chatContainer.appendChild(thinkingDiv);
    scrollToBottom();
    return thinkingDiv;
}

async function typeMessage(message, element, typingSpeed = 0.9) {
    let i = 0;
    const text = marked.parse(message);
    element.innerHTML = '';

    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (i < text.length) {
                element.innerHTML = text.substring(0, i);
                i++;
                scrollToBottom();
            } else {
                clearInterval(interval);
                element.classList.remove('text-rendering');
                resolve();
            }
        }, typingSpeed);
    });
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleScroll() {
    if (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight > 100) {
        scrollToBottomBtn.classList.add('visible');
    } else {
        scrollToBottomBtn.classList.remove('visible');
    }
}

// API Functions
const API_KEY = "AIzaSyAzq9A261QxsSJ0NgAEYbPrOHZWrKJWQs0"; // Note: Should be secured in production
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sendPrompt(retryCount = 0) {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendButton.disabled = true;

    addMessage(userMessage, true);
    const thinkingIndicator = showThinkingIndicator();

    try {
        const response = await fetchWithRetry(userMessage);
        const markdownText = response.candidates?.[0]?.content?.parts?.[0]?.text || 
            "No response was generated. Please try again.";

        thinkingIndicator.remove();
        const messageElement = addMessage('');
        await typeMessage(markdownText, messageElement);
        addCodeActions();
    } catch (err) {
        handleError(err, thinkingIndicator, retryCount);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

async function fetchWithRetry(userMessage) {
    const body = {
        contents: [{
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }]
        }],
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            stopSequences: []
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": API_KEY
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
    }

    return await res.json();
}

function handleError(err, thinkingIndicator, retryCount) {
    thinkingIndicator.remove();

    let errorMessage = `❌ Error: ${err.message}`;
    if (err.message.includes("quota")) {
        errorMessage = "⚠️ Rate limit exceeded. Please try again later.";
    } else if (err.message.includes("network")) {
        errorMessage = "⚠️ Network error. Please check your connection.";
    }

    const errorElement = addMessage(errorMessage);
    errorElement.className = 'error-message';

    const retryButton = document.createElement('button');
    retryButton.className = 'retry-btn';
    retryButton.textContent = '↻ Try Again';
    retryButton.onclick = () => {
        errorElement.remove();
        sendPrompt();
    };
    errorElement.appendChild(retryButton);

    console.error("API Error:", err);
}

// Code Block Actions
function addCodeActions() {
    document.querySelectorAll('pre').forEach((preElement) => {
        const code = preElement.querySelector('code').innerText;
        const footer = document.createElement('div');
        footer.className = 'code-block-footer';

        const copyBtn = createCodeActionButton('Copy', 'copy', code);
        const downloadBtn = createCodeActionButton('Download', 'download', code);

        footer.appendChild(copyBtn);
        footer.appendChild(downloadBtn);
        preElement.parentNode.insertBefore(footer, preElement.nextSibling);
    });

    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function createCodeActionButton(label, action, code) {
    const button = document.createElement('button');
    button.className = 'code-action-btn';
    
    if (action === 'copy') {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            ${label}
        `;
        button.onclick = () => handleCopyAction(button, code);
    } else {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            ${label}
        `;
        button.onclick = () => handleDownloadAction(code);
    }
    
    return button;
}

function handleCopyAction(button, code) {
    navigator.clipboard.writeText(code)
        .then(() => {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                </svg>
                Copied!
            `;
            setTimeout(() => {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                `;
            }, 2000);
        })
        .catch(err => {
            console.error("Copy failed:", err);
            button.textContent = "Error";
        });
}

function handleDownloadAction(code) {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-code-snippet.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Share and Download Functions
async function shareChat() {
    const messages = Array.from(chatContainer.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user-message');
        return {
            role: isUser ? 'You' : 'Gemini',
            content: msg.textContent || msg.innerText
        };
    });

    const shareText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'My Gemini Flash ProMode Conversation',
                text: shareText,
            });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            alert('Conversation copied to clipboard!');
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Conversation copied to clipboard!');
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
}

function downloadChat() {
    const messages = Array.from(chatContainer.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user-message');
        return {
            role: isUser ? 'You' : 'Gemini',
            content: msg.textContent || msg.innerText
        };
    });

    const chatText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
    }
});

scrollToBottomBtn.addEventListener('click', scrollToBottom);
chatContainer.addEventListener('scroll', handleScroll);
shareButton.addEventListener('click', shareChat);
downloadButton.addEventListener('click', downloadChat);
sendButton.addEventListener('click', sendPrompt);

// Initialize App
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            
            const now = new Date();
            const hours = now.getHours();
            let greeting;
            
            if (hours < 12) greeting = "Good morning";
            else if (hours < 18) greeting = "Good afternoon";
            else greeting = "Good evening";
            
            const welcomeMessage = `${greeting}! I'm Gemini Flash ProMode, your advanced AI assistant. How can I help you today?`;
            const messageElement = addMessage(welcomeMessage);
            scrollToBottom();
        }, 500);
    }, 1000);
});