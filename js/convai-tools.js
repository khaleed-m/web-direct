// ============================================================================
// ELEVENLABS CONVAI WIDGET SETUP
// ============================================================================
// 
// CHANGE THESE VALUES FOR YOUR SITE:
// ============================================================================

// REQUIRED: Replace with your ElevenLabs agent ID
const AGENT_ID = 'agent_7301ke18m7djeaj9batg0drshgbw';

// OPTIONAL: Change navigation behavior
const OPEN_IN_NEW_TAB = true; // true = new tab, false = same tab

// OPTIONAL: Change widget position
const WIDGET_POSITION = 'bottom-right'; // 'bottom-right', 'bottom-left', 'top-right', 'top-left'

// OPTIONAL: Base URL for navigation (leave empty for auto-detection)
const BASE_URL = ''; // e.g., 'https://mysite.framer.app' or 'https://mysite.wixsite.com/mysite'

// ============================================================================
// DON'T CHANGE ANYTHING BELOW THIS LINE
// ============================================================================

// Create and inject the widget with client tools
function injectElevenLabsWidget() {
  const ID = 'elevenlabs-convai-widget';
  
  // Check if the widget is already loaded
  if (document.getElementById(ID)) {
    return;
  }

  // Create widget script
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
  script.async = true;
  script.type = 'text/javascript';
  document.head.appendChild(script);

  // Create wrapper and widget
  const wrapper = document.createElement('div');
  wrapper.className = `convai-widget ${WIDGET_POSITION}`;

  const widget = document.createElement('elevenlabs-convai');
  widget.id = ID;
  widget.setAttribute('agent-id', AGENT_ID);
  widget.setAttribute('variant', 'full');

  // Listen for the widget's "call" event to inject client tools
  widget.addEventListener('elevenlabs-convai:call', (event) => {
    event.detail.config.clientTools = {
      bookDemo: async ({ firstName, lastName, email, company, phone, industry, employees, useCase, message }) => {
        console.log('bookDemo called with:', { firstName, lastName, email, company, phone, industry, employees, useCase, message });
        
        try {
          const response = await fetch('/api/voice-demo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName,
              lastName,
              email,
              company,
              phone,
              industry,
              employees,
              useCase,
              message
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            return {
              success: true,
              message: result.message
            };
          } else {
            return {
              success: false,
              message: result.message || 'Sorry, there was an error booking your demo. Please try again.'
            };
          }
        } catch (error) {
          console.error('Error booking demo:', error);
          return {
            success: false,
            message: 'Sorry, there was a network error. Please check your connection and try again.'
          };
        }
      }
    };
  });

  // Clean up chat messages by removing Agent tags
  widget.addEventListener('elevenlabs-convai:message', (event) => {
    setTimeout(() => {
      // Try multiple selectors to find message content
      const selectors = [
        '[data-message-content]',
        '.message-content', 
        '.convai-message',
        'div[role="log"] div',
        'p', 'span', 'div'
      ];
      
      selectors.forEach(selector => {
        const messages = widget.shadowRoot?.querySelectorAll(selector) || widget.querySelectorAll(selector);
        messages?.forEach(msg => {
          if (msg.textContent && msg.textContent.includes('<Agent>')) {
            msg.textContent = msg.textContent
              .replace(/<Agent>/g, '')
              .replace(/<\/Agent>/g, '')
              .replace(/&lt;Agent&gt;/g, '')
              .replace(/&lt;\/Agent&gt;/g, '')
              .trim();
          }
          if (msg.innerHTML && msg.innerHTML.includes('Agent')) {
            msg.innerHTML = msg.innerHTML
              .replace(/<Agent>/g, '')
              .replace(/<\/Agent>/g, '')
              .replace(/&lt;Agent&gt;/g, '')
              .replace(/&lt;\/Agent&gt;/g, '')
              .trim();
          }
        });
      });
    }, 50);
  });
  
  // Also clean on DOM mutations
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      const allText = widget.shadowRoot?.querySelectorAll('*') || widget.querySelectorAll('*');
      allText?.forEach(el => {
        if (el.textContent && el.textContent.includes('Agent')) {
          el.textContent = el.textContent
            .replace(/<Agent>/g, '')
            .replace(/<\/Agent>/g, '')
            .replace(/&lt;Agent&gt;/g, '')
            .replace(/&lt;\/Agent&gt;/g, '')
            .trim();
        }
      });
    }, 100);
  });
  
  if (widget.shadowRoot) {
    observer.observe(widget.shadowRoot, { childList: true, subtree: true });
  } else {
    observer.observe(widget, { childList: true, subtree: true });
  }

  // Attach widget to the DOM
  wrapper.appendChild(widget);
  document.body.appendChild(wrapper);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectElevenLabsWidget);
} else {
  injectElevenLabsWidget();
}