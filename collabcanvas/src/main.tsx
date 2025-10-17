import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
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
  (window as any).testAI = async (command: string) => {
    const userId = (window as any).getCurrentUserId();
    if (!userId) return;
    
    const ai = new AIService();
    const result = await ai.executeCommand(command, userId);
    console.log(result.message);
    
    // Show toast notification based on result
    if (result.success) {
      toast.success(result.message, {
        duration: 3000,
      });
    } else {
      toast.error(result.message, {
        duration: 4000,
      });
    }
    
    return result;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  </StrictMode>,
)
