document.addEventListener('DOMContentLoaded', async () => {
    // Dynamically load fab.html if not already present
    if (!document.getElementById('fab-menu-btn')) {
        const response = await fetch('fab.html');
        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);

        // Move all FAB/modal logic here, after HTML is injected
        const fabMenuBtn = document.getElementById('fab-menu-btn');
        const openFeedbackBtn = document.getElementById('open-feedback-btn');
        const openChatbotBtn = document.getElementById('open-chatbot-btn');
        let fabOpen = false;

        // Modal elements
        const feedbackModal = document.getElementById('feedback-modal');
        const closeFeedbackBtn = document.getElementById('close-feedback-btn');
        const feedbackText = document.getElementById('feedback-text');
        const submitFeedbackBtn = document.getElementById('submit-feedback-btn');

        const chatbotModal = document.getElementById('chatbot-modal');
        const closeChatbotBtn = document.getElementById('close-chatbot-btn');
        const chatbotMessages = document.getElementById('chatbot-messages');
        const chatbotInput = document.getElementById('chatbot-input');
        const sendChatbotBtn = document.getElementById('send-chatbot-btn');

        // FAB menu toggle logic
        fabMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fabOpen = !fabOpen;
            fabMenuBtn.classList.toggle('open', fabOpen);
            openFeedbackBtn.classList.toggle('show', fabOpen);
            openChatbotBtn.classList.toggle('show', fabOpen);
        });

        // Hide action buttons when clicking outside
        document.addEventListener('click', (e) => {
            if (!fabMenuBtn.contains(e.target) && !openFeedbackBtn.contains(e.target) && !openChatbotBtn.contains(e.target)) {
                fabOpen = false;
                fabMenuBtn.classList.remove('open');
                openFeedbackBtn.classList.remove('show');
                openChatbotBtn.classList.remove('show');
            }
        });

        // Feedback modal logic
        openFeedbackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (feedbackModal) {
                feedbackModal.classList.add('active');
                feedbackText.value = '';
                feedbackText.focus();
            }
            fabMenuBtn.classList.remove('open');
            openFeedbackBtn.classList.remove('show');
            openChatbotBtn.classList.remove('show');
        });
        if (closeFeedbackBtn && feedbackModal) {
            closeFeedbackBtn.addEventListener('click', () => {
                feedbackModal.classList.remove('active');
            });
            feedbackModal.addEventListener('mousedown', (e) => {
                if (e.target === feedbackModal) {
                    feedbackModal.classList.remove('active');
                }
            });
        }
        if (submitFeedbackBtn && feedbackText) {
            submitFeedbackBtn.addEventListener('click', async () => {
                const text = feedbackText.value.trim();
                if (!text) {
                    feedbackText.focus();
                    feedbackText.placeholder = "Please enter your feedback!";
                    return;
                }
                // You can add your feedback submission logic here
                feedbackModal.classList.remove('active');
                alert('Thank you for your feedback!');
            });
        }

        // Chatbot modal logic
        openChatbotBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (chatbotModal) {
                chatbotModal.classList.add('active');
                chatbotInput.value = '';
                chatbotInput.focus();
                // Show welcome message if no messages exist
                if (chatbotMessages && chatbotMessages.childElementCount === 0) {
                    const welcomeDiv = document.createElement('div');
                    welcomeDiv.className = 'chat-message bot-message';
                    welcomeDiv.innerHTML = `<div class="bubble"><span>Hi how can I help you today?</span></div>`;
                    chatbotMessages.appendChild(welcomeDiv);
                }
            }
            fabMenuBtn.classList.remove('open');
            openFeedbackBtn.classList.remove('show');
            openChatbotBtn.classList.remove('show');
        });
        if (closeChatbotBtn && chatbotModal) {
            closeChatbotBtn.addEventListener('click', () => {
                chatbotModal.classList.remove('active');
            });
            chatbotModal.addEventListener('mousedown', (e) => {
                if (e.target === chatbotModal) {
                    chatbotModal.classList.remove('active');
                }
            });
        }
        if (sendChatbotBtn && chatbotInput && chatbotMessages) {
            sendChatbotBtn.addEventListener('click', async () => {
                const userMessage = chatbotInput.value.trim();
                if (!userMessage) return;

                // Display user message
                const userMsgDiv = document.createElement('div');
                userMsgDiv.className = 'chat-message user-message';
                userMsgDiv.innerHTML = `<div class="bubble"><span>${userMessage}</span></div>`;
                chatbotMessages.appendChild(userMsgDiv);
                chatbotInput.value = '';
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

                // Call the generate API (from generate.js)
                try {
                    // Show a loading message or spinner
                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'chat-message bot-message';
                    loadingDiv.innerHTML = `<div class="bubble"><span>Generating response...</span></div>`;
                    chatbotMessages.appendChild(loadingDiv);
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

                    const response = await fetch('https://8080-01jn12c923ggt7x62zr7n2zekz.cloudspaces.litng.ai/predict', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: userMessage, duration: 30 })
                    });

                    let botReply = "Sorry, I couldn't generate a response.";
                    if (response.ok) {
                        // If the API returns text, parse and display it
                        const result = await response.json();
                        // Adjust this according to your API's response structure
                        botReply = result.text || result.message || "Here's your generated content!";
                    }

                    // Remove loading message
                    chatbotMessages.removeChild(loadingDiv);

                    // Display bot reply
                    const botMsgDiv = document.createElement('div');
                    botMsgDiv.className = 'chat-message bot-message';
                    botMsgDiv.innerHTML = `<div class="bubble"><span>${botReply}</span></div>`;
                    chatbotMessages.appendChild(botMsgDiv);
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
                } catch (error) {
                    // Remove loading message if present
                    const loadingDivs = chatbotMessages.querySelectorAll('.bot-message');
                    if (loadingDivs.length > 0) chatbotMessages.removeChild(loadingDivs[loadingDivs.length - 1]);

                    const botMsgDiv = document.createElement('div');
                    botMsgDiv.className = 'chat-message bot-message';
                    botMsgDiv.innerHTML = `<div class="bubble"><span>Error: ${error.message}</span></div>`;
                    chatbotMessages.appendChild(botMsgDiv);
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
                }
            });
        }
    }
});