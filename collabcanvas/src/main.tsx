import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorProvider } from './contexts/ErrorContext'
import './index.css'
import App from './App.tsx'
import { canvasService } from './services/canvasService'
import { AIService } from './services/aiService'
import { auth } from './firebase'

// Expose services globally for testing in console
if (typeof window !== 'undefined') {
  (window as any).canvasService = canvasService;
  (window as any).AIService = AIService;
  (window as any).firebaseAuth = auth;
  
  // Helper function to get current user ID
  (window as any).getCurrentUserId = () => {
    const user = auth.currentUser;
    if (user) {
      console.log('✅ Logged in as:', user.email, '| User ID:', user.uid);
      return user.uid;
    } else {
      console.error('❌ Not logged in! Please log in to the app first.');
      return null;
    }
  };
  
  // Helper function for quick AI testing
  (window as any).testAI = async (command: string, canvasId: string = 'test-canvas') => {
    const userId = (window as any).getCurrentUserId();
    if (!userId) return;
    
    const ai = new AIService();
    const result = await ai.executeCommand(command, userId, canvasId);
    console.log(result.message);
    
    return result;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorProvider>
  </StrictMode>,
)
