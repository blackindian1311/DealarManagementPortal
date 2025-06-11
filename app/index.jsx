// File: app/_layout.js
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from '../context/AppContext';

export default function Layout() {
  return (
    <PaperProvider>
      <AppProvider>
        <Slot />
      </AppProvider>
    </PaperProvider>
  );
}


// File: context/AppContext.js
import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [parties, setParties] = useState([]);

  const addParty = (name) => {
    setParties((prev) => [...prev, { id: uuidv4(), name, entries: [] }]);
  };

  const addEntry = (partyId, entry) => {
    setParties((prev) =>
      prev.map((p) =>
        p.id === partyId ? { ...p, entries: [...p.entries, entry] } : p
      )
    );
  };

  return (
    <AppContext.Provider value={{ parties, addParty, addEntry }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}


// File: app/index.js (Home Screen)
import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { TextInput, Button, Card, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function HomeScreen() {
  const { parties, addParty } = useApp();
  const [name, setName] = useState('');
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Appbar.Header>
        <Appbar.Content title="Parties" />
      </Appbar.Header>

      <TextInput
        label="New Party Name"
        value={name}
        onChangeText={setName}
        style={{ marginVertical: 8 }}
      />
      <Button
        mode="contained"
        onPress={() => {
          if (name.trim()) {
            addParty(name);
            setName('');
          }
        }}
      >
        Add Party
      </Button>

      <FlatList
        data={parties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={{ marginVertical: 8 }}
            onPress={() => router.push(`/${item.id}`)}
          >
            <Card.Title title={item.name} />
          </Card>
        )}
      />
    </View>
  );
}


// File: app/[partyId]/index.js (Party Details Screen)
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, FlatList } from 'react-native';
import { Appbar, Button, Card, Text } from 'react-native-paper';
import { useApp } from '../../context/AppContext';

export default function PartyDetailsScreen() {
  const { partyId } = useLocalSearchParams();
  const router = useRouter();
  const { parties } = useApp();

  const party = parties.find((p) => p.id === partyId);
  if (!party) return <Text>Party not found</Text>;

  const balance = party.entries.reduce((acc, entry) => {
    if (entry.type === 'purchase') return acc - Number(entry.amount);
    if (entry.type === 'return' || entry.type === 'payment') return acc + Number(entry.amount);
    return acc;
  }, 0);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={party.name} />
      </Appbar.Header>

      <Text style={{ marginBottom: 8, fontSize: 18 }}>Balance: ₹{balance}</Text>

      <FlatList
        data={party.entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <Card.Title
              title={`${item.type.toUpperCase()} — ₹${item.amount}`}
              subtitle={item.date}
            />
          </Card>
        )}
      />

      <Button
        mode="contained"
        onPress={() => router.push(`/${partyId}/add-entry`)}
        style={{ marginTop: 16 }}
      >
        Add Entry
      </Button>
    </View>
  );
}


// File: app/[partyId]/add-entry.js (Add Entry Screen)
import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar, Button, TextInput, RadioButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

export default function AddEntryScreen() {
  const { partyId } = useLocalSearchParams();
  const router = useRouter();
  const { addEntry } = useApp();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('purchase');

  const handleAdd = () => {
    if (!amount) return;
    addEntry(partyId, {
      id: uuidv4(),
      amount,
      type,
      date: new Date().toLocaleDateString(),
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Entry" />
      </Appbar.Header>

      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ marginBottom: 16 }}
      />

      <RadioButton.Group onValueChange={setType} value={type}>
        <RadioButton.Item label="Purchase" value="purchase" />
        <RadioButton.Item label="Payment" value="payment" />
        <RadioButton.Item label="Return" value="return" />
      </RadioButton.Group>

      <Button mode="contained" onPress={handleAdd} style={{ marginTop: 16 }}>
        Save Entry
      </Button>
    </View>
  );
}

