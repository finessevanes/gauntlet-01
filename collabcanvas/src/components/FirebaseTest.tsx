import { useEffect, useState } from 'react';
import { firestore, database } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, set, get, remove } from 'firebase/database';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export default function FirebaseTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Firestore Write', status: 'pending' },
    { name: 'Firestore Read', status: 'pending' },
    { name: 'Realtime Database Write', status: 'pending' },
    { name: 'Realtime Database Read', status: 'pending' },
  ]);

  const updateTest = (index: number, status: 'success' | 'error', message?: string) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, status, message } : test))
    );
  };

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    // Test 1: Firestore Write
    try {
      const testData = {
        message: 'Hello from Firestore!',
        timestamp: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(firestore, 'test'), testData);
      updateTest(0, 'success', `Document ID: ${docRef.id}`);

      // Test 2: Firestore Read
      try {
        const querySnapshot = await getDocs(collection(firestore, 'test'));
        const count = querySnapshot.size;
        updateTest(1, 'success', `Found ${count} document(s)`);

        // Clean up: Delete test documents
        querySnapshot.forEach(async (document) => {
          await deleteDoc(doc(firestore, 'test', document.id));
        });
      } catch (error) {
        updateTest(1, 'error', (error as Error).message);
      }
    } catch (error) {
      updateTest(0, 'error', (error as Error).message);
    }

    // Test 3: Realtime Database Write
    try {
      const testRef = ref(database, 'test/connection');
      await set(testRef, {
        message: 'Hello from RTDB!',
        timestamp: new Date().toISOString(),
      });
      updateTest(2, 'success', 'Data written successfully');

      // Test 4: Realtime Database Read
      try {
        const snapshot = await get(testRef);
        if (snapshot.exists()) {
          updateTest(3, 'success', `Data: ${snapshot.val().message}`);
        } else {
          updateTest(3, 'error', 'No data found');
        }

        // Clean up: Remove test data
        await remove(testRef);
      } catch (error) {
        updateTest(3, 'error', (error as Error).message);
      }
    } catch (error) {
      updateTest(2, 'error', (error as Error).message);
    }
  };

  const getStatusEmoji = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const allTestsPassed = tests.every((test) => test.status === 'success');

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '20px',
        border: '2px solid #646cff',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
      }}
    >
      <h2 style={{ marginTop: 0 }}>🔥 Firebase Emulator Test</h2>
      <p style={{ color: '#888', fontSize: '14px' }}>
        Testing connections to Firebase Emulators...
      </p>

      <div style={{ marginTop: '20px' }}>
        {tests.map((test, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: '#242424',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>
                {getStatusEmoji(test.status)} {test.name}
              </strong>
              {test.message && (
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  {test.message}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {allTestsPassed && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '4px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          🎉 All tests passed! Firebase Emulators are working correctly.
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#242424',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#888',
        }}
      >
        <strong>Next Steps:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Check Emulator UI at <a href="http://localhost:4000" target="_blank" style={{ color: '#646cff' }}>http://localhost:4000</a></li>
          <li>Verify data was written and cleaned up</li>
          <li>Ready to start building authentication (PR #1)</li>
        </ul>
      </div>
    </div>
  );
}

