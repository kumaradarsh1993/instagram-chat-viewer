import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import _ from 'lodash';

function InstagramChatViewer() {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const chatContainerRef = useRef(null);
  const messageRefs = useRef({});

  const parseMessages = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const messageNodes = doc.querySelectorAll('.uiBoxWhite.noborder');
    
    const messagesArray = Array.from(messageNodes).reverse();
    
    const filteredMessages = messagesArray.filter(node => {
      const content = node.querySelector('._a6-p')?.textContent || '';
      return !/[\u0C80-\u0CFF\u0C00-\u0C7F]/.test(content);
    });
    
    return filteredMessages.map((node, index) => {
      const sender = node.querySelector('._a6-h')?.textContent || '';
      const content = node.querySelector('._a6-p')?.textContent || '';
      const timestamp = node.querySelector('._a6-o')?.textContent || '';
      const reactions = Array.from(node.querySelectorAll('._a6-q li'))
        .map(li => li.textContent)
        .filter(text => !text.includes('Kumar Adarsh'));
      
      const isLiked = content.includes('❤️ Kumar Adarsh');
      const cleanContent = isLiked ? content.split('\n')[0] : content;
      return {
        id: `msg-${index}`,
        index,
        sender,
        content: cleanContent,
        timestamp,
        reactions,
        isLiked: isLiked,
        isCurrentUser: sender.trim() === 'Kumar Adarsh'
      };
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const parsedMessages = parseMessages(text);
      setMessages(parsedMessages);
      
      setSearchTerm('');
      setSearchResults([]);
      setIsSearchActive(false);
      
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error loading chat file. Please make sure it\'s a valid Instagram chat export HTML file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }

    const results = messages
      .map((message, index) => ({
        index,
        matches: 
          message.content.toLowerCase().includes(term.toLowerCase()) ||
          message.sender.toLowerCase().includes(term.toLowerCase())
      }))
      .filter(result => result.matches)
      .map(result => result.index);

    setSearchResults(results);
    setCurrentSearchIndex(0);
    setIsSearchActive(true);

    if (results.length > 0) {
      scrollToMessage(results[0]);
    }
  };

  const scrollToMessage = (index) => {
    const messageElement = messageRefs.current[`msg-${index}`];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('search-highlight');
      setTimeout(() => {
        messageElement.classList.remove('search-highlight');
      }, 1000);
    }
  };

  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    
    const newIndex = direction === 'next'
      ? (currentSearchIndex + 1) % searchResults.length
      : (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    
    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex]);
  };

  return (
    <div className="h-screen bg-white">
      <style jsx>{`
        @keyframes highlightFade {
          0%, 50% { background-color: rgba(250, 204, 21, 0.2); }
          100% { background-color: transparent; }
        }
        .search-highlight {
          animation: highlightFade 1s ease-out;
        }
      `}</style>
      <div className="h-full flex flex-col max-w-2xl mx-auto">
        <div className="p-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900">
              Instagram Chat History
            </h1>
            <label className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all">
              <Upload className="h-4 w-4" />
              <span>Upload Chat</span>
              <input
                type="file"
                accept=".html"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 pl-8 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            
            {isSearchActive && searchResults.length > 0 && (
              <div className="absolute right-2 top-1.5 flex items-center space-x-1 bg-white rounded-md shadow-sm border px-1.5 py-0.5">
                <span className="text-xs text-gray-500">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <button
                  onClick={() => navigateSearch('prev')}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => navigateSearch('next')}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleSearch('')}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
              <Upload className="h-12 w-12" />
              <p className="text-sm">Upload an Instagram chat export HTML file to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  ref={el => messageRefs.current[message.id] = el}
                  className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                >
                  <div 
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words
                      ${message.isCurrentUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                      } ${
                      isSearchActive && searchResults.includes(message.index)
                        ? 'ring-2 ring-yellow-400'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      {!message.isCurrentUser && (
                        <span className={`text-xs font-medium mb-1
                          ${message.isCurrentUser ? 'text-blue-50' : 'text-gray-500'}
                        `}>
                          {message.sender}
                        </span>
                      )}
                      <div className="flex items-start space-x-1">
                        <p>{message.content}</p>
                        {message.isLiked && (
                          <span className="text-red-500 text-xs">❤️</span>
                        )}
                      </div>
                      {message.reactions?.length > 0 && (
                        <div className={`mt-1 text-xs
                          ${message.isCurrentUser ? 'text-blue-100' : 'text-gray-500'}
                        `}>
                          {message.reactions.map((reaction, i) => (
                            <span key={i} className="mr-1">{reaction}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] text-gray-400 self-end mb-0.5 mx-2 opacity-0 group-hover:opacity-100 transition-opacity
                    ${message.isCurrentUser ? 'order-first' : 'order-last'}
                  `}>
                    {message.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstagramChatViewer;