import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { testWorkerQueries } from '../lib/services/worker-data-test';

/**
 * This is a simple test component that you can add to any screen
 * to run the worker data test and see the results.
 * 
 * To use, import this component and add it to your screen:
 * import WorkerDataTester from '../components/WorkerDataTester';
 * 
 * Then add it to your JSX:
 * <WorkerDataTester />
 */
const WorkerDataTester = () => {
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Capture console.log output
  const captureConsole = () => {
    const originalLog = console.log;
    const originalError = console.error;
    const logs = [];
    
    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push({ type: 'log', message });
    };
    
    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push({ type: 'error', message });
    };
    
    return {
      logs,
      restore: () => {
        console.log = originalLog;
        console.error = originalError;
      }
    };
  };
  
  const runTest = async () => {
    setIsRunning(true);
    setOutput([]);
    
    const console_capture = captureConsole();
    
    try {
      await testWorkerQueries();
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      console_capture.restore();
      setOutput(console_capture.logs);
      setIsRunning(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Data Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runTest}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Test...' : 'Run Worker Data Test'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.outputContainer}>
        {output.map((item, index) => (
          <Text 
            key={index} 
            style={[
              styles.outputText,
              item.type === 'error' && styles.errorText
            ]}
          >
            {item.message}
          </Text>
        ))}
        
        {output.length === 0 && !isRunning && (
          <Text style={styles.placeholder}>
            Test output will appear here
          </Text>
        )}
        
        {isRunning && (
          <Text style={styles.placeholder}>
            Running test...
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  outputContainer: {
    marginTop: 16,
    backgroundColor: '#002B36',
    borderRadius: 6,
    padding: 12,
    maxHeight: 400,
  },
  outputText: {
    color: '#93A1A1',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#DC322F',
  },
  placeholder: {
    color: '#586E75',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default WorkerDataTester;
