import { ExpoTruemetricsSdk } from 'expo-truemetrics-sdk';
import { Button, SafeAreaView, ScrollView, Text, View, TextInput, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const Stack = createNativeStackNavigator();

function MetadataScreen({ navigation }: { navigation: any }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleLogMetadata = async () => {
    try {
      const metadata = { [key]: value };
      metadata[key] = value;
      await ExpoTruemetricsSdk.logMetadata(metadata);
    } catch (error) {
      console.error('Error logging metadata:', error);
    }
  };

  return (
    <SafeAreaView style={styles.metadataContainer}>
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, styles.inputHalf]}
        placeholder="Key"
        value={key}
        onChangeText={setKey}
      />
      <TextInput
        style={[styles.input, styles.inputHalf]}
        placeholder="Value"
        value={value}
        onChangeText={setValue}
      />
    </View>
    <Button title="Log metadata" onPress={handleLogMetadata} />
  </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const PERMISSION_MAP: { [key: string]: (options?: any) => Promise<any> } = {
  'android.permission.ACCESS_FINE_LOCATION': Location.requestForegroundPermissionsAsync,
  'android.permission.ACCESS_COARSE_LOCATION': Location.requestForegroundPermissionsAsync,
};

function MainScreen({ navigation }: { navigation: any }) {
  const [apiKey, setApiKey] = useState('');
  const [sdkState, setSdkState] = useState('');
  const [sdkError, setSdkError] = useState('');
  const [permissionsNeeded, setPermissionsNeeded] = useState('');

  useEffect(() => {
    loadSavedApiKey();
  }, []);

  useEffect(() => {
    const stateSubscription = ExpoTruemetricsSdk.addListener(
      'onSdkStateChanged',
      (event) => {
        console.log("onSdkStateChanged event received with value: ", event.value);
        setSdkState(event.value);
      }
    );

    const errorSubscription = ExpoTruemetricsSdk.addListener(
      'onSdkError',
      (event) => setSdkError(event.value)
    );

    const permissionSubscription = ExpoTruemetricsSdk.addListener(
      'onSdkPermissionNeeded',
      (event) => {
        setPermissionsNeeded(event.value)
        handlePermissionsRequest(event.value);
      });

    return () => {
      stateSubscription.remove();
      errorSubscription.remove();
      permissionSubscription.remove();
    };
  }, []);

  const handlePermissionsRequest = async (permissionsNeeded: string) => {
    const permissions = permissionsNeeded
      .replace('[', '')
      .replace(']', '')
      .split(',')
      .map(p => p.trim());

      try {
        for (const permission of permissions) {
          const requestPermission = PERMISSION_MAP[permission];
          if (!requestPermission) {
            console.warn(`No permission handler found for: ${permission}`);
            continue;
          }
  
          const { status } = await requestPermission();
          console.log(`Permission ${permission} status: ${status}`);
          
          if (status !== 'granted') {
            console.warn(`Permission ${permission} was denied`);
          }
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
  };

  const loadSavedApiKey = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem('apiKey');
      if (savedApiKey !== null) {
        setApiKey(savedApiKey);
      }
    } catch (error) {
      console.error('Error loading saved API key:', error);
    }
  };

  const handleApiKeyChange = async (newApiKey: string) => {
    try {
      await AsyncStorage.setItem('apiKey', newApiKey);
      setApiKey(newApiKey);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Truemetrics SDK API Demo</Text>
        <Group name="Init">
          {ExpoTruemetricsSdk.isInitialized() ? (
            <Button
              title="Deinitialize"
              onPress={async () => {
                await ExpoTruemetricsSdk.deinitialize();
              }}
            />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter API Key"
                value={apiKey}
                onChangeText={handleApiKeyChange}
              />
              <View style={styles.buttonSpacing}>
                <Button
                  title="Initialize"
                  onPress={async () => {
                    await ExpoTruemetricsSdk.initialize({
                      apiKey: apiKey,
                      debug: true
                    });
                  }}
                />
              </View>
            </>
          )}
        </Group>

        {ExpoTruemetricsSdk.isInitialized() && (
            <Group name="Recording">
              {!ExpoTruemetricsSdk.isRecordingInProgress() && (
                <Button
                  title="Start recording"
                  onPress={async () => {
                    await ExpoTruemetricsSdk.startRecording();
                  }}
                />
              )}
              {ExpoTruemetricsSdk.isRecordingInProgress() && (
                <Button
                  title="Stop recording"
                  onPress={async () => {
                    await ExpoTruemetricsSdk.stopRecording();
                  }}
                />
              )}
            </Group>
        )}

        {ExpoTruemetricsSdk.isInitialized() && (
            <Group name="Metadata">
              <Button
                title="Log metadata"
                onPress={() => navigation.navigate('Metadata')}
              />
            </Group>
        )}

        <Group name="Events">
          <Text>State: {sdkState}</Text>
          <Text>Error: {sdkError}</Text>
          <Text>Permissions Needed: {permissionsNeeded}</Text>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Main" 
            component={MainScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Metadata" 
            component={MetadataScreen}
            options={{ 
              title: 'Log Metadata',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  view: {
    flex: 1,
    height: 200,
  },
  buttonSpacing: {
    marginTop: 10,
  },
  metadataContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#eee',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  inputHalf: {
    width: '48%',
  },
});