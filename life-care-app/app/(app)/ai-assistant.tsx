import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

export default function AIAssistantScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${user?.name || ''}! How can I help you today with your health data or predictions? 😊`,
      sender: 'bot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // API Integration to the AI Backend
      // Real backend endpoint would be something like: apiClient.post('/ai/chat', { prompt: userMsg.text })
      // For now, we simulate the network request and retry logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I have analyzed your request based on your recent medical vitals. Your heart rate is stable, but I recommend staying hydrated.',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I lost connection to the server. Please try again.',
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'user';
    return (
      <View className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
        <View className={`p-4 ${isMe ? 'bg-blue-600 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl' : 'bg-white border border-slate-200 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'}`}>
          <Text className={`text-base ${isMe ? 'text-white' : 'text-slate-800'}`}>{item.text}</Text>
        </View>
        <Text className={`text-xs text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{item.time}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-white border-b border-slate-200" style={{ paddingTop: Platform.OS === 'android' ? 40 : 16 }}>
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
          <Ionicons name="sparkles" size={24} color="#2563EB" />
        </View>
        <View>
          <Text className="text-xl font-bold text-slate-800">Health AI Assistant</Text>
          <Text className="text-sm text-slate-500">Fast analysis & predictions</Text>
        </View>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View className="self-start bg-white border border-slate-200 rounded-2xl p-4 mb-4">
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : null
          }
        />

        {/* Input Area */}
        <View className="flex-row p-4 bg-white border-t border-slate-200 items-center pb-8">
          <View className="flex-1 bg-slate-100 h-14 rounded-full flex-row items-center px-4 mr-3">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your health..."
              className="flex-1 h-full text-base text-slate-800"
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity 
            onPress={handleSend} 
            disabled={!input.trim() || isTyping}
            className={`w-14 h-14 rounded-full items-center justify-center ${input.trim() ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <Ionicons name="send" size={20} color="white" className="ml-1" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
