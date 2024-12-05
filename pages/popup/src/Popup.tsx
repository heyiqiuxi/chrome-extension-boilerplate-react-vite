import '@src/Popup.css';
import './Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useState, useEffect } from 'react';

const Popup = () => {
  const [normalText, setNormalText] = useState('');
  const [platformText, setPlatformText] = useState('');
  const [activeTab, setActiveTab] = useState('normal');

  const handleTabClick = (tab: 'normal' | 'platform') => {
    setActiveTab(tab);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeTab === 'normal') {
      console.log(e.target.value, 'normal');
      chrome.storage.local.set({ normalText: e.target.value });
      setNormalText(e.target.value);
    } else {
      chrome.storage.local.set({ platformText: e.target.value });
      setPlatformText(e.target.value);
    }
    sendText();
  };

  useEffect(() => {
    chrome.storage.local.get(['normalText', 'platformText'], result => {
      setNormalText(result.normalText || '');
      setPlatformText(result.platformText || '');
    });
  }, []);

  const sendText = () => {
    chrome.runtime.sendMessage({ type: 'getData' });
  };

  return (
    <div className="my-floating-element">
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'normal' ? 'active' : ''}`}
          onClick={() => handleTabClick('normal')}>
          普通
        </button>
        <button
          className={`tab-button ${activeTab === 'platform' ? 'active' : ''}`}
          onClick={() => handleTabClick('platform')}>
          平台
        </button>
      </div>
      <textarea
        className="text-content"
        placeholder="请输入内容"
        value={activeTab === 'normal' ? normalText : platformText}
        onChange={handleTextChange}
      />
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
